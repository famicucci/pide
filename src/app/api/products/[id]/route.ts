import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";

const updateSchema = z.object({
  category_id: z.number().int().positive().optional(),
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional(),
  price: z.number().positive().optional(),
  available: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const fields = Object.entries(parsed.data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`);
  const values = Object.values(parsed.data).filter((v) => v !== undefined);

  if (!fields.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  await db.execute(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, [...values, Number(id)]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.execute("UPDATE products SET available = 0 WHERE id = ?", [Number(id)]);
  return NextResponse.json({ ok: true });
}
