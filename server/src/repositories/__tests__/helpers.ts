import initSqlJs from 'sql.js'
import { DbHandle } from '../db'

// Cria um banco sql.js 100% em memória para testes de repositório,
// sem tocar em data/cardapio.db.
export async function createMemoryDb(schema: string[]): Promise<DbHandle> {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  for (const s of schema) db.run(s)

  const all = (sql: string, params?: any[]): any[] => {
    const stmt = db.prepare(sql)
    if (params) stmt.bind(params)
    const rows: any[] = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  }

  const handle: DbHandle = {
    all,
    get: (sql, params) => all(sql, params)[0] ?? null,
    run: (sql, params) => db.run(sql, params),
  }
  return handle
}

export const CORE_SCHEMA = [
  `CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    store_id TEXT DEFAULT 'main'
  )`,
  `CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    total REAL,
    store_id TEXT DEFAULT 'main'
  )`,
  `CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'admin',
    store_id TEXT DEFAULT 'main'
  )`,
  `CREATE TABLE stores (
    id TEXT PRIMARY KEY,
    name TEXT,
    slug TEXT UNIQUE
  )`,
]
