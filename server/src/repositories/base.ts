import { v4 as uuid } from 'uuid'
import { DbHandle, db } from './db'

export interface RepoOptions {
  /** A tabela possui coluna `store_id` e todo acesso é escopado por loja. Default: true. */
  scoped?: boolean
  /** Nome da coluna chave primária. Default: 'id'. */
  pk?: string
  /** Colunas permitidas em INSERT/UPDATE (whitelist anti-injeção). Se vazio, todas são aceitas. */
  columns?: string[]
}

export interface BaseRepository<T> {
  /** SELECT * com escopo garantido: WHERE store_id = ? AND (clause). */
  findAll(storeId: string | null, clause?: string, params?: any[], orderBy?: string): T[]
  findById(storeId: string | null, id: string): T | null
  findOne(storeId: string | null, clause?: string, params?: any[]): T | null
  count(storeId: string | null, clause?: string, params?: any[]): number
  /** Insere um registro, forçando store_id a partir do parâmetro (nunca do dado). */
  insert(storeId: string | null, data: Record<string, any>): T
  /** Atualiza apenas colunas da whitelist; WHERE pk = ? AND store_id = ?. */
  update(storeId: string | null, id: string, patch: Record<string, any>): void
  /** Remove com escopo: WHERE pk = ? AND store_id = ?. */
  remove(storeId: string | null, id: string): void
  /** SQL cru para JOINs/relatórios. O caller é responsável pelo store_id no SQL. */
  raw(storeId: string | null, sql: string, params?: any[]): any[]
}

export interface GlobalRepository {
  /** Acesso a tabelas sem escopo (users, stores, subscriptions, token_blacklist...). */
  all(sql: string, params?: any[]): any[]
  get(sql: string, params?: any[]): any
  run(sql: string, params?: any[]): void
}

function scopeFragment(storeId: string | null, scoped: boolean): { where: string; params: any[] } {
  if (!scoped || storeId == null) return { where: '', params: [] }
  return { where: 'store_id = ?', params: [storeId] }
}

function buildWhere(storeId: string | null, scoped: boolean, clause?: string, params: any[] = []): { sql: string; params: any[] } {
  const base = scopeFragment(storeId, scoped)
  const parts: string[] = []
  if (base.where) parts.push(base.where)
  if (clause) parts.push(`(${clause})`)
  const whereSql = parts.length ? ' WHERE ' + parts.join(' AND ') : ''
  return { sql: whereSql, params: [...base.params, ...params] }
}

function quote(ident: string): string {
  return `"${ident.replace(/"/g, '""')}"`
}

export function createRepository<T extends Record<string, any> = Record<string, any>>(
  table: string,
  opts: RepoOptions = {},
  ctx: DbHandle = db
): BaseRepository<T> {
  const { scoped = true, pk = 'id', columns = [] } = opts

  const scopedUpdate = (storeId: string | null, extra: string[]): { sql: string; params: any[] } => {
    const parts = [extra.join(' AND ')]
    const params: any[] = []
    if (scoped && storeId != null) {
      parts.push('store_id = ?')
      params.push(storeId)
    }
    return { sql: ' WHERE ' + parts.join(' AND '), params }
  }

  return {
    findAll(storeId, clause, params = [], orderBy) {
      const { sql, params: whereParams } = buildWhere(storeId, scoped, clause, params)
      const orderSql = orderBy ? ` ORDER BY ${orderBy}` : ''
      return ctx.all(`SELECT * FROM ${quote(table)}${sql}${orderSql}`, whereParams) as T[]
    },

    findById(storeId, id) {
      return this.findOne(storeId, `${quote(pk)} = ?`, [id])
    },

    findOne(storeId, clause, params = []) {
      const { sql, params: whereParams } = buildWhere(storeId, scoped, clause, params)
      const rows = ctx.all(`SELECT * FROM ${quote(table)}${sql} LIMIT 1`, whereParams)
      return (rows.length > 0 ? rows[0] : null) as T | null
    },

    count(storeId, clause, params = []) {
      const { sql, params: whereParams } = buildWhere(storeId, scoped, clause, params)
      const rows = ctx.all(`SELECT COUNT(*) AS c FROM ${quote(table)}${sql}`, whereParams)
      return Number(rows[0]?.c ?? 0)
    },

    insert(storeId, data) {
      const record: Record<string, any> = { ...data }
      if (record[pk] == null) record[pk] = uuid()
      if (scoped && storeId != null) record.store_id = storeId

      const cols = Object.keys(record)
      const placeholders = cols.map(() => '?')
      ctx.run(
        `INSERT INTO ${quote(table)} (${cols.map(quote).join(', ')}) VALUES (${placeholders.join(', ')})`,
        cols.map(c => record[c])
      )
      return record as T
    },

    update(storeId, id, patch) {
      const allowed = columns.length
        ? columns.filter(c => patch[c] !== undefined)
        : Object.keys(patch)
      const keys = allowed.filter(c => c !== pk && c !== 'store_id')
      if (!keys.length) return
      const setSql = keys.map(c => `${quote(c)} = ?`).join(', ')
      const { sql, params } = scopedUpdate(storeId, [`${quote(pk)} = ?`])
      ctx.run(`UPDATE ${quote(table)} SET ${setSql}${sql}`, [...keys.map(c => patch[c]), id, ...params])
    },

    remove(storeId, id) {
      const { sql, params } = scopedUpdate(storeId, [`${quote(pk)} = ?`])
      ctx.run(`DELETE FROM ${quote(table)}${sql}`, [id, ...params])
    },

    raw(_storeId, sql, params = []) {
      return ctx.all(sql, params)
    },
  }
}

export function createGlobalRepository(ctx: DbHandle = db): GlobalRepository {
  return {
    all: (sql, params) => ctx.all(sql, params),
    get: (sql, params) => ctx.get(sql, params),
    run: (sql, params) => ctx.run(sql, params),
  }
}
