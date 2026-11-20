import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";
export async function GET(){try{await ensureSchema();const sql=getSql();const rows=await sql`SELECT key,value FROM store_settings WHERE key IN ('payment_qr','support_whatsapp')`;const values=Object.fromEntries(rows.map((r:any)=>[r.key,r.value]));return NextResponse.json({qr:values.payment_qr||"",support_whatsapp:values.support_whatsapp||""});}catch{return NextResponse.json({error:"No se pudo cargar la configuración."},{status:503});}}
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await request.json(); await ensureSchema(); const sql = getSql();
    if (Object.prototype.hasOwnProperty.call(body,"qr")) await sql`INSERT INTO store_settings (key,value) VALUES ('payment_qr',${body.qr||""}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`;
    if (Object.prototype.hasOwnProperty.call(body,"support_whatsapp")) {const phone=String(body.support_whatsapp||"").replace(/[^0-9+]/g,"");if(phone.length>20)return NextResponse.json({error:"Número de WhatsApp no válido."},{status:400});await sql`INSERT INTO store_settings(key,value) VALUES('support_whatsapp',${phone}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`;}
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar la configuración." }, { status: 503 }); }
}
