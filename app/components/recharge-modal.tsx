"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, LoaderCircle, Upload, Copy } from "lucide-react";

type Pack={name:string;quantity:string;price:string;shop2topup_id?:string;category_id?:string};
type Game={id:string;name:string;packages:Pack[]};
export default function RechargeModal({game,onClose}:{game:Game;onClose:()=>void}) {
 const [pack,setPack]=useState("");
 const [mounted,setMounted]=useState(false);
 useEffect(()=>{setMounted(true);document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
 const [playerId,setPlayerId]=useState(""); const [playerName,setPlayerName]=useState("");
 const [validating,setValidating]=useState(false); const [validated,setValidated]=useState(false);
 const [customer,setCustomer]=useState(""); const [whatsapp,setWhatsapp]=useState(""); const [account,setAccount]=useState<any>(null);
 useEffect(()=>{fetch("/api/auth/me").then(r=>r.json()).then(j=>{if(j.user){setAccount(j.user);setCustomer(j.user.name||"");setWhatsapp(j.user.whatsapp||"");}}).catch(()=>{});},[]);
 const [qr,setQr]=useState(""); const [receipt,setReceipt]=useState("");
 const [step,setStep]=useState<"details"|"payment"|"sent">("details");
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [orderId,setOrderId]=useState("");
 const selected=game.packages.find(p=>p.name===pack);
 const isFreeFire=game.name.toLowerCase().includes("free fire");
 // El ID de Shop2TopUp identifica el producto topup usado solo para validar al jugador.
 const selectedShop2TopupId=selected?.shop2topup_id;
 async function validate(){
  if(!selectedShop2TopupId){setError("Este paquete todavía no está disponible para validar automáticamente.");return;}
  if(!playerId.trim()){setError("Escribe tu ID de jugador.");return;}
  setValidating(true);setError("");setPlayerName("");setValidated(false);
  try{const r=await fetch("/api/shop2topup/validate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sub_category_id:selectedShop2TopupId,category_id:selected?.category_id,player_id:playerId.trim()})});const j=await r.json();if(!r.ok)throw new Error(j.error||"No se pudo validar el ID.");const p=j.player||{};const resolvedName=p.player_name||"";if(!resolvedName)throw new Error("La validación no devolvió el nombre real del jugador. No continúes con el pago.");setPlayerName(resolvedName);setValidated(true);}
  catch(e){const raw=e instanceof Error?e.message:"";setError(raw.includes("PLAYER_CHECK_UNAVAILABLE")||raw.toLowerCase().includes("no pudo verificar el id en este momento")?"Este paquete no está disponible para validación en este momento. Intenta nuevamente más tarde.":raw||"No se pudo verificar el ID. Revisa los datos e intenta nuevamente.");}finally{setValidating(false);}
 }
 async function goPayment(){
  if(!selected||!playerId.trim()||(!account&&!whatsapp.trim())){setError("Escribe tu ID de jugador y tu WhatsApp para continuar.");return;}
  if(!selected.price||!Number.isFinite(Number(selected.price))||Number(selected.price)<=0){setError("Este paquete todavía no tiene un precio de venta. Contacta al administrador.");return;}
  if(isFreeFire&&!selectedShop2TopupId){setError("Este paquete aún no tiene vinculado un producto válido para verificar el jugador. Contacta al administrador.");return;}
  if(selectedShop2TopupId&&!validated){setError("Primero valida tu ID de jugador.");return;}
  setBusy(true);setError("");
  try{
   const qrResponse=await fetch("/api/store/qr");const qrData=await qrResponse.json();if(!qrResponse.ok||!qrData.qr)throw new Error("El administrador todavía no ha configurado el QR de pago.");
   const orderResponse=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game_id:game.id,package_name:selected?.name,player_id:playerId,player_name:playerName,customer_name:customer,whatsapp})});
   const orderData=await orderResponse.json();if(!orderResponse.ok)throw new Error(orderData.error||"No se pudo guardar tu pedido.");
   setOrderId(orderData.id);try{const old=JSON.parse(localStorage.getItem("nextronixt_order_history")||"[]");localStorage.setItem("nextronixt_order_history",JSON.stringify([orderData.id,...old.filter((x:string)=>x!==orderData.id)].slice(0,100)));}catch{}
   setQr(qrData.qr);setStep("payment");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo preparar el pago.");}finally{setBusy(false);}
 }
 async function submitOrder(){
  if(!receipt){setError("Adjunta el comprobante de pago.");return;}
  setBusy(true);setError("");
  try{const r=await fetch("/api/orders/"+orderId+"/receipt",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt})});const j=await r.json();if(!r.ok)throw new Error(j.error||"No se pudo enviar el comprobante.");setStep("sent");}
  catch(e){setError(e instanceof Error?e.message:"Error al crear pedido.");}finally{setBusy(false);}
 }
 function fileToData(file:File){if(file.size>2*1024*1024){setError("El comprobante debe pesar menos de 2 MB.");return;}const reader=new FileReader();reader.onload=()=>setReceipt(String(reader.result));reader.readAsDataURL(file);}
 if(!mounted)return null;
 return createPortal(<div className="fixed inset-0 z-[2147483000] flex items-start justify-center overflow-y-auto bg-black p-3 pt-3 sm:items-center sm:p-5" onClick={onClose}><section className="relative my-0 max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-violet-300/25 bg-black p-5 text-white shadow-[0_0_70px_#6d28d955] sm:p-7" onClick={e=>e.stopPropagation()}>
 <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2"><X size={18}/></button>
 <p className="text-xs font-black tracking-[.2em] text-amber-300">NEXTRONIX FF · RECARGA</p><h2 className="mt-2 pr-8 text-2xl font-black">{game.name}</h2>
 {step==="details"&&<div className="mt-5 space-y-4">
 <div><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-sm font-bold text-white">Selecciona tu paquete</p><p className="mt-1 text-xs text-violet-100/50">Toca el paquete que deseas comprar.</p></div><span className="text-xs text-violet-200/60">{game.packages.length} disponibles</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{game.packages.map((p,i)=><button type="button" key={p.name} onClick={()=>{setPack(p.name);setValidated(false);setPlayerName("");setError("");}} className={`group relative min-h-[112px] rounded-2xl border p-3 text-left transition-all duration-200 ${pack===p.name?"border-amber-300 bg-gradient-to-br from-violet-900/80 to-black shadow-[0_0_22px_#a855f755] ring-1 ring-amber-300/60":"border-violet-300/20 bg-[#101010] hover:border-violet-400/70 hover:bg-[#171020]"}`}><span className="block text-[11px] font-bold uppercase tracking-wide text-violet-200/65">{p.quantity||"Paquete"}</span><strong className="mt-2 block text-sm leading-snug text-white">{p.name}</strong><span className="mt-3 block text-lg font-black text-amber-300">Bs {Number(p.price).toFixed(2)}</span>{(!p.price||Number(p.price)<=0)&&<span className="mt-2 block text-[10px] font-bold text-orange-300">Precio por definir</span>}{pack===p.name&&<span className="absolute right-2 top-2 rounded-full bg-amber-300 p-1 text-black"><CheckCircle2 size={13}/></span>}</button>)}</div></div>
 {selected&&<div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm"><span className="text-violet-100/60">Total a pagar</span><strong className="float-right text-lg text-amber-300">Bs {Number(selected.price).toFixed(2)}</strong></div>}
 <label className="block text-sm text-violet-100/70">ID de jugador<input className="mt-2 w-full rounded-xl border border-violet-300/20 bg-[#21132e] p-3 text-white" value={playerId} onChange={e=>{setPlayerId(e.target.value);setValidated(false);}} placeholder="Escribe tu ID"/></label>
 {selectedShop2TopupId&&(
 <div className="space-y-3">
 <button onClick={validate} disabled={validating||!selected} className="w-full rounded-xl border border-violet-300/30 bg-violet-500/15 p-3 font-bold disabled:opacity-50">{validating?<><LoaderCircle className="mr-2 inline animate-spin"/>Validando...</>:"Validar ID de jugador"}</button>
 {validating&&<p className="rounded-xl border border-violet-300/15 bg-violet-500/10 p-3 text-center text-sm text-violet-100">Estamos verificando tu jugador...</p>}
 {validated&&<div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Jugador verificado</p><p className="mt-1 text-xl font-black text-white">{playerName||playerId}</p><p className="mt-1 text-xs text-emerald-100/70">Comprueba que este sea tu perfil antes de continuar.</p></div>}
 </div>
 )}
 {selected&&isFreeFire&&!selectedShop2TopupId&&<div className="rounded-xl border border-red-300/20 bg-red-300/5 p-3 text-sm text-red-100/80">Este paquete todavía no está configurado para validar tu cuenta. No podrás continuar hasta que el administrador lo configure.</div>}
 {!selected&&<p className="text-xs text-amber-200/70">Selecciona un paquete para continuar.</p>}

 <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm text-violet-100/70">Tu nombre (opcional)<input className="mt-2 w-full rounded-xl border border-violet-300/20 bg-[#21132e] p-3 text-white" value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Nombre"/></label>{!account&&<label className="text-sm text-violet-100/70">WhatsApp<input required className="mt-2 w-full rounded-xl border border-violet-300/20 bg-[#21132e] p-3 text-white" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="7XXXXXXX"/><span className="mt-1 block text-xs leading-relaxed text-violet-100/50">Necesario para enviarte la confirmación. Incluye el código de país.</span></label>}{account&&<p className="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-3 text-xs text-emerald-200 sm:col-span-2">Cuenta: {account.email}. Usaremos tu WhatsApp registrado ({account.whatsapp}).</p>}</div>
 <button onClick={goPayment} disabled={busy||!selected} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-3.5 font-black">{busy?"Cargando...":"Continuar al pago"}</button>
 </div>}
 {step==="payment"&&<div className="mt-5 space-y-4"><div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100"><strong>Importante: paga exactamente el importe indicado.</strong><br/>Debes transferir <b>Bs {Number(selected?.price).toFixed(2)}</b> por este paquete. No redondees ni modifiques el monto.</div><div className="rounded-2xl bg-white p-3"><img src={qr} alt="QR de pago" className="mx-auto max-h-72 w-full object-contain"/></div><p className="text-center text-sm text-violet-100/70">Tu pedido ya está guardado en el historial. Si sales de la aplicación para pagar, vuelve al historial para adjuntar el comprobante.</p><label className="block text-sm text-violet-100/70"><Upload className="mr-2 inline"/>Adjuntar comprobante<input type="file" accept="image/*" className="mt-2 block w-full text-xs" onChange={e=>e.target.files?.[0]&&fileToData(e.target.files[0])}/></label>{receipt&&<p className="text-xs text-emerald-300">Comprobante adjuntado correctamente.</p>}<button onClick={submitOrder} disabled={busy||!receipt} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-3.5 font-black disabled:opacity-50">{busy?<><LoaderCircle className="mr-2 inline animate-spin" size={17}/>Enviando comprobante...</>:"Enviar comprobante"}</button></div>}
 {step==="sent"&&<div className="mt-7 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-400/10 text-amber-300"><LoaderCircle className="animate-spin" size={32}/></div><h3 className="mt-4 text-xl font-black">Verificando pago</h3><p className="mt-2 text-sm leading-6 text-violet-100/65">Tu pedido fue enviado. El administrador revisará el comprobante y actualizará el estado cuando confirme o rechace el pago y la recarga.</p><div className="mt-5 rounded-xl border border-violet-300/20 bg-black/20 p-3 text-xs">Código de pedido<br/><strong className="mt-1 block break-all text-amber-300">{orderId}</strong><button className="mt-2 text-violet-200 underline" onClick={()=>navigator.clipboard?.writeText(orderId)}><Copy className="mr-1 inline" size={13}/>Copiar código</button></div><a href={"/pedido?id="+orderId} className="mt-5 block rounded-xl bg-violet-600 p-3 font-bold">Consultar estado del pedido</a></div>}
 {error&&<p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
 </section></div>,document.body);
}
