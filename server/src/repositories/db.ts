import { rawAll, rawGet, rawRun } from '../database'

// Interface mínima de acesso ao banco. Permite injetar um handle
// (ex.: sql.js em memória nos testes) sem acoplar os repositórios
// ao singleton de produção.
export interface DbHandle {
  all(sql: string, params?: any[]): any[]
  get(sql: string, params?: any[]): any
  run(sql: string, params?: any[]): void
}

// Handle padrão: usa o banco de produção sem reescrita de escopo.
export const db: DbHandle = {
  all: (sql, params) => rawAll(sql, params),
  get: (sql, params) => rawGet(sql, params),
  run: (sql, params) => rawRun(sql, params),
}
