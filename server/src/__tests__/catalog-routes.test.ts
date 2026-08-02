import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { initDatabase, rawRun } from '../database'
import { resolveStoreScope, errorHandler } from '../middleware'
import productsRouter from '../routes/products'
import complementsRouter from '../routes/complements'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const STORE_A_ID = 'cat-a-' + Date.now().toString(36)
const STORE_B_ID = 'cat-b-' + Date.now().toString(36)
const SLUG_A = 'cat-slug-a-' + Date.now().toString(36)
const SLUG_B = 'cat-slug-b-' + Date.now().toString(36)
const PREFIX = 'catalog-test-'

let app: express.Express
let catA: string
let catB: string

function token(storeId: string): string {
  return jwt.sign({ id: 'u-' + storeId, email: 'u@test.com', role: 'owner', storeId }, process.env.JWT_SECRET!, { expiresIn: '1h' })
}

beforeAll(async () => {
  await initDatabase()

  rawRun('DELETE FROM products WHERE id LIKE ?', [`${PREFIX}%`])
  rawRun('DELETE FROM categories WHERE id LIKE ?', [`${PREFIX}%`])
  rawRun('DELETE FROM complement_groups WHERE id LIKE ?', [`${PREFIX}%`])
  rawRun('DELETE FROM complements WHERE id LIKE ?', [`${PREFIX}%`])
  rawRun('DELETE FROM stores WHERE id IN (?, ?)', [STORE_A_ID, STORE_B_ID])

  rawRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [STORE_A_ID, 'Loja A', SLUG_A])
  rawRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [STORE_B_ID, 'Loja B', SLUG_B])

  app = express()
  app.use(express.json())
  app.use(resolveStoreScope)
  app.use('/api/products', productsRouter)
  app.use('/api/complements', complementsRouter)
  app.use(errorHandler)

  const resA = await request(app)
    .post('/api/products/categories')
    .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    .send({ name: 'Cat A' })
  catA = resA.body.id
  const resB = await request(app)
    .post('/api/products/categories')
    .set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    .send({ name: 'Cat B' })
  catB = resB.body.id
})

afterAll(() => {
  rawRun('DELETE FROM products WHERE id LIKE ?', [`${PREFIX}%`])
  rawRun('DELETE FROM categories WHERE id LIKE ?', [`${PREFIX}%`])
  rawRun('DELETE FROM complement_groups WHERE id LIKE ?', [`${PREFIX}%`])
  rawRun('DELETE FROM complements WHERE id LIKE ?', [`${PREFIX}%`])
  rawRun('DELETE FROM stores WHERE id IN (?, ?)', [STORE_A_ID, STORE_B_ID])
})

