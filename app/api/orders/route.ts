import { NextResponse } from "next/server";
import { ensureSchema,getSql } from "@/lib/db";
import { getCustomerId } from "@/lib/customer-auth";

export async function GET(request:Request){
 try{
  await ensureSchema(); const url=new URL(request.url); const id=url.searchParams.get("id"); const sql=getSql();
  if(id){const rows=await sql`SELECT id,game_name,package_name,player_id,amount,status,created_at,(receipt IS NOT NULL AND receipt <> '') AS has_receipt,player_data FROM orders WHERE id=${id} LIMIT 1`;if(!rows.length)return NextResponse.json({error:"Pedido no encontrado."},{status:404});return NextResponse.json({order:rows[0]});}
  const customerId=await getCustomerId();if(!customerId)return NextResponse.json({error:"Inicia sesión para ver tu historial."},{status:401});
  const rows=await sql`SELECT id,game_name,package_name,player_id,amount,status,created_at,(receipt IS NOT NULL AND receipt <> '') AS has_receipt FROM orders WHERE customer_id=${customerId} ORDER BY created_at DESC LIMIT 100`;
  return NextResponse.json({orders:rows});
 }catch{return NextResponse.json({error:"No se pudo consultar el historial."},{status:503});}
}

export async function POST(request:Request){
 try{
  await ensureSchema();const body=await request.json();const {game_id,package_name,player_id,player_name,customer_name,whatsapp}=body;
  const customerId=await getCustomerId();const sql=getSql();let account:any=null;
  if(customerId){const users=await sql`SELECT id,name,whatsapp FROM customers WHERE id=${customerId} LIMIT 1`;account=users[0]||null;}
  const finalName=String(customer_name||account?.name||"").trim();const finalWhatsapp=String(account?.whatsapp||whatsapp||"").trim();
  if(!game_id||!package_name||!player_id||!finalWhatsapp)return NextResponse.json({error:"Completa tu WhatsApp y los datos del pedido."},{status:400});
  if(String(player_id).trim().length===0)return NextResponse.json({error:"Escribe tu ID de jugador."},{status:400});
  const games=await sql`SELECT id,name,packages FROM games WHERE id=${game_id} AND active=true LIMIT 1`;const game=games[0] as any;
  if(!game)return NextResponse.json({error:"Este juego ya no está disponible."},{status:404});
  let packs=game.packages;if(typeof packs==="string")packs=JSON.parse(packs);
  const pack=(Array.isArray(packs)?packs:[]).find((p:any)=>p.name===package_name);
  if(!pack)return NextResponse.json({error:"El paquete seleccionado ya no está disponible."},{status:400});
  const price=Number(pack.price);if(!Number.isFinite(price)||price<=0)return NextResponse.json({error:"El paquete no tiene un precio válido."},{status:400});
  const id=crypto.randomUUID();
  await sql`INSERT INTO orders(id,customer_id,customer_name,whatsapp,game_name,package_name,player_id,amount,receipt,status) VALUES(${id},${customerId},${finalName},${finalWhatsapp},${game.name},${pack.name},${String(player_id)},${price},'', 'awaiting_receipt')`;
  await sql`UPDATE orders SET player_data=${JSON.stringify({player_name:player_name||"",player_id:String(player_id)})}::jsonb WHERE id=${id}`;
  const botToken=process.env.TELEGRAM_BOT_TOKEN,chatId=process.env.TELEGRAM_CHAT_ID;
  if(botToken&&chatId){const message=["🛒 NUEVO PEDIDO · NEXTRONIX FF","📦 Producto: "+pack.name+" - "+game.name,"🆔 ID Jugador: "+String(player_id),"👤 Nick: "+(player_name||"No disponible"),"👤 Cliente: "+(finalName||"No indicado"),"📱 WhatsApp: "+finalWhatsapp,"💰 Monto: BOB "+price.toFixed(2),"🕒 Estado: Pendiente de comprobante","🧾 Pedido: "+id].join("\n");try{await fetch("https://api.telegram.org/bot"+botToken+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chatId,text:message})});}catch(e){console.error("Telegram notification failed",e);}}
  return NextResponse.json({ok:true,id,status:"awaiting_receipt"});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"No se pudo crear el pedido."},{status:503});}
}
