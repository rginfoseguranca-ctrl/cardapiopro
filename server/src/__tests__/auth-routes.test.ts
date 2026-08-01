import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import { initDatabase, dbRun, dbGet } from '../database'
import authRouter from '../routes/auth'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const PREFIX = 'auth-route-test-'
const unique = Date.now().toString(36)
const EMAIL = `${PREFIX}owner_${unique}@example.com`
const PASSWORD = 'StrongPass123!'
const STORE_NAME = `Loja Teste ${unique}`

let app: express.Express
let ownerToken: string
let storeId: string
let inviteEmail: string

beforeAll(async () => {
  await initDatabase()

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRouter)
})

afterAll(() => {
  const users = dbGet('SELECT id, store_id FROM users WHERE email IN (?, ?)', [EMAIL, inviteEmail])
  const ids = Array.isArray(users) ? users : users ? [users] : []
  for (const u of ids) {
    dbRun('DELETE FROM password_resets WHERE user_id = ?', [u.id])
    dbRun('DELETE FROM users WHERE id = ?', [u.id])
  }
  const stores = [storeId, ...(Array.isArray(users) ? users.map((u: any) => u.store_id) : users ? [users.store_id] : [])]
  for (const s of new Set(stores.filter(Boolean))) {
    dbRun('DELETE FROM subscriptions WHERE store_id = ?', [s])
    dbRun('DELETE FROM company_settings WHERE id = ?', [s])
    dbRun('DELETE FROM stores WHERE id = ?', [s])
  }
})

describe('registro e login via repositories', () => {
  it('register cria loja, settings, usuário owner e subscription', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ storeName: STORE_NAME, name: 'Dono', email: EMAIL, password: PASSWORD })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.role).toBe('owner')
    expect(res.body.store.id).toBeTruthy()
    expect(res.body.store.slug).toContain('loja-teste')

    storeId = res.body.store.id
    ownerToken = res.body.token

    const store = dbGet('SELECT * FROM stores WHERE id = ?', [storeId])
    expect(store).toBeTruthy()

    const settings = dbGet('SELECT * FROM company_settings WHERE id = ?', [storeId])
    expect(settings?.store_name).toBe(STORE_NAME)

    const sub = dbGet('SELECT * FROM subscriptions WHERE store_id = ?', [storeId])
    expect(sub?.plan).toBe('premium')
    expect(sub?.status).toBe('trialing')

    const user = dbGet('SELECT * FROM users WHERE email = ?', [EMAIL])
    expect(user?.role).toBe('owner')
    expect(user?.store_id).toBe(storeId)
  })

  it('register com email duplicado retorna 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ storeName: 'Outra Loja', name: 'X', email: EMAIL, password: PASSWORD })
    expect(res.status).toBe(409)
  })

  it('login valida credenciais e retorna token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.email).toBe(EMAIL)
  })

  it('login com senha errada retorna 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'SenhaErrada123!' })
    expect(res.status).toBe(401)
  })

  it('GET /me retorna dados do usuário logado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ownerToken}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe(EMAIL)
    expect(res.body.storeId).toBe(storeId)
    expect(res.body.role).toBe('owner')
  })

  it('change-password troca a senha e a antiga deixa de valer', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ currentPassword: PASSWORD, newPassword: 'NewPass456!' })
    expect(res.status).toBe(200)

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
    expect(oldLogin.status).toBe(401)

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'NewPass456!' })
    expect(newLogin.status).toBe(200)
  })
})

describe('convite e recuperação de senha', () => {
  it('invite cria membro com must_change_password', async () => {
    inviteEmail = `${PREFIX}staff_${unique}@example.com`
    const res = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteEmail, name: 'Atendente', role: 'staff' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBeTruthy()

    const user = dbGet('SELECT * FROM users WHERE email = ?', [inviteEmail])
    expect(user?.role).toBe('staff')
    expect(user?.store_id).toBe(storeId)
    expect(user?.must_change_password).toBe(1)
  })

  it('invite exige token de admin', async () => {
    const res = await request(app)
      .post('/api/auth/invite')
      .send({ email: `${PREFIX}nao${unique}@example.com`, name: 'X', role: 'staff' })
    expect(res.status).toBe(401)
  })

  it('forgot + reset password fluxo completo', async () => {
    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: EMAIL })
    expect(forgot.status).toBe(200)

    const reset = dbGet('SELECT id, token, expires_at FROM password_resets WHERE user_id = (SELECT id FROM users WHERE email = ?) ORDER BY created_at DESC LIMIT 1', [EMAIL])
    expect(reset).toBeTruthy()

    const change = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: reset.token, newPassword: 'ResetPass789!' })
    expect(change.status).toBe(200)

    const reused = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: reset.token, newPassword: 'ResetPass789!' })
    expect(reused.status).toBe(400)

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'ResetPass789!' })
    expect(login.status).toBe(200)
  })

  it('reset com token inválido retorna 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'token-invalido', newPassword: 'ResetPass789!' })
    expect(res.status).toBe(400)
  })
})
