import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { initDatabase, rawRun } from '../database'
import { authMiddleware } from '../middleware'
import { requireFeature } from '../middleware/plan-gate'
import dashboardRouter from '../routes/dashboard'
import customersRouter from '../routes/customers'
import cashRegisterRouter from '../routes/cash-register'
import fiadoRouter from '../routes/fiado'
import financeRouter from '../routes/finance'
import { ordersRepository } from '../repositories/orders'
import { customersRepository } from '../repositories/customers'
import { cashRegisterRepository } from '../repositories/cash-register'
import { fiadoRepository } from '../repositories/fiado'
import { financialAccountsRepository, financialCategoriesRepository, financialTransactionsRepository } from '../repositories/finance'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const STORE_A_ID = 'isroute-a-' + Date.now().toString(36)
const STORE_B_ID = 'isroute-b-' + Date.now().toString(36)
const SLUG_A = 'isroute-slug-a-' + Date.now().toString(36)
const SLUG_B = 'isroute-slug-b-' + Date.now().toString(36)
const PREFIX = 'isroute-'

let app: express.Express

function token(storeId: string): string {
  return jwt.sign({ id: 'u-' + storeId, email: 'u@test.com', role: 'owner', storeId }, process.env.JWT_SECRET!, { expiresIn: '1h' })
}

function clean() {
  for (const s of [STORE_A_ID, STORE_B_ID]) {
    rawRun('DELETE FROM orders WHERE store_id = ?', [s])
    rawRun('DELETE FROM customers WHERE store_id = ?', [s])
    rawRun('DELETE FROM cash_register WHERE store_id = ?', [s])
    rawRun('DELETE FROM fiado WHERE store_id = ?', [s])
    rawRun('DELETE FROM financial_transactions WHERE store_id = ?', [s])
    rawRun('DELETE FROM financial_categories WHERE store_id = ?', [s])
    rawRun('DELETE FROM financial_accounts WHERE store_id = ?', [s])
  }
  rawRun('DELETE FROM stores WHERE id IN (?, ?)', [STORE_A_ID, STORE_B_ID])
}

beforeAll(async () => {
  await initDatabase()
  clean()
  rawRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [STORE_A_ID, 'Loja A', SLUG_A])
  rawRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [STORE_B_ID, 'Loja B', SLUG_B])

  app = express()
  app.use(express.json())
  app.use('/api/dashboard', authMiddleware, dashboardRouter)
  app.use('/api/customers', authMiddleware, customersRouter)
  app.use('/api/cash-register', authMiddleware, cashRegisterRouter)
  app.use('/api/fiado', authMiddleware, requireFeature('fiado'), fiadoRouter)
  app.use('/api/finance', authMiddleware, financeRouter)
})

afterAll(() => clean())

describe('dashboard: agregações de orders são isoladas por loja', () => {
  beforeAll(() => {
    const itemsA = JSON.stringify([
      { productId: 'p-x', productName: 'Produto X', quantity: 2, unitPrice: 50 },
      { productId: 'p-y', productName: 'Produto Y', quantity: 1, unitPrice: 30 },
    ])
    ordersRepository.insert(STORE_A_ID, {
      id: PREFIX + 'ord-a1', customer_name: 'Ana A', customer_phone: '111', items: itemsA,
      subtotal: 130, total: 130, payment_method: 'pix', payment_status: 'paid', status: 'delivered',
    })
    ordersRepository.insert(STORE_A_ID, {
      id: PREFIX + 'ord-a2', customer_name: 'Bruno A', customer_phone: '112', items: '[]',
      subtotal: 50, total: 50, payment_method: 'cash', payment_status: 'pending', status: 'pending',
    })
    ordersRepository.insert(STORE_B_ID, {
      id: PREFIX + 'ord-b1', customer_name: 'Cliente Secreto B', customer_phone: '999', items: JSON.stringify([
        { productId: 'p-s', productName: 'Produto Secreto B', quantity: 5, unitPrice: 200 },
      ]),
      subtotal: 1000, total: 1000, payment_method: 'pix', payment_status: 'paid', status: 'delivered',
    })
  })

  it('summary reflete apenas os pedidos da própria loja', async () => {
    const a = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.status).toBe(200)
    expect(a.body.totalOrders).toBe(2)
    expect(a.body.totalRevenue).toBe(130)

    const b = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.totalOrders).toBe(1)
    expect(b.body.totalRevenue).toBe(1000)
  })

  it('topProducts não vaza produtos de outra loja', async () => {
    const a = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    const namesA = a.body.topProducts.map((p: any) => p.name)
    expect(namesA).toContain('Produto X')
    expect(namesA).toContain('Produto Y')
    expect(namesA).not.toContain('Produto Secreto B')

    const b = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    const namesB = b.body.topProducts.map((p: any) => p.name)
    expect(namesB).toContain('Produto Secreto B')
    expect(namesB).not.toContain('Produto X')
  })

  it('recent-orders só lista pedidos da própria loja', async () => {
    const a = await request(app).get('/api/dashboard/recent-orders').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.body.some((o: any) => o.customer_name === 'Cliente Secreto B')).toBe(false)
    expect(a.body.some((o: any) => o.customer_name === 'Ana A')).toBe(true)

    const b = await request(app).get('/api/dashboard/recent-orders').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.some((o: any) => o.customer_name === 'Ana A')).toBe(false)
  })
})

