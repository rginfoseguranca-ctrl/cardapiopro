import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid'
import crypto from 'crypto'

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'cardapio.db')

let db: SqlJsDatabase

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db

  const SQL = await initSqlJs()

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')
  initTables()
  runMigrations()
  seedData()
  saveDb()

  return db
}

function saveDb() {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📋',
      "order" INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      price_promotional REAL,
      image TEXT DEFAULT '',
      category_id TEXT NOT NULL,
      is_highlighted INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      ingredients TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      items TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'pending',
      delivery_type TEXT DEFAULT 'pickup',
      delivery_address TEXT,
      table_number INTEGER,
      notes TEXT,
      scheduled_at TEXT,
      printed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_order_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      product_ids TEXT DEFAULT '[]',
      starts_at TEXT,
      ends_at TEXT,
      is_active INTEGER DEFAULT 1
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS combos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      items TEXT NOT NULL DEFAULT '[]',
      original_price REAL NOT NULL,
      combo_price REAL NOT NULL,
      is_active INTEGER DEFAULT 1
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      must_change_password INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_order_value REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      starts_at TEXT,
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS loyalty_points (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      order_id TEXT,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS loyalty_rewards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      points_required INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS cashback_transactions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      order_id TEXT,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id TEXT PRIMARY KEY,
      customer_phone TEXT,
      customer_name TEXT,
      items TEXT NOT NULL DEFAULT '[]',
      subtotal REAL DEFAULT 0,
      status TEXT DEFAULT 'abandoned',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT DEFAULT '',
      excerpt TEXT DEFAULT '',
      image TEXT DEFAULT '',
      author TEXT DEFAULT '',
      is_published INTEGER DEFAULT 0,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT,
      city TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT,
      segment TEXT,
      monthly_revenue TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS cash_register (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      order_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL DEFAULT 0,
      unit TEXT DEFAULT 'un',
      min_quantity REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      status TEXT DEFAULT 'pending',
      nfe_number TEXT,
      xml_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_webhooks (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      order_id TEXT NOT NULL,
      payment_id TEXT,
      status TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS delivery_routes (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      address TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      sequence INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      driver TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS printers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sector TEXT DEFAULT 'cozinha',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS fiado (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      order_id TEXT,
      amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id TEXT PRIMARY KEY DEFAULT 'main',
      store_name TEXT DEFAULT 'Minha Loja',
      store_icon TEXT DEFAULT '🍔',
      primary_color TEXT DEFAULT '#e74c3c',
      primary_dark TEXT DEFAULT '#c0392b',
      payment_pix_key TEXT DEFAULT '',
      payment_pix_name TEXT DEFAULT '',
      payment_card_info TEXT DEFAULT '',
      payment_cash_info TEXT DEFAULT '',
      footer_text TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      filters TEXT DEFAULT '{}',
      status TEXT DEFAULT 'draft',
      sent_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      number INTEGER UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS complement_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'checkbox',
      min INTEGER DEFAULT 0,
      max INTEGER DEFAULT 0,
      product_id TEXT NOT NULL,
      is_required INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS complements (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      max_extra INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES complement_groups(id) ON DELETE CASCADE
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS financial_accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'checking',
      bank TEXT DEFAULT '',
      balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS financial_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      icon TEXT DEFAULT '📂',
      color TEXT DEFAULT '#6c757d',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      category_id TEXT,
      type TEXT NOT NULL DEFAULT 'expense',
      description TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL,
      date TEXT NOT NULL DEFAULT (datetime('now')),
      due_date TEXT,
      paid_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      recurring_id TEXT,
      order_id TEXT,
      attachment TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES financial_accounts(id),
      FOREIGN KEY (category_id) REFERENCES financial_categories(id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS financial_recurring (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      category_id TEXT,
      account_id TEXT,
      frequency TEXT NOT NULL DEFAULT 'monthly',
      interval_days INTEGER DEFAULT 30,
      next_due TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES financial_categories(id),
      FOREIGN KEY (account_id) REFERENCES financial_accounts(id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      vehicle TEXT DEFAULT '',
      plate TEXT DEFAULT '',
      document TEXT DEFAULT '',
      pix_key TEXT DEFAULT '',
      status TEXT DEFAULT 'available',
      rating REAL DEFAULT 0,
      total_deliveries INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  addColumnIfMissing('delivery_routes', 'driver_phone', "TEXT DEFAULT ''")
  addColumnIfMissing('delivery_routes', 'started_at', 'TEXT')
  addColumnIfMissing('delivery_routes', 'delivered_at', 'TEXT')
  addColumnIfMissing('delivery_routes', 'distance', 'REAL DEFAULT 0')
  addColumnIfMissing('delivery_routes', 'fee', 'REAL DEFAULT 0')
  addColumnIfMissing('products', 'ncm', "TEXT DEFAULT ''")
  addColumnIfMissing('products', 'cest', "TEXT DEFAULT ''")
  addColumnIfMissing('products', 'cst', "TEXT DEFAULT '06000'")
  addColumnIfMissing('products', 'cfop', "TEXT DEFAULT '5102'")
  addColumnIfMissing('invoices', 'total', 'REAL DEFAULT 0')
  db.run(`
    CREATE TABLE IF NOT EXISTS supplies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'un',
      cost REAL DEFAULT 0,
      quantity REAL DEFAULT 0,
      min_quantity REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS recipe_items (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      supply_id TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS supply_movements (
      id TEXT PRIMARY KEY,
      supply_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      primary_color TEXT DEFAULT '#e74c3c',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      plan TEXT NOT NULL DEFAULT 'trial',
      status TEXT NOT NULL DEFAULT 'trialing',
      trial_ends_at TEXT,
      current_period_end TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      jti TEXT PRIMARY KEY,
      expires_at TEXT NOT NULL
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
}

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

function hasColumn(table: string, column: string): boolean {
  try {
    const stmt = db.prepare(`PRAGMA table_info(${table})`)
    let found = false
    while (stmt.step()) {
      const row = stmt.getAsObject() as any
      if (row.name === column) { found = true; break }
    }
    stmt.free()
    return found
  } catch { return false }
}

function addColumnIfMissing(table: string, column: string, def: string): void {
  if (!hasColumn(table, column)) {
    try { dbRun(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`) } catch {}
  }
}

function runMigrations(): void {
  addColumnIfMissing('company_settings', 'scheduling_enabled', 'INTEGER DEFAULT 0')
  addColumnIfMissing('company_settings', 'logo_url', "TEXT DEFAULT ''")
  addColumnIfMissing('company_settings', 'whatsapp', "TEXT DEFAULT ''")
  addColumnIfMissing('company_settings', 'opening_hours', "TEXT DEFAULT '{}'")
  addColumnIfMissing('company_settings', 'delivery_fee', 'REAL DEFAULT 0')
  addColumnIfMissing('company_settings', 'free_delivery_from', 'REAL DEFAULT 0')
  addColumnIfMissing('company_settings', 'avisos', "TEXT DEFAULT '[]'")
  db.run(`
    CREATE TABLE IF NOT EXISTS delivery_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_fee REAL DEFAULT 0,
      free_delivery_from REAL DEFAULT 0,
      radius REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      store_id TEXT DEFAULT 'main',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  addColumnIfMissing('orders', 'store_id', "TEXT DEFAULT ''")
  addColumnIfMissing('orders', 'delivery_fee', 'REAL DEFAULT 0')
  addColumnIfMissing('users', 'must_change_password', 'INTEGER DEFAULT 0')
  addColumnIfMissing('users', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('categories', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('products', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('customers', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('coupons', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('loyalty_points', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('loyalty_rewards', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('cashback_transactions', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('campaigns', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('abandoned_carts', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('tables', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('printers', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('inventory', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('inventory_movements', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('delivery_routes', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('drivers', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('invoices', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('payment_webhooks', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('blog_posts', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('supplies', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('recipe_items', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('supply_movements', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('financial_accounts', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('financial_categories', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('financial_transactions', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('financial_recurring', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('fiado', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('cash_register', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('complement_groups', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('complements', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('promotions', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('combos', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('reviews', 'store_id', "TEXT DEFAULT 'main'")
  addColumnIfMissing('store_settings', 'store_id', "TEXT DEFAULT 'main'")
}

export { dbAll, dbGet, dbRun }

function seedData() {
  const result = dbGet('SELECT COUNT(*) as count FROM categories')
  if (result.count > 0) return

  const categories = [
    { id: 'cat1', name: 'SANDUÍCHES', icon: '🥪', order: 1 },
    { id: 'cat2', name: 'BEBIDAS', icon: '🥤', order: 2 },
    { id: 'cat3', name: 'SUCOS', icon: '🧃', order: 3 },
    { id: 'cat4', name: 'CREMES', icon: '🍨', order: 4 },
  ]

  const products = [
    { id: 's1', name: 'BAURU ESPECIAL', desc: 'Presunto, queijo, tomate, alface, milho, salsicha, abacaxi e batata palha', price: 23, cat: 'cat1', hl: 1, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop', ings: ['Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Salsicha', 'Abacaxi', 'Batata Palha'] },
    { id: 's2', name: 'MISTO QUENTE', desc: 'Presunto e queijo', price: 16, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop', ings: ['Presunto', 'Queijo'] },
    { id: 's3', name: 'X-BURG', desc: 'Carne, presunto, salsicha, tomate, alface e batata palha', price: 22, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop', ings: ['Carne', 'Presunto', 'Salsicha', 'Tomate', 'Alface', 'Batata Palha'] },
    { id: 's4', name: 'MISTÃO', desc: 'Ovo, salsicha, presunto, tomate, alface e batata palha', price: 23, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop', ings: ['Ovo', 'Salsicha', 'Presunto', 'Tomate', 'Alface', 'Batata Palha'] },
    { id: 's5', name: 'FRANGO ESPECIAL', desc: 'Filé de frango, ovo, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 26, cat: 'cat1', hl: 1, img: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop', ings: ['Filé de Frango', 'Ovo', 'Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's6', name: 'FRANGO SIMPLES', desc: 'Filé de frango, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 25, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop', ings: ['Filé de Frango', 'Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's7', name: 'MODA DE FRANGO', desc: '2 filés de frango, 2 ovos, 2 salsichas, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 27, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop', ings: ['2 Filés de Frango', '2 Ovos', '2 Salsichas', 'Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's8', name: 'X-TUDO', desc: 'Carne, ovo, presunto, queijo, salsicha, bacon, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 25, cat: 'cat1', hl: 1, img: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=300&fit=crop', ings: ['Carne', 'Ovo', 'Presunto', 'Queijo', 'Salsicha', 'Bacon', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's9', name: 'X-SALADA ESPECIAL', desc: 'Carne, ovo, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 24, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop', ings: ['Carne', 'Ovo', 'Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's10', name: 'X-SALADA SIMPLES', desc: 'Carne, presunto, queijo, tomate, alface, milho, ervilha e batata palha', price: 23, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop', ings: ['Carne', 'Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Batata Palha'] },
    { id: 's11', name: 'X-BACON', desc: 'Carne, ovo, presunto, queijo, bacon, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 25, cat: 'cat1', hl: 1, img: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop', ings: ['Carne', 'Ovo', 'Presunto', 'Queijo', 'Bacon', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's12', name: 'X-DOG', desc: '3 salsichas, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 23, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop', ings: ['3 Salsichas', 'Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's13', name: 'X-AMERICANO', desc: 'Ovo, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 23, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop', ings: ['Ovo', 'Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's14', name: 'BAURU', desc: 'Presunto, queijo, tomate e alface', price: 16, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop', ings: ['Presunto', 'Queijo', 'Tomate', 'Alface'] },
    { id: 's15', name: 'FILÉ BOVINO SIMPLES', desc: 'Filé bovino, presunto, queijo, salsicha, tomate, alface, milho, abacaxi e batata palha', price: 25, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop', ings: ['Filé Bovino', 'Presunto', 'Queijo', 'Salsicha', 'Tomate', 'Alface', 'Milho', 'Abacaxi', 'Batata Palha'] },
    { id: 's16', name: 'MODA DE FILÉ BOVINO', desc: '2 filés bovinos, 2 ovos, 2 salsichas, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 27, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=300&fit=crop', ings: ['2 Filés Bovinos', '2 Ovos', '2 Salsichas', 'Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's17', name: 'FILÉ BOVINO ESPECIAL', desc: 'Filé bovino, ovo, presunto, queijo, salsicha, tomate, alface, milho, abacaxi e batata palha', price: 26, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop', ings: ['Filé Bovino', 'Ovo', 'Presunto', 'Queijo', 'Salsicha', 'Tomate', 'Alface', 'Milho', 'Abacaxi', 'Batata Palha'] },
    { id: 's18', name: 'X-BILOCA', desc: 'Filé de frango, ovo, presunto, queijo, salsicha, tomate e bacon', price: 25, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop', ings: ['Filé de Frango', 'Ovo', 'Presunto', 'Queijo', 'Salsicha', 'Tomate', 'Bacon'] },
    { id: 's19', name: 'SÓ QUENTE', desc: 'Carne, ovo, presunto, queijo, salsicha e bacon', price: 25, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop', ings: ['Carne', 'Ovo', 'Presunto', 'Queijo', 'Salsicha', 'Bacon'] },
    { id: 's20', name: 'X-CALABRESA', desc: 'Calabresa, hambúrguer, presunto, mussarela, milho, tomate, alface, abacaxi, ervilha e batata palha', price: 25, cat: 'cat1', hl: 1, img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop', ings: ['Calabresa', 'Hambúrguer', 'Presunto', 'Mussarela', 'Milho', 'Tomate', 'Alface', 'Abacaxi', 'Ervilha', 'Batata Palha'] },
    { id: 's21', name: 'X-MODA DE CASA', desc: 'Filé bovino, calabresa, filé de frango, bacon, salsicha, presunto, mussarela, ovo, tomate, alface, abacaxi, milho, ervilha e batata palha', price: 53, cat: 'cat1', hl: 1, img: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop', ings: ['Filé Bovino', 'Calabresa', 'Filé de Frango', 'Bacon', 'Salsicha', 'Presunto', 'Mussarela', 'Ovo', 'Tomate', 'Alface', 'Abacaxi', 'Milho', 'Ervilha', 'Batata Palha'] },
    { id: 's22', name: 'X-CALABRESA ESPECIAL', desc: 'Calabresa, hambúrguer, ovo, presunto, tomate, mussarela, alface, abacaxi, milho, ervilha e batata palha', price: 26, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop', ings: ['Calabresa', 'Hambúrguer', 'Ovo', 'Presunto', 'Tomate', 'Mussarela', 'Alface', 'Abacaxi', 'Milho', 'Ervilha', 'Batata Palha'] },
    { id: 's23', name: 'MODA DE HAMBURGUER', desc: '2 hambúrgueres, 2 ovos, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 27, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop', ings: ['2 Hambúrgueres', '2 Ovos', 'Presunto', 'Queijo', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's24', name: 'X-TUDÃO', desc: '2 hambúrgueres, 2 filés de frango, 2 filés bovinos, bacon, presunto, mussarela, salsicha, tomate, alface, milho, ervilha, abacaxi e batata palha', price: 53, cat: 'cat1', hl: 1, img: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=300&fit=crop', ings: ['2 Hambúrgueres', '2 Filés de Frango', '2 Filés Bovinos', 'Bacon', 'Presunto', 'Mussarela', 'Salsicha', 'Tomate', 'Alface', 'Milho', 'Ervilha', 'Abacaxi', 'Batata Palha'] },
    { id: 's25', name: 'X-BRAGA', desc: 'Hambúrguer, filé bovino, filé de frango, mussarela, cheddar, alface, tomate', price: 25, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=300&h=300&fit=crop', ings: ['Hambúrguer', 'Filé Bovino', 'Filé de Frango', 'Mussarela', 'Cheddar', 'Alface', 'Tomate'] },
    { id: 's26', name: 'X-CAROL', desc: 'Presunto, mussarela e salsicha', price: 20, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop', ings: ['Presunto', 'Mussarela', 'Salsicha'] },
    { id: 's27', name: 'X-NICAEL', desc: 'Hambúrguer, presunto, mussarela, salsicha, ovo e calabresa', price: 25, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop', ings: ['Hambúrguer', 'Presunto', 'Mussarela', 'Salsicha', 'Ovo', 'Calabresa'] },
    { id: 's28', name: 'X-VALDIRENY', desc: '3 hambúrgueres, presunto, queijo e batata palha', price: 25, cat: 'cat1', hl: 0, img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop', ings: ['3 Hambúrgueres', 'Presunto', 'Queijo', 'Batata Palha'] },
    { id: 'd1', name: 'CERVEJA LATA', desc: 'Antárctica, Brahma, Skol, Schin e Kaiser', price: 6, cat: 'cat2', hl: 0, img: 'https://images.unsplash.com/photo-1628534315533-5627d6b1dde8?w=300&h=300&fit=crop', ings: ['Cerveja'] },
    { id: 'd2', name: 'REFRIGERANTE LATA', desc: 'Coca-Cola, Kuat, Antarctica, Fanta Laranja e Sprite', price: 6, cat: 'cat2', hl: 0, img: 'https://images.unsplash.com/photo-1565962622954-efc7f367ea0e?w=300&h=300&fit=crop', ings: ['Refrigerante'] },
    { id: 'd3', name: 'REFRIGERANTE 600ML', desc: 'Coca-Cola, Kuat, Antarctica, Fanta Laranja e Sprite', price: 8, cat: 'cat2', hl: 0, img: 'https://images.unsplash.com/photo-1601681740553-22ca4d2124b0?w=300&h=300&fit=crop', ings: ['Refrigerante'] },
    { id: 'd4', name: 'REFRIGERANTE 1L', desc: 'Coca-Cola e outros sabores', price: 10, cat: 'cat2', hl: 0, img: 'https://images.unsplash.com/photo-1662131307461-4c0639939328?w=300&h=300&fit=crop', ings: ['Refrigerante'] },
    { id: 'd5', name: 'REFRIGERANTE 2L', desc: 'Coca-Cola e outros sabores', price: 14, cat: 'cat2', hl: 0, img: 'https://images.unsplash.com/photo-1711290335774-5210039e009c?w=300&h=300&fit=crop', ings: ['Refrigerante'] },
    { id: 'j1', name: 'SUCO NATURAL', desc: 'Abacaxi, Morango, Açaí, Maracujá, Uva, Tamarindo, Acerola, Caju, Cupuaçu, Laranja, Graviola', price: 11, cat: 'cat3', hl: 0, img: 'https://images.unsplash.com/photo-1583073600538-f219abfb20bc?w=300&h=300&fit=crop', ings: ['Abacaxi', 'Morango', 'Açaí', 'Maracujá', 'Uva', 'Tamarindo', 'Acerola', 'Caju', 'Cupuaçu', 'Laranja', 'Graviola'] },
    { id: 'c1', name: 'CREME', desc: 'Abacaxi, Morango, Açaí, Maracujá, Uva, Tamarindo, Acerola, Caju, Cupuaçu, Chocolate', price: 16, cat: 'cat4', hl: 0, img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop', ings: ['Abacaxi', 'Morango', 'Açaí', 'Maracujá', 'Uva', 'Tamarindo', 'Acerola', 'Caju', 'Cupuaçu', 'Chocolate'] },
  ]

  for (const c of categories) {
    dbRun('INSERT INTO categories (id, name, icon, "order") VALUES (?, ?, ?, ?)', [c.id, c.name, c.icon, c.order])
  }
  for (const p of products) {
    dbRun('INSERT INTO products (id, name, description, price, price_promotional, image, category_id, is_highlighted, is_available, ingredients) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.name, p.desc, p.price, null, p.img || '', p.cat, p.hl, 1, JSON.stringify(p.ings)])
  }

  const adminExists = dbGet('SELECT id FROM users WHERE email = ?', ['admin@index.local'])
  if (!adminExists) {
    const tempPassword = crypto.randomBytes(12).toString('base64url')
    const hash = bcrypt.hashSync(tempPassword, 10)
    dbRun('INSERT INTO users (id, name, email, password, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)',
      [uuid(), 'Administrador', 'admin@index.local', hash, 'admin', 1])
    console.log(`[SEED] Admin temporário: admin@index.local / ${tempPassword}`)
    console.log(`[SEED] IMPORTANTE: Altere a senha e o email após o primeiro login!`)
  }

  const storeExists = dbGet('SELECT id FROM company_settings WHERE id = ?', ['main'])
  if (!storeExists) {
    dbRun(`INSERT INTO company_settings (id, store_name, store_icon, primary_color, primary_dark, payment_pix_key, payment_pix_name, payment_card_info, payment_cash_info, footer_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['main', 'Minha Loja', '🍔', '#e74c3c', '#c0392b', '', '', 'Débito/Crédito', 'Dinheiro', ''])
  }
}

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
