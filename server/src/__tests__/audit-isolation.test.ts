import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import { initDatabase, rawRun } from '../database'
import { setStoreSetting, getStoreSetting } from '../repositories/fixtures'
import { tablesRepository } from '../repositories/tables'
import { couponsRepository } from '../repositories/coupons'
import { productsRepository } from '../repositories/products'
import { reviewsRepository } from '../repositories/reviews'
import { createProduct, createCategory } from '../services/CatalogService'
import { createGroup, createComplement } from '../services/ComplementService'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const AUDIT_A = 'audit-a-' + Date.now().toString(36)
const AUDIT_B = 'audit-b-' + Date.now().toString(36)
const SLUG_A = 'audit-slug-a-' + Date.now().toString(36)
const SLUG_B = 'audit-slug-b-' + Date.now().toString(36)

let app: express.Express

beforeAll(async () => {
  await initDatabase()
  for (const s of [AUDIT_A, AUDIT_B]) {
    rawRun(`DELETE FROM store_settings WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM tables WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM coupons WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM reviews WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM complement_groups WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM complements WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM products WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM categories WHERE store_id = ?`, [s])
  }
  rawRun('DELETE FROM stores WHERE id IN (?, ?)', [AUDIT_A, AUDIT_B])
  rawRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [AUDIT_A, 'Loja A', SLUG_A])
  rawRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [AUDIT_B, 'Loja B', SLUG_B])

  const { resolveStoreScope } = await import('../middleware')
  const reviewsRouter = (await import('../routes/reviews')).default
  app = express()
  app.use(express.json())
  app.use(resolveStoreScope)
  app.use('/reviews', reviewsRouter)
})

afterAll(() => {
  for (const s of [AUDIT_A, AUDIT_B]) {
    rawRun(`DELETE FROM store_settings WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM tables WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM coupons WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM reviews WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM complement_groups WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM complements WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM products WHERE store_id = ?`, [s])
    rawRun(`DELETE FROM categories WHERE store_id = ?`, [s])
  }
  rawRun('DELETE FROM stores WHERE id IN (?, ?)', [AUDIT_A, AUDIT_B])
})

describe('Auditoria de isolamento', () => {
  it('R1: store_settings coexiste por loja (PK composta)', () => {
    setStoreSetting(AUDIT_A, 'audit_key', 'valor-A')
    setStoreSetting(AUDIT_B, 'audit_key', 'valor-B')
    expect(getStoreSetting(AUDIT_A, 'audit_key')).toBe('valor-A')
    expect(getStoreSetting(AUDIT_B, 'audit_key')).toBe('valor-B')
  })

  it('R5: mesma mesa #1 e mesmo cupom em lojas diferentes', () => {
    tablesRepository.insert(AUDIT_A, { id: 'audit-tab-a', number: 1 })
    tablesRepository.insert(AUDIT_B, { id: 'audit-tab-b', number: 1 })
    expect(tablesRepository.findById(AUDIT_A, 'audit-tab-a')).not.toBeNull()
    expect(tablesRepository.findById(AUDIT_B, 'audit-tab-b')).not.toBeNull()

    couponsRepository.insert(AUDIT_A, { id: 'audit-coup-a', code: 'AUDIT10', title: 'A', discount_type: 'percent', discount_value: 10 })
    couponsRepository.insert(AUDIT_B, { id: 'audit-coup-b', code: 'AUDIT10', title: 'B', discount_type: 'percent', discount_value: 10 })
    expect(couponsRepository.findById(AUDIT_A, 'audit-coup-a')).not.toBeNull()
    expect(couponsRepository.findById(AUDIT_B, 'audit-coup-b')).not.toBeNull()
  })

  it('R6: produto não aceita categoria de outra loja', () => {
    const catB = createCategory(AUDIT_B, { name: 'Categoria B' })
    expect(() => createProduct(AUDIT_A, { name: 'Produto A', price: 10, categoryId: catB!.id }))
      .toThrow('Categoria não encontrada na loja')
  })

  it('R6: grupo não aceita produto de outra loja', () => {
    const prodB = productsRepository.insert(AUDIT_B, {
      id: 'audit-prod-b', name: 'Produto B', price: 5,
      category_id: createCategory(AUDIT_B, { name: 'Cat B2' })!.id,
    })
    expect(() => createGroup(AUDIT_A, { name: 'Grupo', productId: prodB.id }))
      .toThrow('Produto não encontrado na loja')
  })

  it('R6: complemento não aceita grupo de outra loja', () => {
    const groupB = createGroup(AUDIT_B, {
      name: 'Grupo B', productId: productsRepository.insert(AUDIT_B, {
        id: 'audit-prod-b2', name: 'Produto B2', price: 5,
        category_id: createCategory(AUDIT_B, { name: 'Cat B3' })!.id,
      }).id,
    })
    expect(() => createComplement(AUDIT_A, { groupId: groupB!.id, name: 'Extra' }))
      .toThrow('Grupo de complementos não encontrado na loja')
  })

  it('R6: review de produto de outra loja é rejeitado (rota pública)', async () => {
    const prodB = productsRepository.findById(AUDIT_B, 'audit-prod-b')!
    const res = await request(app)
      .post('/reviews')
      .set('x-store-slug', SLUG_A)
      .send({ productId: prodB.id, customerName: 'Cliente', rating: 5, comment: 'ok' })
    expect(res.status).toBe(400)
  })

  it('R6: review válido na própria loja é aceito', async () => {
    const prodA = productsRepository.insert(AUDIT_A, {
      id: 'audit-prod-a', name: 'Produto A', price: 5,
      category_id: createCategory(AUDIT_A, { name: 'Cat A' })!.id,
    })
    const res = await request(app)
      .post('/reviews')
      .set('x-store-slug', SLUG_A)
      .send({ productId: prodA.id, customerName: 'Cliente', rating: 5, comment: 'bom' })
    expect(res.status).toBe(201)
    expect(reviewsRepository.findOne(AUDIT_A, 'product_id = ?', [prodA.id])).not.toBeNull()
  })
})
