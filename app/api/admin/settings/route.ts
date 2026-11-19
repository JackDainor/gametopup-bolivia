import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { qr } = await request.json();
    await ensureSchema();
    const sql = getSql();
    await sql`INSERT INTO store_settings (key, value) VALUES ('payment_qr', ${qr || ""})
      ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar QR" }, { status: 503 });
  }
}
