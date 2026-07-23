import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import type { ManagedUserRole } from "@/types";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: ManagedUserRole;
  active: number;
}

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/)
  .regex(/[0-9]/);

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150).transform((value) => value.toLowerCase()),
  password: passwordSchema,
  role: z.enum(["admin", "stock"]),
});

function isDuplicateEntry(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}

export async function GET() {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rows] = await db.execute<UserRow[]>(
    `SELECT id, name, email, role, active
     FROM users
     WHERE role IN ('admin', 'stock')
     ORDER BY active DESC, name ASC`
  );

  return NextResponse.json(
    rows.map((user) => ({
      ...user,
      active: Boolean(user.active),
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash, role, active)
       VALUES (?, ?, ?, ?, 1)`,
      [name, email, passwordHash, role]
    );

    return NextResponse.json(
      { id: result.insertId, name, email, role, active: true },
      { status: 201 }
    );
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return NextResponse.json(
        { error: "A user with this email already exists", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }
    throw error;
  }
}
