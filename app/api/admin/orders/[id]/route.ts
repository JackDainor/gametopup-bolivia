import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await context.params;
    const { status } = await request.json();
    if (!["completed", "cancelled", "verifying_payment"].includes(status)) return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
    await ensureSchema();
    const sql = getSql();
    await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 503 }); }
}
