import { NextResponse } from "next/server";
import { createAdminToken, adminCookieName } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en Vercel." }, { status: 503 });
  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, createAdminToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 12,
  });
  return response;
}
