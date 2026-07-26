import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

let db: SqlJsDatabase
let dbPath: string

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized')
  return db
}

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs()

  const dbDir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  dbPath = path.join(dbDir, 'cardapiopro.db')

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')
  initTables()
  runMigrations()
  seedIfEmpty()
  saveDb()
}

function saveDb(): void {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

function initTables(): void {
  const tables = [
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT DEFAULT '📋',
      "order" INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
      price REAL NOT NULL, price_promotional REAL, image TEXT DEFAULT '',
      category_id TEXT NOT NULL, is_highlighted INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1, ingredients TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
      store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS complement_groups (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'checkbox',
      min INTEGER DEFAULT 0, max INTEGER DEFAULT 0, product_id TEXT NOT NULL,
      is_required INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS complements (
      id TEXT PRIMARY KEY, group_id TEXT NOT NULL, name TEXT NOT NULL,
      price REAL DEFAULT 0, max_extra INTEGER DEFAULT 0, is_available INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT NOT NULL DEFAULT '',
      customer_phone TEXT NOT NULL DEFAULT '', items TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL DEFAULT 0, discount REAL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash', payment_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'pending', delivery_type TEXT DEFAULT 'pickup',
      delivery_address TEXT, table_number INTEGER, notes TEXT, scheduled_at TEXT,
      printed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main',
      synced INTEGER DEFAULT 0, server_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL,
      email TEXT, address TEXT, notes TEXT DEFAULT '', tags TEXT DEFAULT '[]',
      total_orders INTEGER DEFAULT 0, total_spent REAL DEFAULT 0,
      last_order_at TEXT, created_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS tables_list (
      id TEXT PRIMARY KEY, number INTEGER UNIQUE NOT NULL, is_active INTEGER DEFAULT 1,
      is_occupied INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS cash_register (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, description TEXT NOT NULL,
      amount REAL NOT NULL, payment_method TEXT DEFAULT 'cash', order_id TEXT,
      created_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL, product_name TEXT NOT NULL,
      quantity REAL DEFAULT 0, unit TEXT DEFAULT 'un', min_quantity REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL, type TEXT NOT NULL,
      quantity REAL NOT NULL, description TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS company_settings (
      id TEXT PRIMARY KEY, store_name TEXT DEFAULT 'Minha Loja',
      store_icon TEXT DEFAULT '🍔', primary_color TEXT DEFAULT '#e74c3c',
      primary_dark TEXT DEFAULT '#c0392b', payment_pix_key TEXT DEFAULT '',
      payment_pix_name TEXT DEFAULT '', payment_card_info TEXT DEFAULT '',
      payment_cash_info TEXT DEFAULT '', footer_text TEXT DEFAULT '',
      logo_url TEXT DEFAULT '', whatsapp TEXT DEFAULT '', opening_hours TEXT DEFAULT '{}',
      delivery_fee REAL DEFAULT 0, free_delivery_from REAL DEFAULT 0,
      scheduling_enabled INTEGER DEFAULT 0, avisos TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS fiado (
      id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, customer_name TEXT NOT NULL,
      customer_phone TEXT, order_id TEXT, amount REAL NOT NULL, paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending', due_date TEXT, notes TEXT,
      created_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
      description TEXT DEFAULT '', discount_type TEXT NOT NULL, discount_value REAL NOT NULL,
      min_order_value REAL DEFAULT 0, max_uses INTEGER DEFAULT 0, used_count INTEGER DEFAULT 0,
      starts_at TEXT, expires_at TEXT, is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS loyalty_points (
      id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, points INTEGER NOT NULL,
      order_id TEXT, description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS loyalty_rewards (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
      points_required INTEGER NOT NULL, is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, role TEXT DEFAULT 'admin', must_change_password INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')), store_id TEXT DEFAULT 'main'
    )`,
    `CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY, operation TEXT NOT NULL, entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0, status TEXT DEFAULT 'pending',
      last_error TEXT, idempotency_key TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    )`,
  ]

  for (const sql of tables) {
    db.run(sql)
  }
}

function hasColumn(table: string, column: string): boolean {
  try {
    const results = dbAll(`PRAGMA table_info(${table})`)
    return results.some((r: any) => r.name === column)
  } catch { return false }
}

function addColumnIfMissing(table: string, column: string, def: string): void {
  if (!hasColumn(table, column)) {
    try { dbRun(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`) } catch {}
  }
}

function runMigrations(): void {
  addColumnIfMissing('orders', 'synced', 'INTEGER DEFAULT 0')
  addColumnIfMissing('orders', 'server_id', 'TEXT')
  addColumnIfMissing('tables_list', 'is_occupied', 'INTEGER DEFAULT 0')
}

function seedIfEmpty(): void {
  const count = dbGet('SELECT COUNT(*) as count FROM categories')
  if (count && count.count > 0) return

  dbRun("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat1', 'SANDUÍCHES', '🥪', 1)")
  dbRun("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat2', 'BEBIDAS', '🥤', 2)")
  dbRun("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat3', 'SUCOS', '🧃', 3)")
  dbRun("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat4', 'CREMES', '🍨', 4)")

  const products = [
    ['s1', 'BAURU ESPECIAL', 'Presunto, queijo, tomate, alface', 23, '', 'cat1', 1, 1, JSON.stringify(['Presunto', 'Queijo', 'Tomate'])],
    ['s2', 'MISTO QUENTE', 'Presunto e queijo', 16, '', 'cat1', 0, 1, JSON.stringify(['Presunto', 'Queijo'])],
    ['s3', 'X-BURG', 'Carne, presunto, salsicha', 22, '', 'cat1', 0, 1, JSON.stringify(['Carne', 'Presunto'])],
    ['s4', 'MISTÃO', 'Ovo, salsicha, presunto', 23, '', 'cat1', 0, 1, JSON.stringify(['Ovo', 'Salsicha'])],
    ['s5', 'FRANGO ESPECIAL', 'Filé de frango, ovo, presunto', 26, '', 'cat1', 1, 1, JSON.stringify(['Frango', 'Ovo'])],
    ['d1', 'CERVEJA LATA', 'Antárctica, Brahma, Skol', 6, '', 'cat2', 0, 1, JSON.stringify(['Cerveja'])],
    ['d2', 'REFRIGERANTE LATA', 'Coca-Cola, Kuat, Fanta', 6, '', 'cat2', 0, 1, JSON.stringify(['Refrigerante'])],
    ['j1', 'SUCO NATURAL', 'Abacaxi, Morango, Maracujá', 11, '', 'cat3', 0, 1, JSON.stringify(['Fruta'])],
    ['c1', 'CREME', 'Abacaxi, Morango, Açaí', 16, '', 'cat4', 0, 1, JSON.stringify(['Fruta'])],
  ]

  for (const p of products) {
    dbRun(
      'INSERT INTO products (id, name, description, price, image, category_id, is_highlighted, is_available, ingredients) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      p
    )
  }

  dbRun("INSERT INTO users (id, name, email, password, role) VALUES ('local-admin', 'Administrador', 'admin@local', 'local-hash', 'admin')")
  dbRun("INSERT OR IGNORE INTO company_settings (id, store_name, store_icon, primary_color, primary_dark) VALUES ('main', 'Minha Loja', '🍔', '#e74c3c', '#c0392b')")

  console.log('[Desktop] Seed data inserido')
}

export { dbAll, dbGet, dbRun }

function dbAll(sql: string, params?: any[]): any[] {
  const stmt = db.prepare(sql)
  if (params) stmt.bind(params)
  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function dbGet(sql: string, params?: any[]): any {
  const results = dbAll(sql, params)
  return results.length > 0 ? results[0] : null
}

function dbRun(sql: string, params?: any[]): void {
  db.run(sql, params)
  saveDb()
}

export function generateId(): string {
  return crypto.randomUUID()
}
