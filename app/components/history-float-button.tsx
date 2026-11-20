"use client";
import {useEffect,useState} from "react";
import {History} from "lucide-react";
export default function HistoryFloatButton(){
 const [count,setCount]=useState(0);
 useEffect(()=>{let active=true;async function check(){try{const ids=JSON.parse(localStorage.getItem("nextronixt_order_history")||"[]");if(!Array.isArray(ids)||!ids.length){if(active)setCount(0);return;}const rows=await Promise.all(ids.slice(0,30).map((id:string)=>fetch("/api/orders?id="+encodeURIComponent(id),{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null)));if(active)setCount(rows.filter(x=>x?.order).length);}catch{}}check();const timer=window.setInterval(check,30000);return()=>{active=false;window.clearInterval(timer);};},[]);
 return <a href="/historial" className="fixed bottom-5 left-4 z-40 flex items-center gap-2 rounded-full border border-violet-300/30 bg-[#24103a] px-4 py-3 text-sm font-bold text-white shadow-xl shadow-violet-950/50 transition hover:scale-105"><History size={19}/><span>Historial</span>{count>0&&<span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-300 px-1 text-[10px] font-black text-black">{count>9?"9+":count}</span>}</a>;
}
