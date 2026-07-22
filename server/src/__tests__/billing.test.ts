import { describe, it, expect, beforeAll } from 'vitest'
import { initDatabase, dbRun, dbGet } from '../database'
import { v4 as uuid } from 'uuid'

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  await initDatabase()
})

describe('Billing & Subscriptions', () => {
  const testStoreId = 'test_store_billing_' + Date.now()

  it('creates subscription on first access', () => {
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    dbRun(
      'INSERT INTO subscriptions (id, store_id, plan, status, trial_ends_at) VALUES (?, ?, ?, ?, ?)',
      ['sub_' + uuid(), testStoreId, 'premium', 'trialing', trialEndsAt]
    )
    const sub = dbGet('SELECT * FROM subscriptions WHERE store_id = ?', [testStoreId])
    expect(sub).not.toBeNull()
    expect(sub.status).toBe('trialing')
    expect(sub.plan).toBe('premium')
  })

  it('updates subscription status', () => {
    dbRun(
      "UPDATE subscriptions SET status = 'active', plan = 'profissional' WHERE store_id = ?",
      [testStoreId]
    )
    const sub = dbGet('SELECT * FROM subscriptions WHERE store_id = ?', [testStoreId])
    expect(sub.status).toBe('active')
    expect(sub.plan).toBe('profissional')
  })

  it('can cancel subscription', () => {
    dbRun(
      "UPDATE subscriptions SET status = 'canceled' WHERE store_id = ?",
      [testStoreId]
    )
    const sub = dbGet('SELECT * FROM subscriptions WHERE store_id = ?', [testStoreId])
    expect(sub.status).toBe('canceled')
  })

  it('cleans up test data', () => {
    dbRun('DELETE FROM subscriptions WHERE store_id = ?', [testStoreId])
  })
})
