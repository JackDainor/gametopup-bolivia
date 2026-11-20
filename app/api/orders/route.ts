import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Falta el código del pedido." }, { status: 400 });
    const sql = getSql();
    const rows = await sql`SELECT id, game_name, package_name, player_id, amount, status, created_at FROM orders WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    return NextResponse.json({ order: rows[0] });
  } catch { return NextResponse.json({ error: "No se pudo consultar el pedido." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const { game_id, package_name, player_id, player_name, customer_name, whatsapp, receipt } = body;
    if (!game_id || !package_name || !player_id || !customer_name?.trim() || !whatsapp?.trim() || !receipt) return NextResponse.json({ error: "Completa tus datos y adjunta el comprobante de pago." }, { status: 400 });
    const sql = getSql();
    const games = await sql`SELECT id, name, packages FROM games WHERE id = ${game_id} AND active = true LIMIT 1`;
    const game = games[0] as any;
    if (!game) return NextResponse.json({ error: "Este juego ya no está disponible." }, { status: 404 });
    const pack = (game.packages || []).find((p: any) => p.name === package_name);
    if (!pack) return NextResponse.json({ error: "El paquete seleccionado ya no está disponible." }, { status: 400 });
    const id = crypto.randomUUID();
    await sql`INSERT INTO orders (id, customer_name, whatsapp, game_name, package_name, player_id, amount, receipt, status)
      VALUES (${id}, ${customer_name.trim()}, ${whatsapp.trim()}, ${game.name}, ${pack.name}, ${String(player_id)}, ${Number(pack.price)}, ${receipt}, 'verifying_payment')`;
    await sql`UPDATE orders SET player_data = ${JSON.stringify({ player_name: player_name || "", player_id: String(player_id) })}::jsonb WHERE id = ${id}`;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      const message = "🛒 NUEVO PEDIDO NEXTRONIX FF\\nJuego: " + game.name + "\\nPaquete: " + pack.name + "\\nJugador: " + String(player_id) + (player_name ? " (" + player_name + ")" : "") + "\\nCliente: " + customer_name + "\\nWhatsApp: " + whatsapp + "\\nTotal: Bs " + Number(pack.price).toFixed(2) + "\\nPedido: " + id;
      try { await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: message }) }); } catch (e) { console.error("Telegram notification failed", e); }
    }
    return NextResponse.json({ ok: true, id, status: "verifying_payment" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear el pedido." }, { status: 503 });
  }
}
