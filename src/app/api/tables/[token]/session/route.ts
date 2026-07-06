import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface TableRow extends RowDataPacket {
  id: number;
  is_open: number;
  session_key: string | null;
}

const schema = z.object({
  name: z.string().min(1).max(100),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const name = parsed.data.name.trim().toLowerCase();

  const [rows] = await db.execute<TableRow[]>(
    "SELECT id, is_open, session_key FROM `tables` WHERE token = ? AND active = 1 LIMIT 1",
    [token]
  );

  if (!rows.length) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  const table = rows[0];

  if (table.is_open === 0) {
    // Start a new session: this name becomes the session key
    await db.execute(
      "UPDATE `tables` SET is_open = 1, opened_at = NOW(), session_key = ? WHERE id = ?",
      [name, table.id]
    );
    return NextResponse.json({ ok: true, opened: true });
  }

  // Table already open — validate the name
  if (table.session_key === name) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nombre incorrecto" }, { status: 403 });
}
