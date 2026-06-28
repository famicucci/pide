import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { type SessionData } from "@/lib/session";

const ROLE_ROUTES: Record<string, SessionData["role"][]> = {
  "/admin": ["admin"],
  "/cocina": ["kitchen", "admin"],
  "/mozo": ["waiter", "admin"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!matchedPrefix) return NextResponse.next();

  const response = NextResponse.next();

  const session = await getIronSession<SessionData>(request, response, {
    cookieName: "pide_session",
    password: process.env.SESSION_SECRET as string,
  });

  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const allowedRoles = ROLE_ROUTES[matchedPrefix];
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/cocina", "/mozo"],
};
