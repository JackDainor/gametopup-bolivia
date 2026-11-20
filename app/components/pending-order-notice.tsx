"use client";
import {useEffect,useState} from "react";
import {AlertCircle,X} from "lucide-react";
export default function PendingOrderNotice(){
 const [open,setOpen]=useState(false);const [count,setCount]=useState(0);
 useEffect(()=>{try{const ids=JSON.parse(localStorage.getItem("nextronixt_order_history")||"[]");if(!Array.isArray(ids)||!ids.length)return;Promise.all(ids.map((id:string)=>fetch("/api/orders?id="+encodeURIComponent(id),{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null))).then(rows=>{const n=rows.filter(x=>x?.order?.status==="awaiting_receipt").length;if(n){setCount(n);setOpen(true);}});}catch{}},[]);
 if(!open)return null;
 return <div className="fixed inset-0 z-[2147482500] flex items-center justify-center bg-black/75 p-4"><section className="relative w-full max-w-sm rounded-2xl border border-amber-300/30 bg-[#160d22] p-6 text-white shadow-2xl"><button onClick={()=>setOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-white/60"><X size={18}/></button><AlertCircle className="text-amber-300" size={34}/><h2 className="mt-3 text-xl font-black">Tienes una recarga pendiente</h2><p className="mt-2 text-sm leading-6 text-violet-100/65">{count===1?"Tu pedido está guardado.":"Tienes "+count+" pedidos guardados."} Aún falta adjuntar el comprobante de pago. No necesitas crear otro pedido.</p><a href="/historial" className="mt-5 block rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-3 text-center font-bold">Ir al historial y subir comprobante</a><button onClick={()=>setOpen(false)} className="mt-3 w-full p-2 text-sm text-violet-200/70">Recordármelo después</button></section></div>;
}
