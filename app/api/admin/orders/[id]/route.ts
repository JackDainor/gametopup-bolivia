import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";

const allowed = ["processing", "completed", "cancelled", "verifying_payment"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await context.params;
    const { status } = await request.json();
    if (!allowed.includes(status)) return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT status FROM orders WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    const current = String(rows[0].status);
    if (status === "completed" && current !== "processing") {
      return NextResponse.json({ error: "Primero confirma el pago e inicia la recarga manual." }, { status: 409 });
    }
    if (status === "processing" && current !== "verifying_payment") {
      return NextResponse.json({ error: "Solo puedes iniciar la recarga después de revisar el pago." }, { status: 409 });
    }
    await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
    return NextResponse.json({ ok: true, status });
  } catch { return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 503 }); }
}
