import { createGlobalRepository, GlobalRepository } from './base'
import { db } from './db'
import { v4 as uuid } from 'uuid'
import { User, Subscription } from './types'

const g: GlobalRepository = createGlobalRepository(db)

export function findUserByEmail(email: string): User | null {
  if (!email) return null
  return g.get('SELECT * FROM users WHERE email = ?', [email]) as User | null
}

export function findUserByEmailInStore(email: string, storeId: string): User | null {
  if (!email) return null
  return g.get('SELECT * FROM users WHERE email = ? AND store_id = ?', [email, storeId]) as User | null
}

export function findUserById(id: string): User | null {
  if (!id) return null
  return g.get('SELECT * FROM users WHERE id = ?', [id]) as User | null
}

export function insertUser(data: Partial<User> & { name: string; email: string; password: string }): User {
  const record: User = {
    id: data.id || uuid(),
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || 'admin',
    must_change_password: data.must_change_password ?? 0,
    created_at: data.created_at || new Date().toISOString(),
    store_id: data.store_id || 'main',
  }
  g.run(
    'INSERT INTO users (id, name, email, password, role, must_change_password, created_at, store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [record.id, record.name, record.email, record.password, record.role, record.must_change_password, record.created_at, record.store_id]
  )
  return record
}

export function updateUser(id: string, patch: Partial<User>): void {
  const allowed = ['name', 'email', 'password', 'role', 'must_change_password']
  const keys = allowed.filter(k => (patch as any)[k] !== undefined)
  if (!keys.length) return
  g.run(
    `UPDATE users SET ${keys.map(k => `"${k}" = ?`).join(', ')} WHERE id = ?`,
    [...keys.map(k => (patch as any)[k]), id]
  )
}

export function listUsers(storeId: string): User[] {
  return g.all('SELECT id, name, email, role, must_change_password, created_at FROM users WHERE store_id = ? ORDER BY name ASC', [storeId]) as User[]
}

export function countUsersInStore(storeId: string): number {
  const row = g.get('SELECT COUNT(*) AS c FROM users WHERE store_id = ?', [storeId])
  return Number(row?.c ?? 0)
}

export function createSubscription(
  storeId: string,
  plan: string,
  status: string,
  trialEndsAt: string | null = null
): Subscription {
  const record: Subscription = {
    id: 'sub_' + uuid(),
    store_id: storeId,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    plan,
    status,
    trial_ends_at: trialEndsAt,
    current_period_end: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  g.run(
    'INSERT INTO subscriptions (id, store_id, plan, status, trial_ends_at) VALUES (?, ?, ?, ?, ?)',
    [record.id, record.store_id, record.plan, record.status, record.trial_ends_at]
  )
  return record
}

export function findSubscriptionByStore(storeId: string): Subscription | null {
  if (!storeId) return null
  return g.get('SELECT * FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1', [storeId]) as Subscription | null
}

export function findAllSubscriptions(): Subscription[] {
  return g.all('SELECT * FROM subscriptions ORDER BY created_at DESC') as Subscription[]
}

export function updateSubscriptionByStore(storeId: string, patch: Partial<Subscription>): void {
  if (!storeId) return
  const allowed = ['plan', 'status', 'stripe_customer_id', 'stripe_subscription_id', 'trial_ends_at', 'current_period_end']
  const keys = allowed.filter(k => (patch as any)[k] !== undefined)
  if (!keys.length) return
  g.run(
    `UPDATE subscriptions SET ${keys.map(k => `"${k}" = ?`).join(', ')}, updated_at = datetime('now') WHERE store_id = ?`,
    [...keys.map(k => (patch as any)[k]), storeId]
  )
}

export function isTokenBlacklisted(jti: string): boolean {
  if (!jti) return false
  const row = g.get('SELECT 1 AS x FROM token_blacklist WHERE jti = ? AND expires_at > datetime("now")', [jti])
  return !!row
}

export function blacklistToken(jti: string, expiresAt: string): void {
  g.run('INSERT OR REPLACE INTO token_blacklist (jti, expires_at) VALUES (?, ?)', [jti, expiresAt])
}

export function findPasswordReset(token: string): any {
  if (!token) return null
  return g.get('SELECT * FROM password_resets WHERE token = ?', [token])
}

export function findUnusedPasswordReset(token: string): any {
  if (!token) return null
  return g.get('SELECT * FROM password_resets WHERE token = ? AND used = 0', [token])
}

export function createPasswordReset(userId: string, token: string, expiresAt: string): void {
  g.run(
    'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [uuid(), userId, token, expiresAt]
  )
}

export function markPasswordResetUsed(id: string): void {
  g.run('UPDATE password_resets SET used = 1 WHERE id = ?', [id])
}
