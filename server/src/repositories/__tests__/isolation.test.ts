import { describe, it, expect, beforeAll } from 'vitest'
import { DbHandle } from '../db'
import { createRepository } from '../base'
import { createMemoryDb, CORE_SCHEMA } from './helpers'

// O cenário que o reescritor de SQL por regex não cobria de forma garantida:
// isolamento real entre lojas no INSERT/UPDATE/DELETE/SELECT.
describe('isolamento entre lojas', () => {
  let db: DbHandle
  let products: ReturnType<typeof createRepository>
  let orders: ReturnType<typeof createRepository>

  beforeAll(async () => {
    db = await createMemoryDb(CORE_SCHEMA)
    products = createRepository<{ id: string; name: string; price: number; store_id: string }>('products', { columns: ['name', 'price'] }, db)
    orders = createRepository<{ id: string; customer_name: string; total: number; store_id: string }>('orders', { columns: ['customer_name', 'total'] }, db)
  })

  it('loja B não vê produtos da loja A', () => {
    products.insert('storeA', { id: 'iso-a-1', name: 'SÓ DA A', price: 10 })
    products.insert('storeB', { id: 'iso-b-1', name: 'SÓ DA B', price: 20 })

    expect(products.findById('storeA', 'iso-a-1')?.name).toBe('SÓ DA A')
    expect(products.findById('storeB', 'iso-a-1')).toBeNull()

    const a = products.findAll('storeA')
    const b = products.findAll('storeB')
    expect(a.map(r => r.id)).toContain('iso-a-1')
    expect(a.map(r => r.id)).not.toContain('iso-b-1')
    expect(b.map(r => r.id)).toContain('iso-b-1')
    expect(b.map(r => r.id)).not.toContain('iso-a-1')
  })

  it('UPDATE da loja B não afeta registro da loja A', () => {
    products.insert('storeA', { id: 'iso-up-a', name: 'ITEM A', price: 1 })
    products.insert('storeB', { id: 'iso-up-b', name: 'ITEM B', price: 2 })

    products.update('storeB', 'iso-up-b', { price: 999 })
    expect(products.findById('storeA', 'iso-up-a')?.price).toBe(1)
    expect(products.findById('storeB', 'iso-up-b')?.price).toBe(999)
  })

  it('UPDATE com id de outra loja não altera nada', () => {
    products.update('storeB', 'iso-up-a', { name: 'HACK' })
    expect(products.findById('storeA', 'iso-up-a')?.name).toBe('ITEM A')
  })

  it('DELETE da loja B não remove registro da loja A', () => {
    products.insert('storeA', { id: 'iso-del-a', name: 'MANTER', price: 3 })
    products.insert('storeB', { id: 'iso-del-b', name: 'REMOVER', price: 3 })

    products.remove('storeB', 'iso-del-a')
    expect(products.findById('storeA', 'iso-del-a')).not.toBeNull()

    products.remove('storeB', 'iso-del-b')
    expect(products.findById('storeB', 'iso-del-b')).toBeNull()
  })

  it('count respeita o escopo por loja', () => {
    const countA = products.count('storeA', 'id LIKE ?', ['iso-%'])
    const countB = products.count('storeB', 'id LIKE ?', ['iso-%'])
    expect(countA).toBeGreaterThan(0)
    expect(countB).toBeGreaterThan(0)
    expect(products.count('storeA', 'name = ?', ['SÓ DA A'])).toBe(1)
    expect(products.count('storeB', 'name = ?', ['SÓ DA A'])).toBe(0)
  })

  it('pedidos também são isolados', () => {
    orders.insert('storeA', { id: 'ord-a', customer_name: 'Ana', total: 50 })
    orders.insert('storeB', { id: 'ord-b', customer_name: 'Bia', total: 70 })
    expect(orders.findAll('storeA').length).toBe(1)
    expect(orders.findById('storeB', 'ord-a')).toBeNull()
  })

  it('INSERT sem storeId cai no default main e não cruza com lojas explícitas', () => {
    products.insert(null, { id: 'legacy', name: 'LEGADO', price: 5 })
    expect(products.findById('main', 'legacy')?.name).toBe('LEGADO')
    expect(products.findById('storeA', 'legacy')).toBeNull()
    expect(products.findById('storeB', 'legacy')).toBeNull()
  })
})
