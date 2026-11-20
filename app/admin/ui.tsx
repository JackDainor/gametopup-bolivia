"use client";
import { useEffect, useState } from "react";
import { Gamepad2, LayoutDashboard, Package, Users, ReceiptText, QrCode, LogOut, Plus, Trash2, Save, Upload, ShieldCheck } from "lucide-react";

type Pack = { name: string; quantity: string; price: string; shop2topup_id?: string; category_id?: string };
type Game = { id: string; name: string; description: string; image: string; active: boolean; packages: Pack[] };
type Data = { games: Game[]; qr: string; support_whatsapp: string; orders: any[]; customers: any[] };

const blank: Game = { id: "", name: "", description: "", image: "", active: true, packages: [] };
function normalizeGameName(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
async function readJson(r: Response) { const raw = await r.text(); try { return JSON.parse(raw); } catch { throw new Error(`La API respondió algo que no es JSON (HTTP ${r.status}). Comprueba que la ruta exista y que el despliegue esté actualizado.`); } }
function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}
const tabs = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "games", label: "Juegos y precios", icon: Gamepad2 },
  { id: "orders", label: "Pedidos", icon: ReceiptText },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "payments", label: "Pago QR", icon: QrCode },
];

export default function AdminDashboard() {
  const [logged, setLogged] = useState(false), [password, setPassword] = useState("");
  const [tab, setTab] = useState("overview"), [data, setData] = useState<Data>({ games: [], qr: "", support_whatsapp: "", orders: [], customers: [] });
  const [game, setGame] = useState<Game>(blank), [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [regionOptions, setRegionOptions] = useState<{name:string;count:number}[]>([]);
  const [regionTarget, setRegionTarget] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [shopGames, setShopGames] = useState<string[]>([]);
  const [selectedShopGame, setSelectedShopGame] = useState("");
  const [loadingShopGames, setLoadingShopGames] = useState(false);
  async function load() {
    const r = await fetch("/api/admin/games");
    const j = await readJson(r);
    if (!r.ok) { setMessage(j.error || "No se pudo cargar"); return; }
    setData(j);
  }
  useEffect(() => { if (logged) load(); }, [logged]);
  useEffect(() => {
    if (!logged || !editing || shopGames.length) return;
    let active = true;
    setLoadingShopGames(true);
    fetch("/api/admin/shop2topup/catalog?mode=games")
      .then(async r => { const j = await readJson(r); if (!r.ok) throw new Error(j.error || "No se pudo cargar el catálogo de juegos."); return j; })
      .then(j => { if (active) setShopGames(Array.isArray(j.games) ? j.games : []); })
      .catch(e => { if (active) setMessage(e instanceof Error ? e.message : "No se pudo cargar el catálogo de juegos."); })
      .finally(() => { if (active) setLoadingShopGames(false); });
    return () => { active = false; };
  }, [logged, editing, shopGames.length]);
  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const j = await r.json(); setBusy(false);
    if (r.ok) setLogged(true); else setMessage(j.error || "No se pudo iniciar sesión");
  }
  async function importShop2Topup(targetGameName: string) {
    if (!targetGameName.trim()) { setMessage("Primero escribe el nombre del juego."); return; }
    setBusy(true); setMessage("Buscando regiones disponibles para " + targetGameName + "...");
    try {
      const r = await fetch("/api/admin/shop2topup/catalog?game=" + encodeURIComponent(targetGameName) + "&mode=regions");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudieron consultar las regiones.");
      const regions = (j.regions || []) as {name:string;count:number}[];
      if (!regions.length) {
        setMessage("No se detectaron regiones disponibles para " + targetGameName + ". Diagnóstico: " + JSON.stringify(j.diagnostics || {}));
        return;
      }
      setRegionTarget(targetGameName);
      setRegionOptions(regions);
      setSelectedRegion(regions[0].name);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al consultar regiones.");
    } finally { setBusy(false); }
  }
  async function confirmRegionImport() {
    if (!regionTarget || !selectedRegion) return;
    setBusy(true); setMessage("Importando paquetes de " + selectedRegion + "...");
    try {
      const url = "/api/admin/shop2topup/catalog?game=" + encodeURIComponent(regionTarget) + "&region=" + encodeURIComponent(selectedRegion);
      const r = await fetch(url);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudieron importar los paquetes.");
      const imported = (j.packages || []).map((p: any) => ({
        name: p.name,
        quantity: p.quantity || p.name,
        price: "",
        shop2topup_id: String(p.shop2topup_id),
        category_id: String(p.category_id),
      }));
      if (!imported.length) {
        setMessage("No hay paquetes disponibles para " + selectedRegion + " en " + regionTarget + ". " + JSON.stringify(j.diagnostics || {}));
        return;
      }
      setGame(v => ({
        ...v,
        packages: [
          ...v.packages.filter(p => !p.shop2topup_id || !imported.some((n: Pack) => n.shop2topup_id === p.shop2topup_id)),
          ...imported,
        ],
      }));
      setMessage(imported.length + " paquetes de " + selectedRegion + " importados. Asigna el precio en Bs y guarda el juego.");
      setRegionTarget("");
      setRegionOptions([]);
      setSelectedRegion("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al importar paquetes.");
    } finally { setBusy(false); }
  }
  async function saveGame(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const r = await fetch("/api/admin/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(game) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setMessage(j.error || "Error"); return; }
    setMessage("Juego guardado."); setGame(blank); setEditing(false); load();
  }
  async function removeGame(id: string) {
    if (!confirm("¿Eliminar este juego y sus paquetes?")) return;
    const r = await fetch("/api/admin/games/" + id, { method: "DELETE" });
    const j = await r.json(); if (!r.ok) setMessage(j.error); else load();
  }
  async function uploadImage(file: File, target: "game" | "qr") {
    if (!file.type.startsWith("image/")) { setMessage("Selecciona una imagen válida."); return; }
    if (file.size > 2 * 1024 * 1024) { setMessage("La imagen debe pesar menos de 2 MB."); return; }
    const reader = new FileReader(); reader.onload = () => target === "game" ? setGame(v => ({ ...v, image: String(reader.result) })) : setData(v => ({ ...v, qr: String(reader.result) }));
    reader.readAsDataURL(file);
  }
  async function saveQr() {
    setBusy(true); const r = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qr: data.qr, support_whatsapp: data.support_whatsapp }) });
    const j = await r.json(); setBusy(false); setMessage(r.ok ? "Configuración de pagos y soporte actualizada." : j.error || "Error al guardar");
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setLogged(false); setPassword(""); }
  const money = (v: number) => "Bs " + Number(v || 0).toFixed(2);
  const gameQuery = normalizeGameName(game.name);
  const gameSuggestions = gameQuery ? shopGames.map(name => ({ name, normalized: normalizeGameName(name) }))
    .map(item => ({ ...item, score: item.normalized.includes(gameQuery) ? 0 : item.normalized.startsWith(gameQuery) ? 1 : editDistance(gameQuery, item.normalized) }))
    .filter(item => item.score <= Math.max(2, Math.floor(gameQuery.length * 0.35)) || item.normalized.includes(gameQuery))
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "es")).slice(0, 8) : [];
  function receiptWhatsAppLink(o: any) {
    let phone = String(o.whatsapp || "").replace(/\\D/g, "");
    if (phone.length === 8) phone = "591" + phone;
    const amount = Number(o.amount || 0);
    const date = new Date(o.created_at).toLocaleString("es-BO", { timeZone: "America/La_Paz", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true });
    const message = [
      "🧾 RECIBO DE COMPRA",
      "------------------------",
      "📦 Producto: " + o.package_name + " - " + o.game_name,
      "🆔 ID Jugador: " + o.player_id,
      "👤 Nick: " + (o.player_data?.player_name || "No disponible"),
      "💰 Monto: BOB " + amount.toFixed(2) + " · USD " + (amount / 10).toFixed(4),
      "📅 Fecha: " + date,
      "✅ Estado: ¡Entregado con éxito!",
      "🎮 Gracias por preferirnos."
    ].join("\\n");
    return phone ? "https://wa.me/" + phone + "?text=" + encodeURIComponent(message) : "";
  }
  if (!logged) return <main className="admin-login"><form onSubmit={login} className="login-card"><div className="brand-mark"><ShieldCheck /></div><p className="eyebrow">ÁREA RESTRINGIDA</p><h1>Panel administrativo</h1><p className="muted">NexTronix FF · Acceso exclusivo</p><label>Contraseña de administrador<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label><button className="primary-btn" disabled={busy}>{busy ? "Verificando..." : "Entrar al panel"}</button>{message && <p className="notice">{message}</p>}</form></main>;
  return <main className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/"><span className="brand-mark"><Gamepad2 /></span><span>NEXTRONIX <small>ADMIN</small></span></a><nav>{tabs.map(t => <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}><t.icon size={18}/>{t.label}</button>)}</nav><button className="logout-btn" onClick={logout}><LogOut size={17}/> Cerrar sesión</button></aside>
    <section className="admin-content"><header className="admin-top"><div><p className="eyebrow">NEXTRONIX FF / ADMIN</p><h1>{tabs.find(t => t.id === tab)?.label}</h1></div><span className="online-pill">● Sesión protegida</span></header>
    {message && <p className="notice">{message}</p>}
    {regionTarget && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => !busy && setRegionTarget("")}><section className="w-full max-w-md rounded-2xl border border-violet-400/30 bg-[#111018] p-5 text-white shadow-2xl" onClick={e => e.stopPropagation()}><p className="text-xs font-bold uppercase tracking-widest text-violet-300">Catálogo · Importación</p><h2 className="mt-2 text-xl font-black">Selecciona una región</h2><p className="mt-1 text-sm text-white/60">Juego: {regionTarget}. Solo se importarán los paquetes de la región elegida.</p><div className="mt-4 max-h-64 space-y-2 overflow-y-auto">{regionOptions.map(region => <label key={region.name} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 ${selectedRegion === region.name ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-white/5"}`}><span className="flex items-center gap-3"><input type="radio" name="proveedor-region" checked={selectedRegion === region.name} onChange={() => setSelectedRegion(region.name)}/><strong>{region.name}</strong></span><span className="text-xs text-white/50">{region.count} paquetes</span></label>)}</div><div className="mt-5 flex gap-2"><button type="button" className="ghost-btn flex-1" disabled={busy} onClick={() => setRegionTarget("")}>Cancelar</button><button type="button" className="primary-btn flex-1" disabled={busy || !selectedRegion} onClick={confirmRegionImport}>{busy ? "Importando..." : "Importar región"}</button></div></section></div>}
    {tab === "overview" && <div className="stat-grid"><article><span>Juegos activos</span><strong>{data.games.length}</strong></article><article><span>Pedidos registrados</span><strong>{data.orders.length}</strong></article><article><span>Clientes</span><strong>{data.customers.length}</strong></article><article><span>Moneda</span><strong>Bs</strong></article></div>}
    {tab === "games" && <><div className="section-head"><div><h2>Catálogo de juegos</h2><p className="muted">Administra imágenes, paquetes, diamantes y precios en bolivianos.</p></div><button className="primary-btn compact" onClick={() => { setGame(blank); setSelectedShopGame(""); setEditing(true); }}><Plus size={16}/> Nuevo juego</button></div>
      {editing && <form className="editor-card" onSubmit={saveGame}><h3>{game.id ? "Editar juego" : "Agregar juego"}</h3><label>Nombre del juego<input value={game.name} onChange={e => { setSelectedShopGame(""); setGame(v => ({...v,name:e.target.value})); }} required placeholder="Escribe para buscar un juego" autoComplete="off"/>{loadingShopGames && <small className="muted">Cargando sugerencias de juegos...</small>}{game.name.trim() && !selectedShopGame && gameSuggestions.length > 0 && <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-violet-400/30 bg-[#111018] p-1">{gameSuggestions.map(item => <button key={item.name} type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-violet-500/20" onMouseDown={e => e.preventDefault()} onClick={() => { setGame(v => ({...v,name:item.name})); setSelectedShopGame(item.name); }}>{item.name}</button>)}</div>}{game.name.trim() && !selectedShopGame && !loadingShopGames && gameSuggestions.length === 0 && <small className="text-amber-300">No encontramos coincidencias. Prueba con otra escritura.</small>}{selectedShopGame && <small className="text-emerald-300">Juego seleccionado del catálogo ✓</small>}</label><label>Descripción<input value={game.description} onChange={e => setGame(v => ({...v,description:e.target.value}))} placeholder="Diamantes y membresías"/></label><label className="upload-field"><Upload size={17}/> Imagen del juego<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0],"game")}/></label>{game.image && <img className="preview-img" src={game.image} alt="Vista previa"/>}<div className="package-editor"><div className="section-head"><h3>Paquetes / diamantes</h3><div className="flex flex-wrap gap-2"><button type="button" className="ghost-btn" onClick={() => importShop2Topup(selectedShopGame)} disabled={busy || !selectedShopGame || selectedShopGame !== game.name}>Importar paquetes de {game.name || "este juego"}</button><button type="button" className="ghost-btn" onClick={() => setGame(v => ({...v,packages:[...v.packages,{name:"",quantity:"",price:"",shop2topup_id:"",category_id:""}]}))}><Plus size={15}/> Añadir paquete</button></div></div><p className="muted">Los paquetes se importan sin precio. Tú defines y editas el precio en Bs. La importación no realiza recargas.</p>{game.packages.map((p,i)=><div className="pack-row" key={i}><input placeholder="Nombre (100 diamantes)" value={p.name} onChange={e => setGame(v => ({...v,packages:v.packages.map((x,n)=>n===i?{...x,name:e.target.value}:x)}))}/><input placeholder="Cantidad" value={p.quantity} onChange={e => setGame(v => ({...v,packages:v.packages.map((x,n)=>n===i?{...x,quantity:e.target.value}:x)}))}/><input placeholder="Precio Bs" type="number" min="0" step=".01" value={p.price} onChange={e => setGame(v => ({...v,packages:v.packages.map((x,n)=>n===i?{...x,price:e.target.value}:x)}))}/><input placeholder="ID de paquete" value={p.shop2topup_id || ""} onChange={e => setGame(v => ({...v,packages:v.packages.map((x,n)=>n===i?{...x,shop2topup_id:e.target.value}:x)}))}/><input placeholder="ID categoría (validación)" value={p.category_id || ""} onChange={e => setGame(v => ({...v,packages:v.packages.map((x,n)=>n===i?{...x,category_id:e.target.value}:x)}))}/><button type="button" className="icon-btn" onClick={() => setGame(v => ({...v,packages:v.packages.filter((_,n)=>n!==i)}))}><Trash2 size={16}/></button></div>)}</div><div className="form-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(false)}>Cancelar</button><button className="primary-btn" disabled={busy}><Save size={16}/>{busy ? "Guardando..." : "Guardar juego"}</button></div></form>}
      <div className="game-admin-list">{data.games.map(g=><article key={g.id} className="game-admin-card">{g.image ? <img src={g.image} alt=""/> : <div className="game-placeholder"><Gamepad2/></div>}<div className="game-info"><strong>{g.name}</strong><span>{g.packages?.length || 0} paquetes · {g.active ? "Activo" : "Oculto"}</span></div><button className="ghost-btn" onClick={() => {setGame({...g,packages:g.packages||[]});setSelectedShopGame("");setEditing(true);}}>Editar</button><button className="icon-btn danger" onClick={() => removeGame(g.id)}><Trash2 size={16}/></button></article>)}</div>
    </>}
    {tab === "orders" && <div className="table-card"><h2>Historial de pedidos</h2><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Juego</th><th>Paquete</th><th>Jugador</th><th>Total</th><th>Estado y acciones</th></tr></thead><tbody>{data.orders.map(o=><tr key={o.id}><td>{o.customer_name}<small>{o.whatsapp}</small></td><td>{o.game_name}</td><td>{o.package_name}</td><td><strong>{o.player_data?.player_name || "Nombre no disponible"}</strong><small>ID: {o.player_id}</small></td><td>{money(o.amount)}</td><td><span className="status-pill">{o.status === "awaiting_receipt" ? "Esperando comprobante" : o.status === "verifying_payment" ? "Verificando pago" : o.status === "processing" ? "Procesando recarga" : o.status === "completed" ? "Completado" : o.status === "cancelled" ? "Cancelado" : o.status}</span>{o.status === "completed" && receiptWhatsAppLink(o) && <a className="ghost-btn" href={receiptWhatsAppLink(o)} target="_blank" rel="noreferrer">Enviar comprobante por WhatsApp</a>}<div className="mt-2 flex flex-wrap gap-1">{o.status === "verifying_payment" && <button className="ghost-btn" onClick={async()=>{if(!confirm("¿Confirmaste el pago? El pedido pasará a recarga manual."))return;const r=await fetch("/api/admin/orders/"+o.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"processing"})});const j=await r.json();if(!r.ok)setMessage(j.error||"No se pudo actualizar");load();}}>Confirmar pago e iniciar recarga</button>}{o.status === "processing" && <button className="ghost-btn" onClick={async()=>{if(!confirm("Confirma que realizaste la recarga manualmente. ¿Marcar como completado?"))return;const r=await fetch("/api/admin/orders/"+o.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"completed"})});const j=await r.json();if(!r.ok)setMessage(j.error||"No se pudo actualizar");load();}}>Marcar recarga completada</button>}{o.status !== "completed" && o.status !== "cancelled" && <button className="ghost-btn danger" onClick={async()=>{if(!confirm("¿Cancelar este pedido?"))return;const r=await fetch("/api/admin/orders/"+o.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"cancelled"})});const j=await r.json();if(!r.ok)setMessage(j.error||"No se pudo actualizar");load();}}>Cancelar pedido</button>}</div></td></tr>)}</tbody></table>{!data.orders.length && <p className="empty-state">Todavía no hay pedidos.</p>}</div></div>}
    {tab === "customers" && <div className="table-card"><h2>Clientes registrados</h2><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>WhatsApp</th><th>Registro</th></tr></thead><tbody>{data.customers.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.whatsapp}</td><td>{new Date(c.created_at).toLocaleDateString("es-BO")}</td></tr>)}</tbody></table>{!data.customers.length && <p className="empty-state">Aún no hay clientes registrados.</p>}</div></div>}
    {tab === "payments" && <div className="editor-card"><h2>QR de pago de Bolivia</h2><p className="muted">Carga la imagen QR que verán tus clientes al pagar. La confirmación del pago seguirá siendo manual.</p><label className="upload-field"><Upload size={17}/> Subir imagen QR<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0],"qr")}/></label>{data.qr && <img className="qr-preview" src={data.qr} alt="QR de pago"/>}<label>Número de WhatsApp de soporte<input value={data.support_whatsapp || ""} onChange={e => setData(v => ({...v,support_whatsapp:e.target.value}))} placeholder="Ej. 5917XXXXXXX"/><small className="muted">Incluye el código de país. Este número aparecerá en el botón flotante «¿Tu recarga no llega?».</small></label><button className="primary-btn" onClick={saveQr} disabled={busy}><Save size={16}/> Guardar QR</button></div>}
    </section>
  </main>;
}