describe('cash-register: saldos são isolados por loja', () => {
  beforeAll(() => {
    cashRegisterRepository.insert(STORE_A_ID, { id: PREFIX + 'cr-a1', type: 'income', description: 'Venda A', amount: 100 })
    cashRegisterRepository.insert(STORE_A_ID, { id: PREFIX + 'cr-a2', type: 'expense', description: 'Compra A', amount: 30 })
    cashRegisterRepository.insert(STORE_B_ID, { id: PREFIX + 'cr-b1', type: 'income', description: 'Venda B', amount: 1000 })
  })

  it('GET / traz apenas entradas e saldos da própria loja', async () => {
    const a = await request(app).get('/api/cash-register').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.body.balance).toBe(70)
    expect(a.body.totalIn).toBe(100)
    expect(a.body.totalOut).toBe(30)
    expect(a.body.entries.some((e: any) => e.id === PREFIX + 'cr-b1')).toBe(false)
    expect(a.body.entries.some((e: any) => e.id === PREFIX + 'cr-a1')).toBe(true)

    const b = await request(app).get('/api/cash-register').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.balance).toBe(1000)
    expect(b.body.totalIn).toBe(1000)
  })

  it('POST grava na loja do token', async () => {
    const res = await request(app)
      .post('/api/cash-register')
      .set('Authorization', `Bearer ${token(STORE_B_ID)}`)
      .send({ type: 'expense', description: 'Só da B', amount: 7 })
    expect(res.status).toBe(201)

    const a = await request(app).get('/api/cash-register').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.body.entries.some((e: any) => e.description === 'Só da B')).toBe(false)
    const b = await request(app).get('/api/cash-register').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.balance).toBe(993)
  })
})

describe('fiado: pendências são isoladas por loja', () => {
  beforeAll(() => {
    fiadoRepository.insert(STORE_A_ID, {
      id: PREFIX + 'fi-a1', customer_id: PREFIX + 'fi-cus-a', customer_name: 'Devendo A', amount: 50, paid_amount: 0, status: 'pending',
    })
    fiadoRepository.insert(STORE_B_ID, {
      id: PREFIX + 'fi-b1', customer_id: PREFIX + 'fi-cus-b', customer_name: 'Devendo B', amount: 500, paid_amount: 0, status: 'pending',
    })
  })

  it('GET / traz apenas pendências da própria loja', async () => {
    const a = await request(app).get('/api/fiado').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.status).toBe(200)
    expect(a.body.totalPending).toBe(50)
    expect(a.body.debts.some((d: any) => d.id === PREFIX + 'fi-b1')).toBe(false)

    const b = await request(app).get('/api/fiado').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.totalPending).toBe(500)
  })
})

