import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

let db: SqlJsDatabase
let dbPath: string
let dbDir: string
let dirty = false
let saveTimer: ReturnType<typeof setInterval> | null = null

const SAVE_INTERVAL = 5000

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized')
  return db
}

export async function initDatabase(): Promise<void> {
  const wasmPath = app.isPackaged
    ? path.join(process.resourcesPath, 'sql-wasm.wasm')
    : path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')

  const SQL = await initSqlJs({
    locateFile: () => wasmPath
  })

  dbDir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  dbPath = path.join(dbDir, 'cardapiopro.db')

  if (fs.existsSync(dbPath)) {
    try {
      const buffer = fs.readFileSync(dbPath)
      db = new SQL.Database(buffer)
      console.log('[Desktop] Banco de dados carregado com sucesso')
    } catch (err) {
      console.error('[Desktop] ERRO: Banco corrompido, criando backup e reiniciando:', err)
      const backupPath = dbPath + '.corrupted.' + Date.now()
      try { fs.copyFileSync(dbPath, backupPath) } catch {}
      try { fs.unlinkSync(dbPath) } catch {}
      db = new SQL.Database()
      console.log(`[Desktop] Backup do DB corrompido salvo em: ${backupPath}`)
    }
  } else {
    db = new SQL.Database()
    console.log('[Desktop] Banco de dados novo criado')
  }

  db.run('PRAGMA foreign_keys = ON')
  initTables()
  runMigrations()
  seedIfEmpty()

  cacheAllSeedImages()

  forceSaveDb()

  saveTimer = setInterval(() => {
    if (dirty) forceSaveDb()
  }, SAVE_INTERVAL)
}

async function cacheAllSeedImages(): Promise<void> {
  try {
    const { cacheImage, getCachedImagePath } = require('./image-cache')
    const products = dbAll('SELECT id, image FROM products WHERE image != "" AND image NOT LIKE "local-cache://%" AND image NOT LIKE "data:%"')
    let cached = 0
    for (const p of products) {
      const existing = getCachedImagePath(p.image)
      if (existing) {
        const crypto = require('crypto')
        const hash = crypto.createHash('md5').update(p.image).digest('hex')
        dbRun('UPDATE products SET image = ? WHERE id = ? AND image != ?', [`local-cache://${hash}`, p.id, `local-cache://${hash}`])
        cached++
        continue
      }
      const localPath = await cacheImage(p.image)
      if (localPath) {
        const crypto = require('crypto')
        const hash = crypto.createHash('md5').update(p.image).digest('hex')
        dbRun('UPDATE products SET image = ? WHERE id = ?', [`local-cache://${hash}`, p.id])
        cached++
      }
    }
    if (cached > 0) forceSaveDb()
    console.log(`[Desktop] ${cached} imagens cacheadas proativamente`)
  } catch (err) {
    console.error('[Desktop] Erro ao cachear imagens:', err)
  }
}

export function forceSaveDb(): void {
  if (!db) return
  try {
    const data = db.export()
    const buffer = Buffer.from(data)
    const tmpPath = dbPath + '.tmp'
    fs.writeFileSync(tmpPath, buffer)
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
    fs.renameSync(tmpPath, dbPath)
    dirty = false
  } catch (err) {
    console.error('[Desktop] Erro ao salvar banco:', err)
  }
}

export function shutdownDatabase(): void {
  if (saveTimer) {
    clearInterval(saveTimer)
    saveTimer = null
  }
  forceSaveDb()
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
      is_open INTEGER DEFAULT 1,
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
    `CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY, value TEXT DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
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
    try { db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`) } catch {}
  }
}

function getSchemaVersion(): number {
  try {
    const row = dbGet('SELECT version FROM schema_version')
    return row ? row.version : 0
  } catch { return 0 }
}

function setSchemaVersion(v: number): void {
  db.run('DELETE FROM schema_version')
  db.run('INSERT INTO schema_version (version) VALUES (?)', [v])
}

