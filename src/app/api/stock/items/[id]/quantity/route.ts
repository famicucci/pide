import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";

interface QuantityRow extends RowDataPacket {
  current_quantity: string;
  active: number;
}

const updateSchema = z.object({
  quantity: z.number().nonnegative().max(99_999_999.99),
  notes: z.string().trim().max(500).optional().default(""),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("admin", "stock");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<QuantityRow[]>(
      "SELECT current_quantity, active FROM stock_items WHERE id = ? FOR UPDATE",
      [itemId]
    );
    const item = rows[0];
    if (!item || !item.active) {
      await connection.rollback();
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const previousQuantity = Number(item.current_quantity);
    const newQuantity = parsed.data.quantity;
    if (previousQuantity === newQuantity) {
      await connection.rollback();
      return NextResponse.json({ ok: true, unchanged: true, quantity: newQuantity });
    }

    const difference = Number((newQuantity - previousQuantity).toFixed(2));
    await connection.execute(
      "UPDATE stock_items SET current_quantity = ? WHERE id = ?",
      [newQuantity, itemId]
    );
    await connection.execute(
      `INSERT INTO stock_movements
        (stock_item_id, movement_type, user_id, previous_quantity, new_quantity, difference, notes)
       VALUES (?, 'adjustment', ?, ?, ?, ?, ?)`,
      [
        itemId,
        session.userId,
        previousQuantity,
        newQuantity,
        difference,
        parsed.data.notes || null,
      ]
    );

    await connection.commit();
    return NextResponse.json({
      ok: true,
      previous_quantity: previousQuantity,
      quantity: newQuantity,
      difference,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
