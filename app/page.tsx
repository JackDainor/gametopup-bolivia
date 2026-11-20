import StoreGameCard from "@/app/components/store-game-card";
import { ArrowUpRight, ShieldCheck, Zap, WalletCards, Gamepad2 } from "lucide-react";
import { ensureSchema, getSql } from "@/lib/db";
import SupportWidget from "@/app/components/support-widget";
import AccountNav from "@/app/components/account-nav";

export const dynamic = "force-dynamic";

type StoreGame = {
 id: string;
 name: string;
 description: string | null;
 image: string | null;
 active: boolean;
 packages: { name: string; quantity: string; price: string }[] | null;
};

export default async function Home() {
 let games: StoreGame[] = [];
 let databaseError = false;
 try {
   await ensureSchema();
   const sql = getSql();
   const rows = await sql`SELECT id, name, description, image, active, packages FROM games WHERE active = true ORDER BY created_at DESC, name ASC` as StoreGame[];
   games = rows.map(game => {
     let packages = game.packages;
     if (typeof packages === "string") {
       try { packages = JSON.parse(packages) as StoreGame["packages"]; }
       catch { packages = []; }
     }
     return { ...game, packages: Array.isArray(packages) ? packages : [] };
   });
 } catch (error) {
   console.error("No se pudo cargar el catálogo público:", error);
   databaseError = true;
 }
 return <main className="min-h-screen overflow-hidden bg-[#08050f] text-white">
  <div className="site-glow pointer-events-none fixed inset-0 -z-0"/>
  <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
   <a href="/" className="flex items-center gap-3"><img src="/nextr-logo.webp" alt="NexTronix FF" className="h-12 w-12 rounded-xl border border-violet-300/30 object-cover shadow-[0_0_25px_#8b20ff66]"/></a>
   <nav className="hidden gap-8 text-sm text-violet-100/80 md:flex"><a href="#juegos">Juegos</a><a href="#como-funciona">Cómo comprar</a><a href="#pagos">Pagos</a></nav><AccountNav/>
   <a href="#juegos" className="rounded-xl border border-violet-300/30 bg-violet-500/15 px-4 py-2.5 text-sm font-bold hover:bg-violet-500/30">Ver recargas <ArrowUpRight className="ml-1 inline" size={15}/></a>
  </header>
  <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pt-20">
   <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"/> RECARGAS PARA TODO JUEGO · BOLIVIA</div>
    <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">DOMINA EL JUEGO. <span className="bg-gradient-to-r from-violet-300 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">SUBE DE NIVEL.</span></h1>
    <p className="mt-6 max-w-xl text-base leading-7 text-violet-100/65 sm:text-lg">Diamantes, monedas y recargas para tus juegos favoritos. Elige tu paquete, paga con QR boliviano y sigue tu pedido desde un solo lugar.</p>
    <div className="mt-9 flex flex-wrap gap-3"><a href="#juegos" className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-3.5 font-black shadow-[0_0_28px_#8b20ff55] transition hover:-translate-y-0.5">EXPLORAR JUEGOS <ArrowUpRight className="ml-2 inline" size={17}/></a></div>
    <div className="mt-10 flex flex-wrap gap-6 text-xs text-violet-100/60"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-300"/> Seguimiento de pedidos</span><span className="flex items-center gap-2"><Zap size={16} className="text-amber-300"/> Atención rápida</span><span className="flex items-center gap-2"><WalletCards size={16} className="text-violet-300"/> Pagos en Bs</span></div>
   </div>
   <div className="relative mx-auto w-full max-w-lg"><div className="absolute -inset-10 rounded-full bg-violet-600/20 blur-3xl"/><div className="relative rounded-[2rem] border border-violet-300/25 bg-gradient-to-br from-[#29113e] via-[#140d22] to-[#090611] p-5 shadow-2xl sm:p-7">
    <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[.22em] text-violet-200/60">NEXTRONIX FF</span><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold text-emerald-200">ONLINE</span></div>
    <div className="my-7 overflow-hidden rounded-2xl border border-violet-300/20 bg-black shadow-[0_0_35px_#8b20ff33]"><img src="/nextr-logo.webp" alt="NexTronix FF — Recargas para todo juego" className="block h-auto w-full object-contain"/></div>
    <div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-violet-300/15 bg-black/30 p-4"><p className="text-xs text-violet-100/45">Moneda</p><p className="mt-1 text-xl font-black">BOL <span className="text-sm text-amber-300">Bs</span></p></div><div className="rounded-xl border border-violet-300/15 bg-black/30 p-4"><p className="text-xs text-violet-100/45">Pago</p><p className="mt-1 text-xl font-black">QR Bolivia</p></div></div>
   </div></div>
  </section>
  <section id="juegos" className="relative z-10 mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.25em] text-amber-300">CATÁLOGO GAMER</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">ELIGE TU JUEGO</h2><p className="mt-2 text-sm text-violet-100/55">Juegos y recargas disponibles en nuestro catálogo.</p></div><span className="rounded-full border border-violet-300/20 px-3 py-1.5 text-xs text-violet-100/60">{games.length} juegos disponibles</span></div>
   {databaseError ? <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-8 text-center text-sm text-amber-100">No pudimos cargar el catálogo en este momento. Intenta nuevamente más tarde.</div> : games.length === 0 ? <div className="rounded-2xl border border-violet-300/15 bg-[#160d22]/85 p-10 text-center"><Gamepad2 className="mx-auto text-violet-300" size={36}/><h3 className="mt-4 text-xl font-bold">Próximamente nuevos juegos</h3><p className="mt-2 text-sm text-violet-100/55">Estamos preparando nuestro catálogo. Vuelve pronto.</p></div> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">{games.map(g=><StoreGameCard key={g.id} game={g}/>)}</div>}
  </section>
  <section id="como-funciona" className="relative z-10 border-y border-violet-300/10 bg-white/[.02]"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">FÁCIL Y SEGURO</p><h2 className="mt-2 text-3xl font-black">¿CÓMO FUNCIONA?</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{[["01","Selecciona tu juego","Elige el paquete que quieres y escribe tu ID de jugador."],["02","Confirma tu cuenta","Verificaremos el ID con el servicio disponible para cada juego."],["03","Paga con QR","Sube tu comprobante y administración revisará el pago."]].map(([n,t,d])=><div key={n} className="rounded-2xl border border-violet-300/15 bg-[#160d22] p-6"><span className="text-sm font-black text-amber-300">{n}</span><h3 className="mt-4 text-lg font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-violet-100/55">{d}</p></div>)}</div></div></section>
  <section id="pagos" className="relative z-10 mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="rounded-3xl border border-amber-300/20 bg-gradient-to-r from-amber-400/10 via-violet-500/10 to-transparent p-7 sm:p-10"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">PAGOS EN BOLIVIA</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">PAGA CON QR BOLIVIANO</h2><p className="mt-2 max-w-xl text-sm leading-6 text-violet-100/60">El QR será configurado por administración. Cada comprobante será revisado manualmente antes de procesar la recarga.</p></div><span className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black">🇧🇴 BOLIVIANOS · Bs</span></div></div></section>
  <footer className="relative z-10 border-t border-violet-300/10 px-5 py-8 text-center text-xs text-violet-100/40">© {new Date().getFullYear()} NexTronix FF · Recargas para todo juego.</footer>
 </main>;
}
