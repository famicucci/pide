import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader } from "mysql2";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const fields: string[] = [];
  const values: Array<string | number | boolean> = [];
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      fields.push(`\`${key}\` = ?`);
      values.push(value);
    }
  }

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE stock_categories SET ${fields.join(", ")} WHERE id = ?`,
      [...values, categoryId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre." }, { status: 409 });
    }
    throw error;
  }
}
