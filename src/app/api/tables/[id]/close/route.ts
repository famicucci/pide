import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin", "kitchen");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.execute(
    "UPDATE orders SET status = 'delivered' WHERE table_id = ? AND status IN ('pending', 'ready')",
    [Number(id)]
  );

  return NextResponse.json({ ok: true });
}
