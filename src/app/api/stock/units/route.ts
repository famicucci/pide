import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { STOCK_UNITS } from "@/lib/stock-units";

export async function GET() {
  const session = await requireRole("admin", "stock");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(STOCK_UNITS);
}
