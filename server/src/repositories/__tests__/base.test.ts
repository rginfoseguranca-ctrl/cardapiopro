import { describe, it, expect, beforeAll } from 'vitest'
import { DbHandle } from '../db'
import { createRepository, createGlobalRepository } from '../base'
import { createMemoryDb, CORE_SCHEMA } from './helpers'

describe('createRepository', () => {
  let db: DbHandle
  let products: ReturnType<typeof createRepository>

  beforeAll(async () => {
    db = await createMemoryDb(CORE_SCHEMA)
    products = createRepository<{ id: string; name: string; price: number; store_id: string }>('products', {
      columns: ['name', 'price'],
    }, db)
  })

  it('insert gera id e store_id a partir do parâmetro', () => {
    const row = products.insert('storeA', { name: 'X-BURG', price: 25, store_id: 'hack' })
    expect(row.id).toBeTruthy()
    expect(row.store_id).toBe('storeA')

    const stored = products.findById('storeA', row.id)
    expect(stored?.name).toBe('X-BURG')
    expect(stored?.price).toBe(25)
  })

  it('insert com id explícito preserva o id', () => {
    const row = products.insert('storeA', { id: 'p-ok', name: 'BAURU', price: 23 })
    expect(row.id).toBe('p-ok')
    expect(products.findById('storeA', 'p-ok')?.name).toBe('BAURU')
  })

  it('insert não sobrescreve store_id a partir do dado', () => {
    const row = products.insert('storeB', { id: 'p-safe', name: 'SUCO', price: 11, store_id: 'evil' })
    expect(row.store_id).toBe('storeB')
  })

  it('findAll escopa por loja', () => {
    products.insert('storeA', { id: 'pa-1', name: 'A1', price: 1 })
    products.insert('storeB', { id: 'pb-1', name: 'B1', price: 1 })
    const a = products.findAll('storeA')
    expect(a.map(r => r.id)).toEqual(expect.arrayContaining(['p-ok', 'pa-1']))
    expect(a.map(r => r.id)).not.toContain('pb-1')
  })

  it('update respeita a whitelist e o escopo', () => {
    products.insert('storeA', { id: 'pu-1', name: 'ANTES', price: 10 })
    products.update('storeA', 'pu-1', { name: 'DEPOIS', price: 12, store_id: 'storeB', id: 'outro' })
    const row = products.findById('storeA', 'pu-1')
    expect(row?.name).toBe('DEPOIS')
    expect(row?.price).toBe(12)
    expect(row?.id).toBe('pu-1')
    expect(row?.store_id).toBe('storeA')
  })

  it('update com loja errada não altera o registro', () => {
    products.update('storeB', 'pu-1', { name: 'HACK' })
    expect(products.findById('storeA', 'pu-1')?.name).toBe('DEPOIS')
  })

  it('update de coluna fora da whitelist é ignorado', () => {
    products.insert('storeA', { id: 'pu-2', name: 'FIXO', price: 5 })
    products.update('storeA', 'pu-2', { name: 'OK', price: 9, created_at: '2099-01-01' })
    expect(products.findById('storeA', 'pu-2')?.name).toBe('OK')
    expect(products.findById('storeA', 'pu-2')?.price).toBe(9)
    expect((products.findById('storeA', 'pu-2') as any).created_at).toBeUndefined()
  })

  it('remove com escopo e count', () => {
    products.insert('storeA', { id: 'pr-1', name: 'REMOVER', price: 3 })
    expect(products.count('storeA')).toBeGreaterThan(0)
    products.remove('storeB', 'pr-1')
    expect(products.findById('storeA', 'pr-1')).not.toBeNull()
    products.remove('storeA', 'pr-1')
    expect(products.findById('storeA', 'pr-1')).toBeNull()
  })

  it('findOne com cláusula custom e parâmetros', () => {
    const row = products.findOne('storeA', 'name = ?', ['BAURU'])
    expect(row?.id).toBe('p-ok')
  })

  it('count considera o escopo', () => {
    products.insert('storeA', { id: 'pc-1', name: 'CA', price: 1 })
    const beforeB = products.count('storeB')
    products.insert('storeB', { id: 'pc-2', name: 'CB', price: 1 })
    expect(products.count('storeB')).toBe(beforeB + 1)
    expect(products.count('storeA')).toBeGreaterThanOrEqual(1)
  })
})

describe('createRepository sem escopo (scoped: false)', () => {
  let db: DbHandle
  let stores: ReturnType<typeof createRepository>

  beforeAll(async () => {
    db = await createMemoryDb(CORE_SCHEMA)
    stores = createRepository<{ id: string; name: string; slug: string }>('stores', { scoped: false, columns: ['name', 'slug'] }, db)
  })

  it('insere e consulta sem coluna store_id', () => {
    stores.insert(null, { id: 's1', name: 'Loja X', slug: 'loja-x' })
    expect(stores.findOne(null, 'slug = ?', ['loja-x'])?.name).toBe('Loja X')
  })

  it('update não grava coluna store_id inexistente', () => {
    stores.update(null, 's1', { name: 'Loja Y' })
    expect(stores.findById(null, 's1')?.name).toBe('Loja Y')
  })
})

describe('createGlobalRepository', () => {
  let db: DbHandle

  beforeAll(async () => {
    db = await createMemoryDb(CORE_SCHEMA)
  })

  it('acessa tabelas globais sem escopo', () => {
    const g = createGlobalRepository(db)
    g.run('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)', ['u1', 'a@b.com', 'x', 'admin'])
    expect(g.get('SELECT * FROM users WHERE email = ?', ['a@b.com'])).toMatchObject({ id: 'u1', role: 'admin' })
  })
})
