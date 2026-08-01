import { AsyncLocalStorage } from 'async_hooks'

// Tabelas que pertencem a uma loja (possuem coluna de escopo).
// `column` indica qual coluna identifica a loja:
//  - 'store_id' : padrão de multi-tenancy
//  - 'id'       : caso especial de company_settings (a PK É o store id)
const SCOPE_COLUMN: Record<string, string> = {
  orders: 'store_id',
  users: 'store_id',
  categories: 'store_id',
  products: 'store_id',
  customers: 'store_id',
  coupons: 'store_id',
  loyalty_points: 'store_id',
  loyalty_rewards: 'store_id',
  cashback_transactions: 'store_id',
  campaigns: 'store_id',
  abandoned_carts: 'store_id',
  tables: 'store_id',
  printers: 'store_id',
  inventory: 'store_id',
  inventory_movements: 'store_id',
  delivery_routes: 'store_id',
  drivers: 'store_id',
  invoices: 'store_id',
  payment_webhooks: 'store_id',
  blog_posts: 'store_id',
  supplies: 'store_id',
  recipe_items: 'store_id',
  supply_movements: 'store_id',
  financial_accounts: 'store_id',
  financial_categories: 'store_id',
  financial_transactions: 'store_id',
  financial_recurring: 'store_id',
  fiado: 'store_id',
  cash_register: 'store_id',
  complement_groups: 'store_id',
  complements: 'store_id',
  promotions: 'store_id',
  combos: 'store_id',
  reviews: 'store_id',
  delivery_areas: 'store_id',
  store_settings: 'store_id',
  company_settings: 'id',
}

// Palavras que indicam que não há alias após o nome da tabela
const NOT_ALIAS = new Set([
  'where', 'join', 'left', 'right', 'inner', 'outer', 'cross', 'full',
  'set', 'order', 'group', 'limit', 'offset', 'having', 'on', 'union',
  'values', 'as', 'returning', 'except', 'intersect',
])

const TRAILING_CLAUSE = /^\s*(ORDER\s+BY|GROUP\s+BY|LIMIT|OFFSET|HAVING|UNION(\s+ALL)?|EXCEPT|INTERSECT)\b/i

const storeScope = new AsyncLocalStorage<{ storeId: string }>()

export function runWithStoreScope(storeId: string, fn: () => void): void {
  storeScope.run({ storeId }, fn)
}

export function getStoreScope(): string | null {
  return storeScope.getStore()?.storeId ?? null
}

function quoteSafeSkip(sql: string, start: number): number {
  const q = sql[start]
  let i = start + 1
  const len = sql.length
  while (i < len) {
    if (sql[i] === '\\') { i += 2; continue }
    if (sql[i] === q) return i + 1
    i++
  }
  return len
}

// Retorna o índice onde termina o bloco a partir de `start`,
// parando em uma cláusula de fim (ORDER BY, GROUP BY, LIMIT, etc.) fora de parênteses.
function findClauseEnd(sql: string, start: number): number {
  let depth = 0
  let i = start
  const len = sql.length
  while (i < len) {
    const ch = sql[i]
    if (ch === '(') { depth++; i++; continue }
    if (ch === ')') { depth--; i++; continue }
    if (ch === "'" || ch === '"' || ch === '`') { i = quoteSafeSkip(sql, i); continue }
    if (depth === 0 && /\s/.test(ch)) {
      const rest = sql.slice(i)
      const m = rest.match(TRAILING_CLAUSE)
      if (m) return i
    }
    i++
  }
  return len
}

interface TableRef {
  table: string | null
  refName: string | null
  restStart: number
}

