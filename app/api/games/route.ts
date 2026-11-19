import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
export async function GET() {
  try {
    await ensureSchema();
    const sql = getSql();
    const games = await sql`SELECT id, name, description, image, packages FROM games WHERE active = true ORDER BY created_at DESC`;
    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ games: [] });
  }
}
