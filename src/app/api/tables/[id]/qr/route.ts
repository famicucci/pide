import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { generateQRBuffer } from "@/lib/qr";
import { RowDataPacket } from "mysql2";

interface TableRow extends RowDataPacket {
  token: string;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [rows] = await db.execute<TableRow[]>(
    "SELECT token FROM `tables` WHERE id = ? AND active = 1 LIMIT 1",
    [Number(id)]
  );

  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await generateQRBuffer(rows[0].token);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
