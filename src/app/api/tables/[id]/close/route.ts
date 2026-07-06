import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin", "kitchen");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tableId = Number(id);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Mark any still-pending/ready orders as delivered
    await conn.execute(
      "UPDATE orders SET status = 'delivered' WHERE table_id = ? AND status IN ('pending', 'ready')",
      [tableId]
    );
    // Close the table and clear session so next group must create a new one
    await conn.execute(
      "UPDATE `tables` SET is_open = 0, session_key = NULL, session_id = NULL WHERE id = ?",
      [tableId]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return NextResponse.json({ ok: true });
}
