import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
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
  if (!session.userId || !roles.includes(session.role)) {
    return null;
  }
  return session;
}