function runMigrations(): void {
  addColumnIfMissing('orders', 'synced', 'INTEGER DEFAULT 0')
  addColumnIfMissing('orders', 'server_id', 'TEXT')
  addColumnIfMissing('tables_list', 'is_occupied', 'INTEGER DEFAULT 0')
  addColumnIfMissing('company_settings', 'is_open', 'INTEGER DEFAULT 1')
  addColumnIfMissing('company_settings', 'slug', 'TEXT DEFAULT \'\'')
  addColumnIfMissing('products', 'barcode', 'TEXT DEFAULT \'\'')

  const version = getSchemaVersion()

  if (version < 1) {
    const bcrypt = require('bcryptjs')
    const correctHash = bcrypt.hashSync('admin123', 10)
    db.run("UPDATE users SET password = ? WHERE email = 'admin@local'", [correctHash])
    setSchemaVersion(1)
    console.log('[Desktop] Migration v1 aplicada: senha admin resetada')
  }

  if (version < 2) {
    restoreRealProducts()
    setSchemaVersion(2)
    console.log('[Desktop] Migration v2 aplicada: produtos reais restaurados')
  }

  if (version < 3) {
    restoreRealProductImages()
    setSchemaVersion(3)
    console.log('[Desktop] Migration v3 aplicada: imagens dos produtos restauradas')
  }
}

const productImages: Record<string, string> = {
  's1': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',
  's2': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop',
  's3': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop',
  's4': 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop',
  's5': 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop',
  's6': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop',
  's7': 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop',
  's8': 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=300&fit=crop',
  's9': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',
  's10': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop',
  's11': 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop',
  's12': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop',
  's13': 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop',
  's14': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop',
  's15': 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop',
  's16': 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=300&fit=crop',
  's17': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',
  's18': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop',
  's19': 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop',
  's20': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop',
  's21': 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop',
  's22': 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop',
  's23': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop',
  's24': 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=300&fit=crop',
  's25': 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=300&h=300&fit=crop',
  's26': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop',
  's27': 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop',
  's28': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop',
  'd1': 'https://images.unsplash.com/photo-1628534315533-5627d6b1dde8?w=300&h=300&fit=crop',
  'd2': 'https://images.unsplash.com/photo-1565962622954-efc7f367ea0e?w=300&h=300&fit=crop',
  'd3': 'https://images.unsplash.com/photo-1601681740553-22ca4d2124b0?w=300&h=300&fit=crop',
  'd4': 'https://images.unsplash.com/photo-1662131307461-4c0639939328?w=300&h=300&fit=crop',
  'd5': 'https://images.unsplash.com/photo-1711290335774-5210039e009c?w=300&h=300&fit=crop',
  'j1': 'https://images.unsplash.com/photo-1583073600538-f219abfb20bc?w=300&h=300&fit=crop',
  'c1': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop',
}

function restoreRealProductImages(): void {
  let updated = 0
  for (const [id, image] of Object.entries(productImages)) {
    const product = dbGet('SELECT id, image FROM products WHERE id = ?', [id])
    if (product && (!product.image || product.image === '')) {
      dbRun('UPDATE products SET image = ? WHERE id = ?', [image, id])
      updated++
    }
  }
  console.log(`[Desktop] ${updated} produtos com imagens restauradas`)
}

