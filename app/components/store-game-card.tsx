"use client";
import { useState } from "react";
import { Gamepad2, PackageCheck } from "lucide-react";
import RechargeModal from "./recharge-modal";
type Pack={name:string;quantity:string;price:string;shop2topup_id?:string};
type Game={id:string;name:string;description:string|null;image:string|null;active:boolean;packages:Pack[]|string|null};
export default function StoreGameCard({game}:{game:Game}){
 const [open,setOpen]=useState(false);
 let packages:Pack[]=[];
 try{packages=Array.isArray(game.packages)?game.packages:typeof game.packages==="string"?JSON.parse(game.packages):[];}catch{packages=[];}
 const visiblePackages=packages.slice(0,4);
 return <><article className="group rounded-2xl border border-violet-300/15 bg-[#160d22]/85 p-4 transition duration-300 hover:-translate-y-1 hover:border-violet-400/50 hover:shadow-[0_15px_50px_#6d28d922] sm:p-5"><div className="mb-5 grid aspect-[1.7] place-items-center overflow-hidden rounded-xl border border-violet-300/10 bg-gradient-to-br from-violet-700/30 via-fuchsia-900/15 to-amber-500/10">{game.image?<img src={game.image} alt={game.name} className="h-full w-full object-cover"/>:<Gamepad2 className="text-violet-200/60" size={42}/>}</div><span className="text-[10px] font-black uppercase tracking-widest text-amber-300">RECARGAS DISPONIBLES</span><h3 className="mt-2 text-lg font-extrabold sm:text-xl">{game.name}</h3><p className="mt-1 text-sm text-violet-100/55">{game.description||"Recargas disponibles"}</p>
 <div className="mt-4 rounded-xl border border-violet-300/10 bg-black/20 p-3"><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-violet-100/60"><PackageCheck size={14}/> Paquetes disponibles</span><strong className="text-xs text-amber-300">{packages.length}</strong></div>{visiblePackages.length? <ul className="space-y-2">{visiblePackages.map((p,i)=><li key={p.shop2topup_id||p.name||i} className="flex items-center justify-between gap-2 border-t border-white/5 pt-2 text-xs"><span className="min-w-0 truncate text-violet-100/85">{p.name||p.quantity||"Paquete"}</span><strong className="shrink-0 text-amber-300">{p.price&&Number(p.price)>0?"Bs "+Number(p.price).toFixed(2):"Precio por definir"}</strong></li>)}</ul>:<p className="text-xs text-violet-100/45">Paquetes aún no configurados.</p>}{packages.length>4&&<p className="mt-2 text-[10px] text-violet-200/55">Y {packages.length-4} paquetes más…</p>}</div>
 <button onClick={()=>setOpen(true)} disabled={!packages.length} className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40">{packages.length?"Ver paquetes y recargar":"Sin paquetes disponibles"}</button></article>{open&&<RechargeModal game={{id:game.id,name:game.name,packages}} onClose={()=>setOpen(false)}/>}</>;
}