describe('rotas de catálogo (products) via service+repository', () => {
  it('POST cria produto apenas na loja do JWT', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
      .send({ name: 'SÓ LOJA A', price: 25, barcode: '111', categoryId: catA })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('SÓ LOJA A')

    const menuA = await request(app).get('/api/products').set('x-store-slug', SLUG_A)
    expect(menuA.body.some((p: any) => p.name === 'SÓ LOJA A')).toBe(true)

    const menuB = await request(app).get('/api/products').set('x-store-slug', SLUG_B)
    expect(menuB.body.some((p: any) => p.name === 'SÓ LOJA A')).toBe(false)
  })

  it('menu público isola produtos entre lojas', async () => {
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token(STORE_B_ID)}`)
      .send({ name: 'SÓ LOJA B', price: 30, categoryId: catB })
    const a = await request(app).get('/api/products').set('x-store-slug', SLUG_A)
    const b = await request(app).get('/api/products').set('x-store-slug', SLUG_B)
    expect(a.body.some((p: any) => p.name === 'SÓ LOJA B')).toBe(false)
    expect(b.body.some((p: any) => p.name === 'SÓ LOJA B')).toBe(true)
  })

  it('PUT não altera produto de outra loja', async () => {
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
      .send({ name: 'PARA EDITAR', price: 40, categoryId: catA })
    const id = created.body.id
    expect(id).toBeTruthy()

    const hack = await request(app)
      .put(`/api/products/${id}`)
      .set('Authorization', `Bearer ${token(STORE_B_ID)}`)
      .send({ name: 'HACKEADO' })
    expect(hack.status).toBe(404)

    const res = await request(app).get('/api/products/all').set('x-store-slug', SLUG_A)
    expect(res.body.find((p: any) => p.id === id)?.name).toBe('PARA EDITAR')
  })

  it('DELETE não remove produto de outra loja', async () => {
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
      .send({ name: 'PARA REMOVER', price: 5, categoryId: catA })
    const id = created.body.id
    await request(app)
      .delete(`/api/products/${id}`)
      .set('Authorization', `Bearer ${token(STORE_B_ID)}`)
      .expect(200)
    const res = await request(app).get('/api/products/all').set('x-store-slug', SLUG_A)
    expect(res.body.find((p: any) => p.id === id)).toBeTruthy()
  })

  it('categorias são isoladas por loja', async () => {
    await request(app)
      .post('/api/products/categories')
      .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
      .send({ name: 'Cat Iso A' })
    await request(app)
      .post('/api/products/categories')
      .set('Authorization', `Bearer ${token(STORE_B_ID)}`)
      .send({ name: 'Cat Iso B' })

    const a = await request(app).get('/api/products/categories').set('x-store-slug', SLUG_A)
    const b = await request(app).get('/api/products/categories').set('x-store-slug', SLUG_B)
    expect(a.body.some((c: any) => c.name === 'Cat Iso A')).toBe(true)
    expect(a.body.some((c: any) => c.name === 'Cat Iso B')).toBe(false)
    expect(b.body.some((c: any) => c.name === 'Cat Iso A')).toBe(false)
  })
})

describe('rotas de complementos via service+repository', () => {
  let productA: string

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
      .send({ name: 'PRODUTO COM COMPLEMENTO', price: 15, categoryId: catA })
    productA = res.body.id
  })

  it('grupo criado na loja A não aparece na loja B', async () => {
    const res = await request(app)
      .post('/api/complements/groups')
      .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
      .send({ name: 'Adicionais A', productId: productA })
    expect(res.status).toBe(201)
    const groupId = res.body.id

    await request(app)
      .post('/api/complements')
      .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
      .send({ groupId, name: 'Bacon', price: 3 })

    const groupsA = await request(app).get(`/api/complements/groups/${productA}`).set('x-store-slug', SLUG_A)
    expect(groupsA.body.length).toBe(1)
    expect(groupsA.body[0].items.some((c: any) => c.name === 'Bacon')).toBe(true)

    const groupsB = await request(app).get(`/api/complements/groups/${productA}`).set('x-store-slug', SLUG_B)
    expect(groupsB.body.length).toBe(0)
  })

  it('cálculo de preço é escopado', async () => {
    const res = await request(app)
      .post('/api/complements/groups')
      .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
      .send({ name: 'Tamanhos A', productId: productA, type: 'radio', min: 1, max: 1 })
    const groupId = res.body.id
    const comp = await request(app)
      .post('/api/complements')
      .set('Authorization', `Bearer ${token(STORE_A_ID)}`)
      .send({ groupId, name: 'Grande', price: 5 })
    const compId = comp.body.id

    const priceA = await request(app)
      .post('/api/complements/price')
      .set('x-store-slug', SLUG_A)
      .send({ complementIds: [compId], groupId })
    expect(priceA.body).toMatchObject({ price: 5, extraCount: 0 })

    const priceB = await request(app)
      .post('/api/complements/price')
      .set('x-store-slug', SLUG_B)
      .send({ complementIds: [compId], groupId })
    expect(priceB.body).toMatchObject({ price: 0, extraCount: 0 })
  })
})
