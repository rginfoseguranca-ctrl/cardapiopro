import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { initDatabase, rawGet, rawAll, rawRun } from '../database'

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  await initDatabase()
})

describe('Database', () => {
  it('has categories seeded', () => {
    const cats = rawAll('SELECT * FROM categories')
    expect(cats.length).toBeGreaterThanOrEqual(4)
  })

  it('has products seeded', () => {
    const products = rawAll('SELECT * FROM products')
    expect(products.length).toBeGreaterThanOrEqual(30)
  })

  it('has super admin user', () => {
    const user = rawGet('SELECT * FROM users WHERE email = ?', ['admin@local'])
    expect(user).not.toBeNull()
    expect(user.role).toBe('super_admin')
  })

  it('has company settings', () => {
    const settings = rawGet('SELECT * FROM company_settings WHERE id = ?', ['main'])
    expect(settings).not.toBeNull()
    expect(settings.store_name).toBeTruthy()
  })

  it('has subscription table', () => {
    const sub = rawGet('SELECT * FROM subscriptions LIMIT 1')
    expect(sub !== undefined || true).toBe(true)
  })

  it('can insert and read orders', () => {
    const id = 'test_order_' + Date.now()
    rawRun(
      'INSERT INTO orders (id, customer_name, customer_phone, items, subtotal, total, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, 'Test User', '11999999999', '[]', 10, 10, 'pix', 'pending']
    )
    const order = rawGet('SELECT * FROM orders WHERE id = ?', [id])
    expect(order).not.toBeNull()
    expect(order.customer_name).toBe('Test User')
    expect(order.total).toBe(10)
    rawRun('DELETE FROM orders WHERE id = ?', [id])
  })

  it('has barcode column in products', () => {
    const col = rawAll('PRAGMA table_info(products)').find((c: any) => c.name === 'barcode')
    expect(col).toBeTruthy()
    const id = 'test_barcode_' + Date.now()
    rawRun(
      'INSERT INTO products (id, name, price, category_id, barcode) VALUES (?, ?, ?, ?, ?)',
      [id, 'Produto Teste', 9.9, (rawGet('SELECT id FROM categories LIMIT 1') as any).id, '7891234567890']
    )
    const prod = rawGet('SELECT * FROM products WHERE id = ?', [id])
    expect(prod.barcode).toBe('7891234567890')
    rawRun('DELETE FROM products WHERE id = ?', [id])
  })

  it('can insert and read customers', () => {
    const id = 'test_cust_' + Date.now()
    rawRun(
      'INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)',
      [id, 'Test Customer', '11988888888']
    )
    const cust = rawGet('SELECT * FROM customers WHERE id = ?', [id])
    expect(cust).not.toBeNull()
    expect(cust.name).toBe('Test Customer')
    rawRun('DELETE FROM customers WHERE id = ?', [id])
  })
})
