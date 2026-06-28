import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface TableRow extends RowDataPacket {
  id: number;
  name: string;
  token: string;
  active: number;
  created_at: string;
}

const createSchema = z.object({
  name: z.string().min(1).max(50),
});

export async function GET() {
  const session = await requireRole("admin", "waiter");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows] = await db.execute<TableRow[]>(
    "SELECT id, name, token, active, created_at FROM `tables` ORDER BY name ASC"
  );
  return NextResponse.json(rows.map((r) => ({ ...r, active: Boolean(r.active) })));
}

export async function POST(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const token = uuidv4();
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO `tables` (name, token) VALUES (?, ?)",
    [parsed.data.name, token]
  );

  return NextResponse.json({ id: result.insertId, token }, { status: 201 });
}
