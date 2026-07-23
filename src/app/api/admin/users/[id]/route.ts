import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
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

interface IdRow extends RowDataPacket {
  id: number;
}

const paramsSchema = z.coerce.number().int().positive();
const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/)
  .regex(/[0-9]/);

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z
      .string()
      .trim()
      .email()
      .max(150)
      .transform((value) => value.toLowerCase())
      .optional(),
    password: passwordSchema.optional(),
    role: z.enum(["admin", "stock"]).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

function isDuplicateEntry(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const parsedId = paramsSchema.safeParse(rawId);
  const parsedBody = updateUserSchema.safeParse(await request.json().catch(() => null));

  if (!parsedId.success || !parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: parsedBody.success ? undefined : parsedBody.error.flatten(),
      },
      { status: 400 }
    );
  }

  const userId = parsedId.data;
  const data = parsedBody.data;
  const newPasswordHash =
    data.password === undefined ? undefined : await bcrypt.hash(data.password, 10);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<UserRow[]>(
      `SELECT id, name, email, role, active
       FROM users
       WHERE id = ? AND role IN ('admin', 'stock')
       FOR UPDATE`,
      [userId]
    );
    const currentUser = rows[0];

    if (!currentUser) {
      await connection.rollback();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const nextRole = data.role ?? currentUser.role;
    const nextActive = data.active ?? Boolean(currentUser.active);
    const removesOwnAccess =
      currentUser.id === session.userId && (nextRole !== "admin" || !nextActive);

    if (removesOwnAccess) {
      await connection.rollback();
      return NextResponse.json(
        {
          error: "You cannot disable or demote your own account",
          code: "SELF_ACCESS_REMOVAL",
        },
        { status: 409 }
      );
    }

    const removesActiveAdmin =
      currentUser.role === "admin" &&
      Boolean(currentUser.active) &&
      (nextRole !== "admin" || !nextActive);

    if (removesActiveAdmin) {
      const [activeAdmins] = await connection.execute<IdRow[]>(
        `SELECT id FROM users
         WHERE role = 'admin' AND active = 1
         FOR UPDATE`
      );

      if (activeAdmins.length <= 1) {
        await connection.rollback();
        return NextResponse.json(
          {
            error: "The last active administrator cannot be disabled or demoted",
            code: "LAST_ADMIN",
          },
          { status: 409 }
        );
      }
    }

    const assignments: string[] = [];
    const values: Array<string | number> = [];

    if (data.name !== undefined) {
      assignments.push("name = ?");
      values.push(data.name);
    }
    if (data.email !== undefined) {
      assignments.push("email = ?");
      values.push(data.email);
    }
    if (data.role !== undefined) {
      assignments.push("role = ?");
      values.push(data.role);
    }
    if (data.active !== undefined) {
      assignments.push("active = ?");
      values.push(data.active ? 1 : 0);
    }
    if (newPasswordHash !== undefined) {
      assignments.push("password_hash = ?");
      values.push(newPasswordHash);
    }

    values.push(userId);
    await connection.execute(
      `UPDATE users SET ${assignments.join(", ")} WHERE id = ?`,
      values
    );

    const [updatedRows] = await connection.execute<UserRow[]>(
      `SELECT id, name, email, role, active
       FROM users
       WHERE id = ?`,
      [userId]
    );
    await connection.commit();

    const updatedUser = updatedRows[0];
    return NextResponse.json({
      ...updatedUser,
      active: Boolean(updatedUser.active),
    });
  } catch (error) {
    await connection.rollback();
    if (isDuplicateEntry(error)) {
      return NextResponse.json(
        { error: "A user with this email already exists", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }
    throw error;
  } finally {
    connection.release();
  }
}
