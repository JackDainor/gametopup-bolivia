import { ArrowUpRight, CheckCircle2, Gamepad2, ShieldCheck, Zap, WalletCards } from "lucide-react";

const games = [
  { name: "Free Fire", tag: "Más solicitado", icon: "🔥", color: "from-orange-500/20 to-rose-500/5", desc: "Diamantes y membresías" },
  { name: "Roblox", tag: "Robux", icon: "🟥", color: "from-red-500/20 to-orange-500/5", desc: "Robux para tu cuenta" },
  { name: "Mobile Legends", tag: "Diamantes", icon: "⚔️", color: "from-blue-500/20 to-cyan-500/5", desc: "Diamantes y paquetes" },
  { name: "Blood Strike", tag: "Recargas", icon: "🎯", color: "from-violet-500/20 to-fuchsia-500/5", desc: "Gold y contenido del juego" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,rgba(124,58,237,.19),transparent_38%),radial-gradient(ellipse_at_90%_25%,rgba(6,182,212,.12),transparent_32%)]" />
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <a href="#" className="flex items-center gap-3 font-black tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 shadow-glow"><Gamepad2 size={23}/></span>
          <span className="text-lg">GAME<span className="text-cyan-300">TOPUP</span><small className="ml-2 rounded-md border border-white/10 px-2 py-1 text-[9px] font-bold tracking-widest text-slate-400">BOLIVIA</small></span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#juegos" className="hover:text-white">Juegos</a><a href="#como-funciona" className="hover:text-white">Cómo funciona</a><a href="#pagos" className="hover:text-white">Pagos</a>
        </nav>
        <a href="#juegos" className="rounded-xl border border-white/10 bg-white/[.06] px-4 py-2.5 text-sm font-semibold transition hover:border-violet-400/50 hover:bg-violet-500/10">Ver recargas <ArrowUpRight className="ml-1 inline" size={15}/></a>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[.07] px-3 py-2 text-xs font-semibold text-cyan-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"/> Recargas para jugadores de Bolivia</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">Tu próximo nivel, <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">a un clic.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">Diamantes, Robux y recargas para tus juegos favoritos. Compra fácil, paga en bolivianos y recibe atención personalizada.</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="#juegos" className="rounded-xl bg-violet-500 px-6 py-3.5 font-bold shadow-glow transition hover:-translate-y-0.5 hover:bg-violet-400">Explorar juegos <ArrowUpRight className="ml-2 inline" size={17}/></a><a href="#como-funciona" className="rounded-xl border border-white/10 bg-white/[.04] px-6 py-3.5 font-semibold text-slate-200 hover:bg-white/[.08]">Cómo comprar</a></div>
          <div className="mt-10 flex flex-wrap gap-6 text-xs text-slate-400"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-300"/> Compra con seguimiento</span><span className="flex items-center gap-2"><Zap size={16} className="text-amber-300"/> Atención rápida</span><span className="flex items-center gap-2"><WalletCards size={16} className="text-cyan-300"/> Pagos en Bs</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-8 rounded-full bg-violet-500/10 blur-3xl"/>
          <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[.11] to-white/[.025] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.2em] text-slate-400">Zona gamer</span><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold text-emerald-200">ONLINE</span></div>
            <div className="my-7 grid aspect-[1.35] place-items-center overflow-hidden rounded-2xl border border-violet-300/10 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,.32),transparent_55%),linear-gradient(145deg,#17152f,#0c1325)]"><div className="text-center"><div className="text-7xl drop-shadow-[0_0_25px_rgba(139,92,246,.6)]">🎮</div><p className="mt-4 text-2xl font-black tracking-widest">LEVEL UP</p><p className="mt-1 text-xs text-slate-400">Tu aventura empieza aquí</p></div></div>
            <div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-500">Moneda</p><p className="mt-1 text-xl font-black">BOB <span className="text-sm text-cyan-300">Bs</span></p></div><div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-500">Métodos de pago</p><p className="mt-1 text-xl font-black">QR + Banco</p></div></div>
          </div>
        </div>
      </section>

      <section id="juegos" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-violet-300">Catálogo</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">Elige tu juego</h2><p className="mt-2 text-sm text-slate-400">Próximamente podrás elegir paquetes y validar tu ID desde aquí.</p></div><span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">4 juegos iniciales</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{games.map((game) => <article key={game.name} className="group rounded-2xl border border-white/10 bg-white/[.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[.06]"><div className={`mb-6 grid aspect-[1.5] place-items-center rounded-xl bg-gradient-to-br ${game.color} text-6xl`}>{game.icon}</div><span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">{game.tag}</span><h3 className="mt-2 text-xl font-extrabold">{game.name}</h3><p className="mt-1 text-sm text-slate-400">{game.desc}</p><button disabled className="mt-5 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[.04] py-3 text-sm font-semibold text-slate-500">Próximamente</button></article>)}</div>
      </section>

      <section id="como-funciona" className="border-y border-white/[.07] bg-white/[.025]"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Simple y transparente</p><h2 className="mt-2 text-3xl font-black">¿Cómo funciona?</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{[["01","Selecciona tu juego","Elige el paquete que quieres y escribe tu ID de jugador."],["02","Confirma tu cuenta","Validaremos los datos disponibles con el proveedor antes de continuar."],["03","Paga y sigue tu pedido","Envía tu comprobante QR o transferencia y revisa el estado de tu recarga."]].map(([n,t,d])=><div key={n} className="rounded-2xl border border-white/10 bg-[#101426] p-6"><span className="text-sm font-black text-violet-300">{n}</span><h3 className="mt-4 text-lg font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{d}</p></div>)}</div></div></section>

      <section id="pagos" className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="rounded-3xl border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[.08] via-violet-500/[.08] to-transparent p-7 sm:p-10"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-200">Pagos en Bolivia</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Paga como prefieras</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Aceptaremos QR interoperable de bancos y billeteras compatibles, además de transferencias bancarias. La confirmación será revisada por administración.</p></div><div className="flex flex-wrap gap-2"><span className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold"><CheckCircle2 className="mr-2 inline text-emerald-300" size={16}/> QR boliviano</span><span className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold"><CheckCircle2 className="mr-2 inline text-emerald-300" size={16}/> Transferencia</span></div></div></div></section>

      <footer className="border-t border-white/[.07] px-5 py-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} GameTopUp Bolivia. Todos los derechos reservados.</footer>
    </main>
  );
}
