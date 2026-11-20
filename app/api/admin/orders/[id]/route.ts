import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";

const allowed = ["processing", "completed", "cancelled", "verifying_payment"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await context.params;
    const { status } = await request.json();
    if (!allowed.includes(status)) return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT id,status,game_name,package_name,player_id,amount,player_data,created_at FROM orders WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    const current = String(rows[0].status);
    if (status === "completed" && current !== "processing") {
      return NextResponse.json({ error: "Primero confirma el pago e inicia la recarga manual." }, { status: 409 });
    }
    if (status === "processing" && current !== "verifying_payment") {
      return NextResponse.json({ error: "Solo puedes iniciar la recarga después de revisar el pago." }, { status: 409 });
    }
    await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
    if(status === "completed"){
      const o = rows[0] as any;
      const amount = Number(o.amount || 0);
      const date = new Date(o.created_at).toLocaleString("es-BO", { timeZone: "America/La_Paz", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit" });
      const receipt = ["🧾 RECIBO DE COMPRA","------------------------","📦 Producto: "+o.package_name+" - "+o.game_name,"🆔 ID Jugador: "+o.player_id,"👤 Nick: "+(o.player_data?.player_name || "No disponible"),"💰 Monto: BOB "+amount.toFixed(2)+" · USD "+(amount/10).toFixed(4),"📅 Fecha: "+date,"✅ Estado: ¡Entregado con éxito!","🎮 Gracias por preferirnos."].join("\\n");
      const token=process.env.TELEGRAM_BOT_TOKEN, chat=process.env.TELEGRAM_CHAT_ID;
      if(token&&chat){try{await fetch("https://api.telegram.org/bot"+token+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chat,text:receipt})});}catch(e){console.error("Telegram completion receipt failed",e);}}
    }
    return NextResponse.json({ ok: true, status });
  } catch { return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 503 }); }
}