describe('finance: contas, transações e resumo são isolados por loja', () => {
  let accountA: string
  let accountB: string
  let catA: string

  beforeAll(() => {
    accountA = financialAccountsRepository.insert(STORE_A_ID, { id: PREFIX + 'acc-a', name: 'Conta A', type: 'checking' }).id
    accountB = financialAccountsRepository.insert(STORE_B_ID, { id: PREFIX + 'acc-b', name: 'Conta B', type: 'checking' }).id
    catA = financialCategoriesRepository.insert(STORE_A_ID, { id: PREFIX + 'cat-a', name: 'Cat A', type: 'income' }).id
    financialTransactionsRepository.insert(STORE_A_ID, {
      id: PREFIX + 'tx-a1', account_id: accountA, category_id: catA, type: 'income',
      description: 'Receita A', amount: 200, date: new Date().toISOString().slice(0, 10), status: 'received',
    })
    financialTransactionsRepository.insert(STORE_B_ID, {
      id: PREFIX + 'tx-b1', account_id: accountB, type: 'income',
      description: 'Receita B', amount: 9000, date: new Date().toISOString().slice(0, 10), status: 'received',
    })
  })

  it('accounts list só mostra as da própria loja', async () => {
    const a = await request(app).get('/api/finance/accounts').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.body.some((x: any) => x.name === 'Conta A')).toBe(true)
    expect(a.body.some((x: any) => x.name === 'Conta B')).toBe(false)

    const b = await request(app).get('/api/finance/accounts').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.some((x: any) => x.name === 'Conta B')).toBe(true)
    expect(b.body.some((x: any) => x.name === 'Conta A')).toBe(false)
  })

  it('transactions (com JOIN) só lista as da própria loja', async () => {
    const a = await request(app).get('/api/finance/transactions').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.body.some((t: any) => t.description === 'Receita A')).toBe(true)
    expect(a.body.some((t: any) => t.description === 'Receita B')).toBe(false)

    const b = await request(app).get('/api/finance/transactions').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.some((t: any) => t.description === 'Receita B')).toBe(true)
    expect(b.body.some((t: any) => t.description === 'Receita A')).toBe(false)
  })

  it('summary soma apenas as transações da própria loja', async () => {
    const a = await request(app).get('/api/finance/summary').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.body.totalIncome).toBe(200)
    expect(a.body.totalExpense).toBe(0)

    const b = await request(app).get('/api/finance/summary').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.totalIncome).toBe(9000)
  })
})

describe('customers: listagem e segmentação são isoladas por loja', () => {
  beforeAll(() => {
    customersRepository.insert(STORE_A_ID, {
      id: PREFIX + 'cus-a1', name: 'Cliente A', phone: '111', total_orders: 5, total_spent: 500, tags: '[]',
    })
    customersRepository.insert(STORE_A_ID, {
      id: PREFIX + 'cus-a2', name: 'Cliente A2', phone: '112', total_orders: 1, total_spent: 10, tags: '[]',
    })
    customersRepository.insert(STORE_B_ID, {
      id: PREFIX + 'cus-b1', name: 'Cliente B', phone: '999', total_orders: 9, total_spent: 999, tags: '[]',
    })
  })

  it('GET / só lista clientes da própria loja', async () => {
    const a = await request(app).get('/api/customers').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.body.some((c: any) => c.name === 'Cliente A')).toBe(true)
    expect(a.body.some((c: any) => c.name === 'Cliente B')).toBe(false)

    const b = await request(app).get('/api/customers').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.some((c: any) => c.name === 'Cliente B')).toBe(true)
    expect(b.body.some((c: any) => c.name === 'Cliente A')).toBe(false)
  })

  it('stats/segmentation conta apenas clientes da própria loja', async () => {
    const a = await request(app).get('/api/customers/stats/segmentation').set('Authorization', `Bearer ${token(STORE_A_ID)}`)
    expect(a.status).toBe(200)
    expect(a.body.total).toBe(2)
    expect(a.body.highValue).toBe(1)

    const b = await request(app).get('/api/customers/stats/segmentation').set('Authorization', `Bearer ${token(STORE_B_ID)}`)
    expect(b.body.total).toBe(1)
    expect(b.body.highValue).toBe(1)
  })
})
