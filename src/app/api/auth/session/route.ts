import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";

export async function GET() {
  const user = await requireRole("admin", "stock", "waiter", "kitchen");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    userId: user.userId,
    name: user.name,
    role: user.role,
  });
}
