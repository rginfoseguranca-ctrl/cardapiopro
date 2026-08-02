import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { initDatabase, rawRun } from '../database'
import { productsRepository } from '../repositories/products'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const STORE_A_SLUG = 'resolve-a-' + Date.now().toString(36)
const STORE_B_SLUG = 'resolve-b-' + Date.now().toString(36)
const STORE_A_ID = 'store-a-' + Date.now().toString(36)
const STORE_B_ID = 'store-b-' + Date.now().toString(36)

let app: express.Express

beforeAll(async () => {
  await initDatabase()

  rawRun('DELETE FROM products WHERE id IN (?, ?)', ['resolve-prod-a', 'resolve-prod-b'])
  rawRun('DELETE FROM stores WHERE id IN (?, ?)', [STORE_A_ID, STORE_B_ID])

  const { resolveStoreScope } = await import('../middleware')

  rawRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [STORE_A_ID, 'Loja A', STORE_A_SLUG])
  rawRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [STORE_B_ID, 'Loja B', STORE_B_SLUG])
  rawRun('INSERT INTO products (id, name, description, price, category_id, store_id) VALUES (?, ?, ?, ?, ?, ?)',
    ['resolve-prod-a', 'Produto A', '', 5, 'cat1', STORE_A_ID])
  rawRun('INSERT INTO products (id, name, description, price, category_id, store_id) VALUES (?, ?, ?, ?, ?, ?)',
    ['resolve-prod-b', 'Produto B', '', 7, 'cat1', STORE_B_ID])

  // Simula o comportamento de uma rota migrada (ex.: dashboard.ts): o middleware
  // resolve req.storeId/req.user e a rota decide o escopo — super_admin opera
  // global (null), lojistas ficam escopados ao storeId.
  app = express()
  app.use(resolveStoreScope)
  app.get('/test', (req: any, res: any) => {
    const sid = req.user?.role === 'super_admin' ? null : (req.storeId || 'main')
    const seesB = productsRepository.findAll(sid, 'id = ?', ['resolve-prod-b'])[0]
    res.json({ storeId: req.storeId || null, seesB: seesB?.name || null })
  })
})

afterAll(() => {
  rawRun('DELETE FROM products WHERE id = ?', ['resolve-prod-a'])
  rawRun('DELETE FROM products WHERE id = ?', ['resolve-prod-b'])
  rawRun('DELETE FROM stores WHERE id = ?', [STORE_A_ID])
  rawRun('DELETE FROM stores WHERE id = ?', [STORE_B_ID])
})

describe('resolveStoreScope', () => {
  it('sem contexto deixa storeId null (rota migrada cai na loja main)', async () => {
    const res = await request(app).get('/test')
    expect(res.body.storeId).toBeNull()
    expect(res.body.seesB).toBeNull()
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

  it('slug desconhecido deixa storeId null (rota migrada cai na loja main)', async () => {
    const res = await request(app).get('/test').set('x-store-slug', 'nao-existe')
    expect(res.body.storeId).toBeNull()
    expect(res.body.seesB).toBeNull()
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
