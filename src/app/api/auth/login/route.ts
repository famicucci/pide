import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { RowDataPacket } from "mysql2";
import type { UserRole } from "@/types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  active: number;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const [rows] = await db.execute<UserRow[]>(
    "SELECT id, name, email, password_hash, role, active FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  const user = rows[0];

  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.name = user.name;
  session.role = user.role;
  await session.save();

  return NextResponse.json({ role: user.role });
}
