import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface TableRow extends RowDataPacket {
  is_open: number;
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [rows] = await db.execute<TableRow[]>(
    "SELECT is_open FROM `tables` WHERE token = ? AND active = 1 LIMIT 1",
    [token]
  );

  if (!rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ is_open: rows[0].is_open });
}
