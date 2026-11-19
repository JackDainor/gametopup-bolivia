import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "nextronixt_admin";
function signature(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está configurada.");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function createAdminToken() {
  const payload = `admin:${Date.now() + 1000 * 60 * 60 * 12}`;
  return `${payload}.${signature(payload)}`;
}
export function verifyAdminToken(token: string) {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig || !payload.startsWith("admin:")) return false;
    const expected = signature(payload);
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    return Number(payload.split(":")[1]) > Date.now();
  } catch { return false; }
}
export async function isAdmin() {
  const jar = await cookies();
  return verifyAdminToken(jar.get(COOKIE)?.value || "");
}
export const adminCookieName = COOKIE;
