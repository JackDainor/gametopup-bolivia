import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await ensureSchema();
    const sql = getSql();
    const games = await sql`SELECT id, name, description, image, active, packages FROM games ORDER BY created_at DESC`;
    const settings = await sql`SELECT value FROM store_settings WHERE key = 'payment_qr' LIMIT 1`;
    const orders = await sql`SELECT id, customer_name, whatsapp, game_name, package_name, player_id, amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 100`;
    const customers = await sql`SELECT id, name, email, whatsapp, created_at FROM customers ORDER BY created_at DESC LIMIT 200`;
    return NextResponse.json({ games, qr: settings[0]?.value || "", orders, customers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error de base de datos" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await ensureSchema();
    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "El nombre del juego es obligatorio." }, { status: 400 });
    const id = body.id || crypto.randomUUID();
    const sql = getSql();
    await sql`INSERT INTO games (id, name, description, image, active, packages)
      VALUES (${id}, ${body.name.trim()}, ${body.description || ""}, ${body.image || ""}, ${body.active !== false}, ${JSON.stringify(body.packages || [])}::jsonb)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, image=EXCLUDED.image, active=EXCLUDED.active, packages=EXCLUDED.packages`;
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar" }, { status: 503 });
  }
}
