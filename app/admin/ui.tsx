"use client";
import { useEffect, useState } from "react";
import { Gamepad2, LayoutDashboard, Package, Users, ReceiptText, QrCode, LogOut, Plus, Trash2, Save, Upload, ShieldCheck } from "lucide-react";

type Pack = { name: string; quantity: string; price: string };
type Game = { id: string; name: string; description: string; image: string; active: boolean; packages: Pack[] };
type Data = { games: Game[]; qr: string; orders: any[]; customers: any[] };

const blank: Game = { id: "", name: "", description: "", image: "", active: true, packages: [] };
const tabs = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "games", label: "Juegos y precios", icon: Gamepad2 },
  { id: "orders", label: "Pedidos", icon: ReceiptText },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "payments", label: "Pago QR", icon: QrCode },
];

export default function AdminDashboard() {
  const [logged, setLogged] = useState(false), [password, setPassword] = useState("");
  const [tab, setTab] = useState("overview"), [data, setData] = useState<Data>({ games: [], qr: "", orders: [], customers: [] });
  const [game, setGame] = useState<Game>(blank), [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function load() {
    const r = await fetch("/api/admin/games");
    const j = await r.json();
    if (!r.ok) { setMessage(j.error || "No se pudo cargar"); return; }
    setData(j);
  }
  useEffect(() => { if (logged) load(); }, [logged]);
  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const j = await r.json(); setBusy(false);
    if (r.ok) setLogged(true); else setMessage(j.error || "No se pudo iniciar sesión");
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
    setBusy(true); const r = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qr: data.qr }) });
    const j = await r.json(); setBusy(false); setMessage(r.ok ? "QR actualizado." : j.error || "Error al guardar QR");
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setLogged(false); setPassword(""); }
  const money = (v: number) => "Bs " + Number(v || 0).toFixed(2);
  if (!logged) return <main className="admin-login"><form onSubmit={login} className="login-card"><div className="brand-mark"><ShieldCheck /></div><p className="eyebrow">ÁREA RESTRINGIDA</p><h1>Panel administrativo</h1><p className="muted">NexTronix FF · Acceso exclusivo</p><label>Contraseña de administrador<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label><button className="primary-btn" disabled={busy}>{busy ? "Verificando..." : "Entrar al panel"}</button>{message && <p className="notice">{message}</p>}</form></main>;
  return <main className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/"><span className="brand-mark"><Gamepad2 /></span><span>NEXTRONIX <small>ADMIN</small></span></a><nav>{tabs.map(t => <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}><t.icon size={18}/>{t.label}</button>)}</nav><button className="logout-btn" onClick={logout}><LogOut size={17}/> Cerrar sesión</button></aside>
    <section className="admin-content"><header className="admin-top"><div><p className="eyebrow">NEXTRONIX FF / ADMIN</p><h1>{tabs.find(t => t.id === tab)?.label}</h1></div><span className="online-pill">● Sesión protegida</span></header>
    {message && <p className="notice">{message}</p>}
    {tab === "overview" && <div className="stat-grid"><article><span>Juegos activos</span><strong>{data.games.length}</strong></article><article><span>Pedidos registrados</span><strong>{data.orders.length}</strong></article><article><span>Clientes</span><strong>{data.customers.length}</strong></article><article><span>Moneda</span><strong>Bs</strong></article></div>}
    {tab === "games" && <><div className="section-head"><div><h2>Catálogo de juegos</h2><p className="muted">Administra imágenes, paquetes, diamantes y precios en bolivianos.</p></div><button className="primary-btn compact" onClick={() => { setGame(blank); setEditing(true); }}><Plus size={16}/> Nuevo juego</button></div>
      {editing && <form className="editor-card" onSubmit={saveGame}><h3>{game.id ? "Editar juego" : "Agregar juego"}</h3><label>Nombre del juego<input value={game.name} onChange={e => setGame(v => ({...v,name:e.target.value}))} required placeholder="Ej. Free Fire"/></label><label>Descripción<input value={game.description} onChange={e => setGame(v => ({...v,description:e.target.value}))} placeholder="Diamantes y membresías"/></label><label className="upload-field"><Upload size={17}/> Imagen del juego<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0],"game")}/></label>{game.image && <img className="preview-img" src={game.image} alt="Vista previa"/>}<div className="package-editor"><div className="section-head"><h3>Paquetes / diamantes</h3><button type="button" className="ghost-btn" onClick={() => setGame(v => ({...v,packages:[...v.packages,{name:"",quantity:"",price:""}]}))}><Plus size={15}/> Añadir paquete</button></div>{game.packages.map((p,i)=><div className="pack-row" key={i}><input placeholder="Nombre (100 diamantes)" value={p.name} onChange={e => setGame(v => ({...v,packages:v.packages.map((x,n)=>n===i?{...x,name:e.target.value}:x)}))}/><input placeholder="Cantidad" value={p.quantity} onChange={e => setGame(v => ({...v,packages:v.packages.map((x,n)=>n===i?{...x,quantity:e.target.value}:x)}))}/><input placeholder="Precio Bs" type="number" min="0" step=".01" value={p.price} onChange={e => setGame(v => ({...v,packages:v.packages.map((x,n)=>n===i?{...x,price:e.target.value}:x)}))}/><button type="button" className="icon-btn" onClick={() => setGame(v => ({...v,packages:v.packages.filter((_,n)=>n!==i)}))}><Trash2 size={16}/></button></div>)}</div><div className="form-actions"><button type="button" className="ghost-btn" onClick={() => setEditing(false)}>Cancelar</button><button className="primary-btn" disabled={busy}><Save size={16}/>{busy ? "Guardando..." : "Guardar juego"}</button></div></form>}
      <div className="game-admin-list">{data.games.map(g=><article key={g.id} className="game-admin-card">{g.image ? <img src={g.image} alt=""/> : <div className="game-placeholder"><Gamepad2/></div>}<div className="game-info"><strong>{g.name}</strong><span>{g.packages?.length || 0} paquetes · {g.active ? "Activo" : "Oculto"}</span></div><button className="ghost-btn" onClick={() => {setGame({...g,packages:g.packages||[]});setEditing(true);}}>Editar</button><button className="icon-btn danger" onClick={() => removeGame(g.id)}><Trash2 size={16}/></button></article>)}</div>
    </>}
    {tab === "orders" && <div className="table-card"><h2>Historial de pedidos</h2><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Juego</th><th>Paquete</th><th>ID jugador</th><th>Total</th><th>Estado</th></tr></thead><tbody>{data.orders.map(o=><tr key={o.id}><td>{o.customer_name}<small>{o.whatsapp}</small></td><td>{o.game_name}</td><td>{o.package_name}</td><td>{o.player_id}</td><td>{money(o.amount)}</td><td><span className="status-pill">{o.status}</span></td></tr>)}</tbody></table>{!data.orders.length && <p className="empty-state">Todavía no hay pedidos.</p>}</div></div>}
    {tab === "customers" && <div className="table-card"><h2>Clientes registrados</h2><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>WhatsApp</th><th>Registro</th></tr></thead><tbody>{data.customers.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.whatsapp}</td><td>{new Date(c.created_at).toLocaleDateString("es-BO")}</td></tr>)}</tbody></table>{!data.customers.length && <p className="empty-state">Aún no hay clientes registrados.</p>}</div></div>}
    {tab === "payments" && <div className="editor-card"><h2>QR de pago de Bolivia</h2><p className="muted">Carga la imagen QR que verán tus clientes al pagar. La confirmación del pago seguirá siendo manual.</p><label className="upload-field"><Upload size={17}/> Subir imagen QR<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0],"qr")}/></label>{data.qr && <img className="qr-preview" src={data.qr} alt="QR de pago"/>}<button className="primary-btn" onClick={saveQr} disabled={busy}><Save size={16}/> Guardar QR</button></div>}
    </section>
  </main>;
}
