import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { RowDataPacket } from "mysql2";

interface OrderRow extends RowDataPacket {
  id: number;
  status: string;
}

const patchSchema = z.object({
  status: z.enum(["pending", "in_progress", "ready", "delivered", "cancelled"]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin", "waiter", "kitchen");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = Number(id);
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [rows] = await db.execute<OrderRow[]>(
    "SELECT id, status FROM orders WHERE id = ? LIMIT 1",
    [orderId]
  );

  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.execute("UPDATE orders SET status = ? WHERE id = ?", [parsed.data.status, orderId]);

  return NextResponse.json({ ok: true });
}
