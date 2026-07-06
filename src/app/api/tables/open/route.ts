import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { RowDataPacket } from "mysql2";

interface OpenTableRow extends RowDataPacket {
  id: number;
  name: string;
  total: number;
}

export async function GET() {
  const session = await requireRole("admin", "kitchen");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows] = await db.execute<OpenTableRow[]>(`
    SELECT
      t.id,
      t.name,
      COALESCE((
        SELECT SUM(oi.quantity * oi.unit_price)
        FROM orders o2
        JOIN order_items oi ON oi.order_id = o2.id
        WHERE o2.table_id = t.id
          AND o2.status NOT IN ('cancelled')
          AND o2.created_at >= t.opened_at
      ), 0) AS total
    FROM \`tables\` t
    WHERE t.is_open = 1
    ORDER BY t.name ASC
  `);

  return NextResponse.json(rows.map((r) => ({ ...r, total: Number(r.total) })));
}
