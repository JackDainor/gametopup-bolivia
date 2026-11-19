import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await context.params;
    await ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM games WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo eliminar" }, { status: 503 });
  }
}
