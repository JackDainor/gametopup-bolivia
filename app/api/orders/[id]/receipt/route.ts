import { NextResponse } from "next/server";
import { ensureSchema,getSql } from "@/lib/db";

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
 try{
  const {id}=await context.params;const {receipt}=await request.json();
  if(typeof receipt!=="string"||!receipt.startsWith("data:image/")||receipt.length>4_000_000)return NextResponse.json({error:"Adjunta una imagen válida de hasta 2 MB."},{status:400});
  await ensureSchema();const sql=getSql();
  const rows=await sql`SELECT id,game_name,package_name,player_id,amount,status,customer_name,whatsapp,player_data,created_at FROM orders WHERE id=${id} LIMIT 1`;
  if(!rows.length)return NextResponse.json({error:"Pedido no encontrado."},{status:404});
  const o=rows[0] as any;if(o.status!=="awaiting_receipt")return NextResponse.json({error:"Este pedido ya recibió un comprobante o cambió de estado."},{status:409});

  const botToken=process.env.TELEGRAM_BOT_TOKEN,chatId=process.env.TELEGRAM_CHAT_ID;
  if(botToken&&chatId){
   const [meta,data]=receipt.split(",");const mime=meta.match(/data:(.*?);base64/)?.[1]||"image/jpeg";const bytes=Buffer.from(data,"base64");
   const amount=Number(o.amount||0);const date=new Date(o.created_at).toLocaleString("es-BO",{timeZone:"America/La_Paz",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
   const caption=["🧾 RECIBO DE COMPRA","------------------------","📦 Producto: "+o.package_name+" - "+o.game_name,"🆔 ID Jugador: "+o.player_id,"👤 Nick: "+(o.player_data?.player_name||"No disponible"),"💰 Monto: BOB "+amount.toFixed(2)+" · USD "+(amount/10).toFixed(4),"📅 Fecha: "+date,"✅ Estado: Pendiente de revisión","🎮 NexTronix FF · Pedido "+o.id].join("\n");
   const form=new FormData();form.append("chat_id",chatId);form.append("caption",caption);form.append("photo",new Blob([bytes],{type:mime}),"comprobante");
   const tg=await fetch("https://api.telegram.org/bot"+botToken+"/sendPhoto",{method:"POST",body:form});
   if(!tg.ok){console.error("Telegram receipt upload failed",await tg.text());return NextResponse.json({error:"Telegram no pudo recibir el comprobante. Intenta nuevamente."},{status:502});}
  } else { return NextResponse.json({error:"Telegram no está configurado."},{status:503}); }
  await sql`UPDATE orders SET status='verifying_payment' WHERE id=${id}`;
  return NextResponse.json({ok:true,status:"verifying_payment"});
 }catch(e){console.error("Receipt upload failed",e);return NextResponse.json({error:"No se pudo enviar el comprobante. Intenta nuevamente."},{status:503});}
}
