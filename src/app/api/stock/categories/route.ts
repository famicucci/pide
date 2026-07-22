import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  sort_order: number;
  active: number;
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sort_order: z.number().int().default(0),
});

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows] = await db.execute<CategoryRow[]>(`
    SELECT id, name, sort_order, active
    FROM stock_categories
    ORDER BY sort_order ASC, name ASC
  `);

  return NextResponse.json(rows.map((row) => ({ ...row, active: Boolean(row.active) })));
}

export async function POST(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO stock_categories (name, sort_order) VALUES (?, ?)",
      [parsed.data.name, parsed.data.sort_order]
    );
    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre." }, { status: 409 });
    }
    throw error;
  }
}
