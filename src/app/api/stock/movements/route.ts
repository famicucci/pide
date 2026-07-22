import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";

interface MovementRow extends RowDataPacket {
  id: number;
  stock_item_id: number;
  movement_type: "initial" | "adjustment";
  user_id: number;
  previous_quantity: string | null;
  new_quantity: string;
  difference: string;
  notes: string | null;
  created_at: string;
  item_name: string;
  item_brand: string | null;
  unit: string;
  user_name: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export async function GET(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(params.get("limit")) || 50, 1), 100);
  const offset = Math.max(Number(params.get("offset")) || 0, 0);
  const itemId = Number(params.get("item_id"));
  const userId = Number(params.get("user_id"));

  const conditions: string[] = [];
  const values: number[] = [];
  if (Number.isInteger(itemId) && itemId > 0) {
    conditions.push("m.stock_item_id = ?");
    values.push(itemId);
  }
  if (Number.isInteger(userId) && userId > 0) {
    conditions.push("m.user_id = ?");
    values.push(userId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.execute<MovementRow[]>(
    `SELECT m.id, m.stock_item_id, m.movement_type, m.user_id,
            m.previous_quantity, m.new_quantity, m.difference, m.notes, m.created_at,
            i.name AS item_name, i.brand AS item_brand, i.unit,
            u.name AS user_name
     FROM stock_movements m
     JOIN stock_items i ON i.id = m.stock_item_id
     JOIN users u ON u.id = m.user_id
     ${where}
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  const [countRows] = await db.execute<CountRow[]>(
    `SELECT COUNT(*) AS total FROM stock_movements m ${where}`,
    values
  );

  return NextResponse.json({
    total: countRows[0]?.total ?? 0,
    movements: rows.map((row) => ({
      ...row,
      previous_quantity: row.previous_quantity === null ? null : Number(row.previous_quantity),
      new_quantity: Number(row.new_quantity),
      difference: Number(row.difference),
    })),
  });
}