function restoreRealProducts(): void {
  const existingCount = dbGet('SELECT COUNT(*) as c FROM products')
  if (existingCount && existingCount.c > 9) return

  db.run("DELETE FROM products")
  db.run("DELETE FROM categories")

  db.run("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat1', 'SANDUÍCHES', '🥪', 1)")
  db.run("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat2', 'BEBIDAS', '🥤', 2)")
  db.run("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat3', 'SUCOS', '🧃', 3)")
  db.run("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat4', 'CREMES', '🍨', 4)")

  const products: [string, string, string, number, string, string, string, number, number][] = [
    ['s14', 'BAURU', 'Presunto, queijo, tomate e alface', 16, '["Presunto","Queijo","Tomate","Alface"]', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s1', 'BAURU ESPECIAL', 'Presunto, queijo, tomate, alface, milho, salsicha, abacaxi e batata palha', 23, '["Presunto","Queijo","Tomate","Alface","Milho","Salsicha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop', 'cat1', 1, 1],
    ['d1', 'CERVEJA LATA', 'Antárctica, Brahma, Skol, Schin e Kaiser', 6, '["Cerveja"]', 'https://images.unsplash.com/photo-1628534315533-5627d6b1dde8?w=300&h=300&fit=crop', 'cat2', 0, 1],
    ['c1', 'CREME', 'Abacaxi, Morango, Açaí, Maracujá, Uva, Tamarindo, Acerola, Caju, Cupuaçu, Chocolate', 16, '["Abacaxi","Morango","Açaí","Maracujá","Uva","Tamarindo","Acerola","Caju","Cupuaçu","Chocolate"]', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop', 'cat4', 0, 1],
    ['s17', 'FILÉ BOVINO ESPECIAL', 'Filé bovino, ovo, presunto, queijo, salsicha, tomate, alface, milho, abacaxi e batata palha', 26, '["Filé Bovino","Ovo","Presunto","Queijo","Salsicha","Tomate","Alface","Milho","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s15', 'FILÉ BOVINO SIMPLES', 'Filé bovino, presunto, queijo, salsicha, tomate, alface, milho, abacaxi e batata palha', 25, '["Filé Bovino","Presunto","Queijo","Salsicha","Tomate","Alface","Milho","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s5', 'FRANGO ESPECIAL', 'Filé de frango, ovo, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', 26, '["Filé de Frango","Ovo","Presunto","Queijo","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop', 'cat1', 1, 1],
    ['s6', 'FRANGO SIMPLES', 'Filé de frango, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', 25, '["Filé de Frango","Presunto","Queijo","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s2', 'MISTO QUENTE', 'Presunto e queijo', 16, '["Presunto","Queijo"]', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s4', 'MISTÃO', 'Ovo, salsicha, presunto, tomate, alface e batata palha', 23, '["Ovo","Salsicha","Presunto","Tomate","Alface","Batata Palha"]', 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s16', 'MODA DE FILÉ BOVINO', '2 filés bovinos, 2 ovos, 2 salsichas, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', 27, '["2 Filés Bovinos","2 Ovos","2 Salsichas","Presunto","Queijo","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s7', 'MODA DE FRANGO', '2 filés de frango, 2 ovos, 2 salsichas, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', 27, '["2 Filés de Frango","2 Ovos","2 Salsichas","Presunto","Queijo","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s23', 'MODA DE HAMBURGUER', '2 hambúrgueres, 2 ovos, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', 27, '["2 Hambúrgueres","2 Ovos","Presunto","Queijo","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['d4', 'REFRIGERANTE 1L', 'Coca-Cola e outros sabores', 10, '["Refrigerante"]', 'https://images.unsplash.com/photo-1662131307461-4c0639939328?w=300&h=300&fit=crop', 'cat2', 0, 1],
    ['d5', 'REFRIGERANTE 2L', 'Coca-Cola e outros sabores', 14, '["Refrigerante"]', 'https://images.unsplash.com/photo-1711290335774-5210039e009c?w=300&h=300&fit=crop', 'cat2', 0, 1],
    ['d3', 'REFRIGERANTE 600ML', 'Coca-Cola, Kuat, Antarctica, Fanta Laranja e Sprite', 8, '["Refrigerante"]', 'https://images.unsplash.com/photo-1601681740553-22ca4d2124b0?w=300&h=300&fit=crop', 'cat2', 0, 1],
    ['d2', 'REFRIGERANTE LATA', 'Coca-Cola, Kuat, Antarctica, Fanta Laranja e Sprite', 6, '["Refrigerante"]', 'https://images.unsplash.com/photo-1565962622954-efc7f367ea0e?w=300&h=300&fit=crop', 'cat2', 0, 1],
    ['j1', 'SUCO NATURAL', 'Abacaxi, Morango, Açaí, Maracujá, Uva, Tamarindo, Acerola, Caju, Cupuaçu, Laranja, Graviola', 11, '["Abacaxi","Morango","Açaí","Maracujá","Uva","Tamarindo","Acerola","Caju","Cupuaçu","Laranja","Graviola"]', 'https://images.unsplash.com/photo-1583073600538-f219abfb20bc?w=300&h=300&fit=crop', 'cat3', 0, 1],
    ['s19', 'SÓ QUENTE', 'Carne, ovo, presunto, queijo, salsicha e bacon', 25, '["Carne","Ovo","Presunto","Queijo","Salsicha","Bacon"]', 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s13', 'X-AMERICANO', 'Ovo, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', 23, '["Ovo","Presunto","Queijo","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s11', 'X-BACON', 'Carne, ovo, presunto, queijo, bacon, tomate, alface, milho, ervilha, abacaxi e batata palha', 25, '["Carne","Ovo","Presunto","Queijo","Bacon","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop', 'cat1', 1, 1],
    ['s18', 'X-BILOCA', 'Filé de frango, ovo, presunto, queijo, salsicha, tomate e bacon', 25, '["Filé de Frango","Ovo","Presunto","Queijo","Salsicha","Tomate","Bacon"]', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s25', 'X-BRAGA', 'Hambúrguer, filé bovino, filé de frango, mussarela, cheddar, alface, tomate', 25, '["Hambúrguer","Filé Bovino","Filé de Frango","Mussarela","Cheddar","Alface","Tomate"]', 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s3', 'X-BURG', 'Carne, presunto, salsicha, tomate, alface e batata palha', 22, '["Carne","Presunto","Salsicha","Tomate","Alface","Batata Palha"]', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s20', 'X-CALABRESA', 'Calabresa, hambúrguer, presunto, mussarela, milho, tomate, alface, abacaxi, ervilha e batata palha', 25, '["Calabresa","Hambúrguer","Presunto","Mussarela","Milho","Tomate","Alface","Abacaxi","Ervilha","Batata Palha"]', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop', 'cat1', 1, 1],
    ['s22', 'X-CALABRESA ESPECIAL', 'Calabresa, hambúrguer, ovo, presunto, tomate, mussarela, alface, abacaxi, milho, ervilha e batata palha', 26, '["Calabresa","Hambúrguer","Ovo","Presunto","Tomate","Mussarela","Alface","Abacaxi","Milho","Ervilha","Batata Palha"]', 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s26', 'X-CAROL', 'Presunto, mussarela e salsicha', 20, '["Presunto","Mussarela","Salsicha"]', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s12', 'X-DOG', '3 salsichas, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', 23, '["3 Salsichas","Presunto","Queijo","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s21', 'X-MODA DE CASA', 'Filé bovino, calabresa, filé de frango, bacon, salsicha, presunto, mussarela, ovo, tomate, alface, abacaxi, milho, ervilha e batata palha', 53, '["Filé Bovino","Calabresa","Filé de Frango","Bacon","Salsicha","Presunto","Mussarela","Ovo","Tomate","Alface","Abacaxi","Milho","Ervilha","Batata Palha"]', 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop', 'cat1', 1, 1],
    ['s27', 'X-NICAEL', 'Hambúrguer, presunto, mussarela, salsicha, ovo e calabresa', 25, '["Hambúrguer","Presunto","Mussarela","Salsicha","Ovo","Calabresa"]', 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s9', 'X-SALADA ESPECIAL', 'Carne, ovo, presunto, queijo, tomate, alface, milho, ervilha, abacaxi e batata palha', 24, '["Carne","Ovo","Presunto","Queijo","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s10', 'X-SALADA SIMPLES', 'Carne, presunto, queijo, tomate, alface, milho, ervilha e batata palha', 23, '["Carne","Presunto","Queijo","Tomate","Alface","Milho","Ervilha","Batata Palha"]', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop', 'cat1', 0, 1],
    ['s8', 'X-TUDO', 'Carne, ovo, presunto, queijo, salsicha, bacon, tomate, alface, milho, ervilha, abacaxi e batata palha', 25, '["Carne","Ovo","Presunto","Queijo","Salsicha","Bacon","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=300&fit=crop', 'cat1', 1, 1],
    ['s24', 'X-TUDÃO', '2 hambúrgueres, 2 filés de frango, 2 filés bovinos, bacon, presunto, mussarela, salsicha, tomate, alface, milho, ervilha, abacaxi e batata palha', 53, '["2 Hambúrgueres","2 Filés de Frango","2 Filés Bovinos","Bacon","Presunto","Mussarela","Salsicha","Tomate","Alface","Milho","Ervilha","Abacaxi","Batata Palha"]', 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=300&fit=crop', 'cat1', 1, 1],
    ['s28', 'X-VALDIRENY', '3 hambúrgueres, presunto, queijo e batata palha', 25, '["3 Hambúrgueres","Presunto","Queijo","Batata Palha"]', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop', 'cat1', 0, 1],
  ]

  for (const p of products) {
    db.run(
      'INSERT INTO products (id, name, description, price, ingredients, image, category_id, is_highlighted, is_available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
      p
    )
  }

  console.log(`[Desktop] ${products.length} produtos reais restaurados do servidor`)
}

function seedIfEmpty(): void {
  const count = dbGet('SELECT COUNT(*) as count FROM categories')
  if (count && count.count > 0) return

  db.run("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat1', 'SANDUÍCHES', '🥪', 1)")
  db.run("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat2', 'BEBIDAS', '🥤', 2)")
  db.run("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat3', 'SUCOS', '🧃', 3)")
  db.run("INSERT INTO categories (id, name, icon, \"order\") VALUES ('cat4', 'CREMES', '🍨', 4)")

  const products = [
    ['s1', 'BAURU ESPECIAL', 'Presunto, queijo, tomate, alface', 23, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop', 'cat1', 1, 1, JSON.stringify(['Presunto', 'Queijo', 'Tomate'])],
    ['s2', 'MISTO QUENTE', 'Presunto e queijo', 16, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop', 'cat1', 0, 1, JSON.stringify(['Presunto', 'Queijo'])],
    ['s3', 'X-BURG', 'Carne, presunto, salsicha', 22, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop', 'cat1', 0, 1, JSON.stringify(['Carne', 'Presunto'])],
    ['s4', 'MISTÃO', 'Ovo, salsicha, presunto', 23, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop', 'cat1', 0, 1, JSON.stringify(['Ovo', 'Salsicha'])],
    ['s5', 'FRANGO ESPECIAL', 'Filé de frango, ovo, presunto', 26, 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&h=300&fit=crop', 'cat1', 1, 1, JSON.stringify(['Frango', 'Ovo'])],
    ['d1', 'CERVEJA LATA', 'Antárctica, Brahma, Skol', 6, 'https://images.unsplash.com/photo-1628534315533-5627d6b1dde8?w=300&h=300&fit=crop', 'cat2', 0, 1, JSON.stringify(['Cerveja'])],
    ['d2', 'REFRIGERANTE LATA', 'Coca-Cola, Kuat, Fanta', 6, 'https://images.unsplash.com/photo-1565962622954-efc7f367ea0e?w=300&h=300&fit=crop', 'cat2', 0, 1, JSON.stringify(['Refrigerante'])],
    ['j1', 'SUCO NATURAL', 'Abacaxi, Morango, Maracujá', 11, 'https://images.unsplash.com/photo-1583073600538-f219abfb20bc?w=300&h=300&fit=crop', 'cat3', 0, 1, JSON.stringify(['Fruta'])],
    ['c1', 'CREME', 'Abacaxi, Morango, Açaí', 16, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop', 'cat4', 0, 1, JSON.stringify(['Fruta'])],
  ]

  for (const p of products) {
    db.run(
      'INSERT INTO products (id, name, description, price, image, category_id, is_highlighted, is_available, ingredients) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      p
    )
  }

  const bcrypt = require('bcryptjs')
  const adminHash = bcrypt.hashSync('admin123', 10)
  db.run("INSERT INTO users (id, name, email, password, role) VALUES ('local-admin', 'Administrador', 'admin@local', ?, 'admin')", [adminHash])
  db.run("INSERT OR IGNORE INTO company_settings (id, store_name, store_icon, primary_color, primary_dark) VALUES ('main', 'Minha Loja', '🍔', '#e74c3c', '#c0392b')")

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
  dirty = true
}

export function generateId(): string {
  return crypto.randomUUID()
}
