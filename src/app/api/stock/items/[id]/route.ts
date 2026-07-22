import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader } from "mysql2";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STOCK_UNIT_VALUES } from "@/lib/stock-units";

const updateSchema = z.object({
  category_id: z.number().int().positive().optional(),
  brand: z.string().trim().max(100).nullable().optional(),
  name: z.string().trim().min(1).max(150).optional(),
  unit: z.enum(STOCK_UNIT_VALUES).optional(),
  minimum_low_season: z.number().nonnegative().nullable().optional(),
  minimum_high_season: z.number().nonnegative().nullable().optional(),
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
  const itemId = Number(id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const fields: string[] = [];
  const values: Array<string | number | boolean | null> = [];
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      fields.push(`\`${key}\` = ?`);
      values.push(key === "brand" && value === "" ? null : value);
    }
  }

  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE stock_items SET ${fields.join(", ")} WHERE id = ?`,
    [...values, itemId]
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
