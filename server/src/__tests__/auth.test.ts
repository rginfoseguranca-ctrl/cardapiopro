import { describe, it, expect, beforeAll } from 'vitest'
import { initDatabase, dbGet, dbRun } from '../database'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'

const JWT_SECRET = 'test-secret-for-auth'

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET
  await initDatabase()
})

describe('Auth', () => {
  const testEmail = `test_auth_${Date.now()}@example.com`
  const testPassword = 'TestPass123!'
  let userId: string

  it('creates user with hashed password', async () => {
    userId = 'user_' + uuid()
    const hash = await bcrypt.hash(testPassword, 10)
    dbRun(
      'INSERT INTO users (id, name, email, password, role, store_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'Test User', testEmail, hash, 'admin', 'main']
    )
    const user = dbGet('SELECT * FROM users WHERE id = ?', [userId])
    expect(user).not.toBeNull()
    expect(user.email).toBe(testEmail)
  })

  it('verifies password correctly', async () => {
    const user = dbGet('SELECT * FROM users WHERE id = ?', [userId])
    const valid = await bcrypt.compare(testPassword, user.password)
    expect(valid).toBe(true)

    const invalid = await bcrypt.compare('wrongpassword', user.password)
    expect(invalid).toBe(false)
  })

  it('generates and verifies JWT', () => {
    const token = jwt.sign(
      { id: userId, email: testEmail, role: 'admin', storeId: 'main' },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    expect(token).toBeTruthy()

    const decoded = jwt.verify(token, JWT_SECRET) as any
    expect(decoded.id).toBe(userId)
    expect(decoded.email).toBe(testEmail)
    expect(decoded.role).toBe('admin')
  })

  it('rejects expired JWT', () => {
    const token = jwt.sign(
      { id: userId, email: testEmail },
      JWT_SECRET,
      { expiresIn: '-1s' }
    )
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow()
  })

  it('cleans up test data', () => {
    dbRun('DELETE FROM users WHERE id = ?', [userId])
  })
})
