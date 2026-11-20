"use client";
import {useEffect,useState} from "react";
export default function AccountNav(){const [user,setUser]=useState<any>(null);useEffect(()=>{fetch("/api/auth/me").then(r=>r.json()).then(j=>setUser(j.user)).catch(()=>{});},[]);return <a href="/cuenta" className="rounded-xl border border-violet-300/30 bg-violet-500/15 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500/30">{user?(user.name||"Mi cuenta"):"Ingresar / Registrarse"}</a>}
