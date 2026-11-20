"use client";
import {useEffect,useState} from "react";
import {Download,Smartphone} from "lucide-react";
type PromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export default function InstallAppButton(){
 const [prompt,setPrompt]=useState<PromptEvent|null>(null);const [installed,setInstalled]=useState(false);const [ios,setIos]=useState(false);
 useEffect(()=>{setIos(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!(window as any).MSStream);const onPrompt=(e:Event)=>{e.preventDefault();setPrompt(e as PromptEvent);};const onInstalled=()=>{setInstalled(true);setPrompt(null);};window.addEventListener("beforeinstallprompt",onPrompt);window.addEventListener("appinstalled",onInstalled);if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});return()=>{window.removeEventListener("beforeinstallprompt",onPrompt);window.removeEventListener("appinstalled",onInstalled);};},[]);
 async function install(){if(prompt){await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==="accepted")setInstalled(true);setPrompt(null);return;}if(ios)alert("Para instalar: toca el botón Compartir de Safari y selecciona «Agregar a pantalla de inicio».");else alert("Para instalar, abre el menú del navegador y selecciona «Instalar aplicación» o «Agregar a pantalla de inicio».");}
 if(installed)return null;
 return <button onClick={install} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-200 transition hover:bg-amber-300/20"><Download size={15}/><span>Instalar aplicación</span></button>;
}
