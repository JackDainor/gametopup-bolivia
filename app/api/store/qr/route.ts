import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
export async function GET() {
 try { await ensureSchema(); const sql=getSql(); const rows=await sql`SELECT value FROM store_settings WHERE key='payment_qr' LIMIT 1`; return NextResponse.json({qr:rows[0]?.value || ""}); }
 catch { return NextResponse.json({error:"No se pudo cargar el QR."},{status:503}); }
}