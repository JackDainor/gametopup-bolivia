-- Ejecuta este archivo en el SQL Editor de Neon si prefieres crear las tablas manualmente.
CREATE TABLE IF NOT EXISTS games (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', image TEXT DEFAULT '',
 active BOOLEAN NOT NULL DEFAULT true, packages JSONB NOT NULL DEFAULT '[]'::jsonb,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS store_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS customers (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, whatsapp TEXT NOT NULL,
 password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT NOT NULL, whatsapp TEXT NOT NULL,
 game_name TEXT NOT NULL, package_name TEXT NOT NULL, player_id TEXT NOT NULL,
 region TEXT NOT NULL DEFAULT 'LATAM', amount NUMERIC(12,2) NOT NULL, receipt TEXT DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending_payment', created_at TIMESTAMPTZ DEFAULT NOW()
);
