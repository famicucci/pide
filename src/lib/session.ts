import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import db from "@/lib/db";
import type { UserRole } from "@/types";

export interface SessionData {
  userId: number;
  name: string;
  role: UserRole;
}

const sessionOptions: SessionOptions = {
  cookieName: "pide_session",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireRole(...roles: SessionData["role"][]) {
  const session = await getSession();
  if (!session.userId) {
    return null;
  }

  interface CurrentUserRow extends RowDataPacket {
    id: number;
    name: string;
    role: UserRole;
    active: number;
  }

  const [rows] = await db.execute<CurrentUserRow[]>(
    "SELECT id, name, role, active FROM users WHERE id = ? LIMIT 1",
    [session.userId]
  );
  const user = rows[0];

  if (!user || !user.active || !roles.includes(user.role)) {
    return null;
  }

  return {
    userId: user.id,
    name: user.name,
    role: user.role,
  } satisfies SessionData;
}
