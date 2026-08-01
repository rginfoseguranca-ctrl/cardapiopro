import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { initDatabase, dbGet, dbRun } from '../database'
import { runWithStoreScope } from '../store-scope'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const STORE_A_SLUG = 'resolve-a-' + Date.now().toString(36)
const STORE_B_SLUG = 'resolve-b-' + Date.now().toString(36)
const STORE_A_ID = 'store-a-' + Date.now().toString(36)
const STORE_B_ID = 'store-b-' + Date.now().toString(36)

let app: express.Express

beforeAll(async () => {
  await initDatabase()

  dbRun('DELETE FROM products WHERE id IN (?, ?)', ['resolve-prod-a', 'resolve-prod-b'])
  dbRun('DELETE FROM stores WHERE id IN (?, ?)', [STORE_A_ID, STORE_B_ID])

  const { resolveStoreScope } = await import('../middleware')

  dbRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [STORE_A_ID, 'Loja A', STORE_A_SLUG])
  dbRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [STORE_B_ID, 'Loja B', STORE_B_SLUG])
  runWithStoreScope(STORE_A_ID, () => {
    dbRun('INSERT INTO products (id, name, description, price, category_id) VALUES (?, ?, ?, ?, ?)',
      ['resolve-prod-a', 'Produto A', '', 5, 'cat1'])
  })
  runWithStoreScope(STORE_B_ID, () => {
    dbRun('INSERT INTO products (id, name, description, price, category_id) VALUES (?, ?, ?, ?, ?)',
      ['resolve-prod-b', 'Produto B', '', 7, 'cat1'])
  })

  app = express()
  app.use(resolveStoreScope)
  app.get('/test', (req: any, res: any) => {
    const seesB = dbGet('SELECT name FROM products WHERE id = ?', ['resolve-prod-b'])
    res.json({ storeId: req.storeId || null, seesB: seesB?.name || null })
  })
})

afterAll(() => {
  dbRun('DELETE FROM products WHERE id = ?', ['resolve-prod-a'])
  dbRun('DELETE FROM products WHERE id = ?', ['resolve-prod-b'])
  dbRun('DELETE FROM stores WHERE id = ?', [STORE_A_ID])
  dbRun('DELETE FROM stores WHERE id = ?', [STORE_B_ID])
})

describe('resolveStoreScope', () => {
  it('sem contexto fica global (storeId null)', async () => {
    const res = await request(app).get('/test')
    expect(res.body.storeId).toBeNull()
    expect(res.body.seesB).toBe('Produto B')
  })

  it('x-store-slug resolve a loja e escopa as leituras', async () => {
    const res = await request(app).get('/test').set('x-store-slug', STORE_A_SLUG)
    expect(res.body.storeId).toBe(STORE_A_ID)
    expect(res.body.seesB).toBeNull()
  })

  it('x-store-slug de outra loja escopa corretamente', async () => {
    const res = await request(app).get('/test').set('x-store-slug', STORE_B_SLUG)
    expect(res.body.storeId).toBe(STORE_B_ID)
    expect(res.body.seesB).toBe('Produto B')
  })

  it('store_slug como query param também resolve', async () => {
    const res = await request(app).get('/test').query({ store_slug: STORE_A_SLUG })
    expect(res.body.storeId).toBe(STORE_A_ID)
    expect(res.body.seesB).toBeNull()
  })

  it('slug desconhecido fica global', async () => {
    const res = await request(app).get('/test').set('x-store-slug', 'nao-existe')
    expect(res.body.storeId).toBeNull()
    expect(res.body.seesB).toBe('Produto B')
  })

  it('JWT de lojista tem precedência sobre o slug header', async () => {
    const token = jwt.sign(
      { id: 'u1', email: 'a@test.com', role: 'owner', storeId: STORE_A_ID },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )
    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .set('x-store-slug', STORE_B_SLUG)
    expect(res.body.storeId).toBe(STORE_A_ID)
    expect(res.body.seesB).toBeNull()
  })

  it('JWT de super_admin opera globalmente', async () => {
    const token = jwt.sign(
      { id: 'admin', email: 'admin@test.com', role: 'super_admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )
    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .set('x-store-slug', STORE_B_SLUG)
    expect(res.body.storeId).toBe('main')
    expect(res.body.seesB).toBe('Produto B')
  })

  it('token inválido em rota pública cai para o contexto de slug', async () => {
    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer token-invalido')
      .set('x-store-slug', STORE_B_SLUG)
    expect(res.body.storeId).toBe(STORE_B_ID)
    expect(res.body.seesB).toBe('Produto B')
  })

  it('storeId como query param (legacy) ainda funciona', async () => {
    const res = await request(app).get('/test').query({ storeId: STORE_A_ID })
    expect(res.body.storeId).toBe(STORE_A_ID)
    expect(res.body.seesB).toBeNull()
  })
})
