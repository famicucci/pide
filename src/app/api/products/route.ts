import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ProductRow extends RowDataPacket {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: string;
  available: number;
  sort_order: number;
  category_name: string;
}

const createSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional().default(""),
  price: z.number().positive(),
  sort_order: z.number().int().default(0),
});

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows] = await db.execute<ProductRow[]>(`
    SELECT p.id, p.category_id, p.name, p.description, p.price, p.available, p.sort_order,
           c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY c.sort_order ASC, p.sort_order ASC, p.name ASC
  `);

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      price: Number(r.price),
      available: Boolean(r.available),
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

  const { category_id, name, description, price, sort_order } = parsed.data;

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO products (category_id, name, description, price, sort_order) VALUES (?, ?, ?, ?, ?)",
    [category_id, name, description || null, price, sort_order]
  );

  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
