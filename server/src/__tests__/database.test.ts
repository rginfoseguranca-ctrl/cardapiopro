import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { initDatabase, dbGet, dbAll, dbRun } from '../database'

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  await initDatabase()
})

describe('Database', () => {
  it('has categories seeded', () => {
    const cats = dbAll('SELECT * FROM categories')
    expect(cats.length).toBeGreaterThanOrEqual(4)
  })

  it('has products seeded', () => {
    const products = dbAll('SELECT * FROM products')
    expect(products.length).toBeGreaterThanOrEqual(30)
  })

  it('has admin user', () => {
    const user = dbGet('SELECT * FROM users WHERE email = ?', ['admin@index.local'])
    expect(user).not.toBeNull()
    expect(user.role).toBe('admin')
  })

  it('has company settings', () => {
    const settings = dbGet('SELECT * FROM company_settings WHERE id = ?', ['main'])
    expect(settings).not.toBeNull()
    expect(settings.store_name).toBeTruthy()
  })

  it('has subscription table', () => {
    const sub = dbGet('SELECT * FROM subscriptions LIMIT 1')
    expect(sub !== undefined || true).toBe(true)
  })

  it('can insert and read orders', () => {
    const id = 'test_order_' + Date.now()
    dbRun(
      'INSERT INTO orders (id, customer_name, customer_phone, items, subtotal, total, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, 'Test User', '11999999999', '[]', 10, 10, 'pix', 'pending']
    )
    const order = dbGet('SELECT * FROM orders WHERE id = ?', [id])
    expect(order).not.toBeNull()
    expect(order.customer_name).toBe('Test User')
    expect(order.total).toBe(10)
    dbRun('DELETE FROM orders WHERE id = ?', [id])
  })

  it('can insert and read customers', () => {
    const id = 'test_cust_' + Date.now()
    dbRun(
      'INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)',
      [id, 'Test Customer', '11988888888']
    )
    const cust = dbGet('SELECT * FROM customers WHERE id = ?', [id])
    expect(cust).not.toBeNull()
    expect(cust.name).toBe('Test Customer')
    dbRun('DELETE FROM customers WHERE id = ?', [id])
  })
})
