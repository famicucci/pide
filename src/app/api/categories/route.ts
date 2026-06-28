import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  sort_order: number;
  active: number;
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  sort_order: z.number().int().default(0),
});

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows] = await db.execute<CategoryRow[]>(
    "SELECT id, name, sort_order, active FROM categories ORDER BY sort_order ASC, name ASC"
  );
  return NextResponse.json(rows.map((r) => ({ ...r, active: Boolean(r.active) })));
}

export async function POST(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO categories (name, sort_order) VALUES (?, ?)",
    [parsed.data.name, parsed.data.sort_order]
  );

  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
