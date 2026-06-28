import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { RowDataPacket } from "mysql2";

interface ItemRow extends RowDataPacket {
  id: number;
  order_id: number;
  status: string;
}

interface ItemCountRow extends RowDataPacket {
  total: number;
  ready: number;
}

const patchSchema = z.object({
  status: z.enum(["pending", "ready"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await requireRole("admin", "kitchen");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, itemId } = await params;
  const orderId = Number(id);
  const itemIdNum = Number(itemId);

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [items] = await db.execute<ItemRow[]>(
    "SELECT id, order_id, status FROM order_items WHERE id = ? AND order_id = ? LIMIT 1",
    [itemIdNum, orderId]
  );

  if (!items.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.execute("UPDATE order_items SET status = ? WHERE id = ?", [parsed.data.status, itemIdNum]);

  // Auto-mark order as ready when all items are ready
  if (parsed.data.status === "ready") {
    const [counts] = await db.execute<ItemCountRow[]>(
      "SELECT COUNT(*) AS total, SUM(status = 'ready') AS ready FROM order_items WHERE order_id = ?",
      [orderId]
    );
    if (counts[0].total === counts[0].ready) {
      await db.execute("UPDATE orders SET status = 'ready' WHERE id = ? AND status != 'delivered'", [
        orderId,
      ]);
    }
  }

  return NextResponse.json({ ok: true });
}
