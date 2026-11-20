import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está configurada en Vercel.");
  return neon(url);
}

export async function ensureSchema() {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
    image TEXT DEFAULT '', active BOOLEAN NOT NULL DEFAULT true,
    packages JSONB NOT NULL DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS store_settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    whatsapp TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL, game_name TEXT NOT NULL, package_name TEXT NOT NULL,
    player_id TEXT NOT NULL, region TEXT NOT NULL DEFAULT 'LATAM',
    amount NUMERIC(12,2) NOT NULL, receipt TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending_payment', created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS player_data JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id TEXT`;
  await sql`ALTER TABLE customers ALTER COLUMN name SET DEFAULT ''`;
  await sql`ALTER TABLE customers ALTER COLUMN whatsapp SET DEFAULT ''`;
}