function parseTableRef(sql: string, kind: 'insert' | 'update' | 'delete' | 'select'): TableRef {
  const empty: TableRef = { table: null, refName: null, restStart: 0 }
  let m: RegExpMatchArray | null
  if (kind === 'insert') {
    m = sql.match(/^INSERT\s+(?:OR\s+\w+\s+)?INTO\s+([A-Za-z_][A-Za-z0-9_]*)/i)
  } else if (kind === 'update') {
    m = sql.match(/^UPDATE\s+([A-Za-z_][A-Za-z0-9_]*)/i)
  } else if (kind === 'delete') {
    m = sql.match(/^DELETE\s+FROM\s+([A-Za-z_][A-Za-z0-9_]*)/i)
  } else {
    m = sql.match(/\bFROM\s+([A-Za-z_][A-Za-z0-9_]*)/i)
  }
  if (!m || !m[1]) return empty

  const table = m[1]
  const after = m.index! + m[0].length

  const scopeColumn = SCOPE_COLUMN[table]
  if (!scopeColumn) return { table, refName: null, restStart: after }

  if (kind === 'insert') {
    return { table, refName: scopeColumn, restStart: after }
  }

  // detecta alias: próximo token que não seja palavra-chave
  const rest = sql.slice(after)
  const tok = rest.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)/)
  const alias = tok && !NOT_ALIAS.has(tok[1].toLowerCase()) ? tok[1] : null
  const ref = alias ? `${alias}.${scopeColumn}` : scopeColumn
  return { table, refName: ref, restStart: after }
}

function hasWhere(sql: string): { index: number; end: number } | null {
  const m = /WHERE/i.exec(sql)
  if (!m) return null
  const end = findClauseEnd(sql, m.index + m[0].length)
  return { index: m.index, end }
}

// Aplica o escopo de loja a uma query simples de tabela única (padrão do código).
// - SELECT/UPDATE/DELETE: escopam apenas quando há storeId ativo (req autenticada).
// - INSERT: sempre recebe store_id (default 'main') quando a coluna não vem explícita.
// Retorna { sql, params } reescritos ou null quando não há o que fazer.
export function applyStoreScope(
  sql: string,
  params: any[],
  storeId: string | null
): { sql: string; params: any[] } | null {
  const trimmed = sql.trim()

  if (/^INSERT\b/i.test(trimmed)) {
    const ref = parseTableRef(trimmed, 'insert')
    if (!ref.table || ref.refName !== 'store_id') return null
    const colsMatch = trimmed.match(/^INSERT\s+(?:OR\s+\w+\s+)?INTO\s+[A-Za-z_][A-Za-z0-9_]*\s*(\([^)]*\))/i)
    if (!colsMatch) return null
    const inner = colsMatch[1].slice(1, -1).trim()
    const cols = inner.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.some(c => c.toLowerCase() === 'store_id')) return null
    const colsEnd = colsMatch.index! + colsMatch[0].length - colsMatch[1].length
    const newSql =
      trimmed.slice(0, colsEnd) +
      `(${inner}, store_id)` +
      trimmed.slice(colsMatch.index! + colsMatch[0].length)
    const valuesMatch = newSql.match(/VALUES\s*(\([^)]*\))/i)
    if (!valuesMatch) return null
    const valuesEnd = valuesMatch.index! + valuesMatch[0].length - valuesMatch[1].length
    const newSql2 =
      newSql.slice(0, valuesEnd) +
      `(${valuesMatch[1].slice(1, -1).trim()}, ?)` +
      newSql.slice(valuesMatch.index! + valuesMatch[0].length)
    return { sql: newSql2, params: [...params, storeId ?? 'main'] }
  }

  if (/^UPDATE\b/i.test(trimmed) || /^DELETE\b/i.test(trimmed)) {
    if (storeId === null) return null
    const ref = parseTableRef(trimmed, /^UPDATE\b/i.test(trimmed) ? 'update' : 'delete')
    if (!ref.table || !ref.refName) return null
    return injectWhere(trimmed, ref, storeId, params)
  }

  if (/^SELECT\b/i.test(trimmed)) {
    if (storeId === null) return null
    const ref = parseTableRef(trimmed, 'select')
    if (!ref.table || !ref.refName) return null
    return injectWhere(trimmed, ref, storeId, params)
  }

  return null
}

function injectWhere(
  sql: string,
  ref: TableRef,
  storeId: string,
  params: any[]
): { sql: string; params: any[] } {
  const condition = `${ref.refName} = ?`
  const where = hasWhere(sql)
  if (where) {
    const whereExpr = sql.slice(where.index + 5, where.end).trim()
    const newSql =
      sql.slice(0, where.index) +
      `WHERE (${whereExpr}) AND ${condition}` +
      sql.slice(where.end)
    return { sql: newSql, params: [...params, storeId] }
  }
  const insertAt = findClauseEnd(sql, ref.restStart)
  const newSql = sql.slice(0, insertAt) + ` WHERE ${condition}` + sql.slice(insertAt)
  return { sql: newSql, params: [...params, storeId] }
}
