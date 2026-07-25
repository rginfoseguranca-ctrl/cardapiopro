import { Router, Request, Response } from 'express'
import { dbGet, dbRun } from '../database'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { v4 as uuid } from 'uuid'
import { JWT_SECRET } from '../middleware'
import { createChildLogger } from '../logger'
import { PLANS } from './billing'

const log = createChildLogger('auth')
const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  const { storeName, name, email, password } = req.body
  if (!storeName || !name || !email || !password) {
    res.status(400).json({ error: 'Nome da loja, nome, email e senha são obrigatórios' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' })
    return
  }

  const existingUser = dbGet('SELECT id FROM users WHERE email = ?', [email])
  if (existingUser) {
    res.status(409).json({ error: 'Email já cadastrado' })
    return
  }

  const storeId = uuid()
  const userId = uuid()
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
  const hash = await bcrypt.hash(password, 10)

  dbRun('INSERT INTO stores (id, name, slug) VALUES (?, ?, ?)', [storeId, storeName, slug])
  dbRun('INSERT INTO company_settings (id, store_name) VALUES (?, ?)', [storeId, storeName])
  dbRun('INSERT INTO users (id, name, email, password, role, store_id) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, name, email, hash, 'admin', storeId])

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  dbRun('INSERT INTO subscriptions (id, store_id, plan, status, trial_ends_at) VALUES (?, ?, ?, ?, ?)',
    ['sub_' + uuid(), storeId, 'premium', 'trialing', trialEndsAt])

  const token = jwt.sign(
    { id: userId, email, role: 'admin', storeId },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.status(201).json({
    token,
    user: { id: userId, name, email, role: 'admin' },
    store: { id: storeId, name: storeName, slug },
  })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha obrigatórios' })
    return
  }

  const user = dbGet('SELECT * FROM users WHERE email = ?', [email])
  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  let valid = false

  if (user.password.startsWith('$2')) {
    valid = await bcrypt.compare(password, user.password)
  } else {
    const hash = crypto.createHash('sha256').update(password).digest('hex')
    valid = hash === user.password
    if (valid) {
      const newHash = await bcrypt.hash(password, 10)
      dbRun('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id])
    }
  }

  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  const mustChange = user.must_change_password === 1
  const storeId = user.store_id || 'main'

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, storeId, must_change_password: user.must_change_password },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    mustChangePassword: mustChange,
  })
})

router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) {
    res.status(400).json({ error: 'Email obrigatório' })
    return
  }

  const user = dbGet('SELECT id FROM users WHERE email = ?', [email])
  if (!user) {
    res.json({ message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' })
    return
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  dbRun('INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [uuid(), user.id, token, expiresAt])

  log.info({ email }, 'Link de redefinição de senha gerado')

  res.json({ message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' })
})

router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token e nova senha obrigatórios' })
    return
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' })
    return
  }

  const reset = dbGet('SELECT * FROM password_resets WHERE token = ? AND used = 0', [token])
  if (!reset) {
    res.status(400).json({ error: 'Token inválido ou já utilizado' })
    return
  }

  if (new Date(reset.expires_at) < new Date()) {
    res.status(400).json({ error: 'Token expirado' })
    return
  }

  const hash = await bcrypt.hash(newPassword, 10)
  dbRun('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?', [hash, reset.user_id])
  dbRun('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id])

  res.json({ message: 'Senha redefinida com sucesso' })
})

router.post('/change-password', async (req: Request, res: Response) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ error: 'Token não fornecido' }); return }

  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Senha atual e nova senha obrigatórias' })
      return
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres' })
      return
    }

    const user = dbGet('SELECT * FROM users WHERE id = ?', [decoded.id])
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return }

    let valid = false
    if (user.password.startsWith('$2')) {
      valid = await bcrypt.compare(currentPassword, user.password)
    } else {
      valid = crypto.createHash('sha256').update(currentPassword).digest('hex') === user.password
    }

    if (!valid) {
      res.status(401).json({ error: 'Senha atual incorreta' })
      return
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    dbRun('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?', [newHash, user.id])
    res.json({ success: true, message: 'Senha alterada com sucesso' })
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
})

router.get('/me', (req: Request, res: Response) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ error: 'Token não fornecido' }); return }

  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any
    const user = dbGet('SELECT id, name, email, role, store_id, created_at, must_change_password FROM users WHERE id = ?', [decoded.id])
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.store_id,
      createdAt: user.created_at,
      mustChangePassword: user.must_change_password === 1,
    })
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
})

router.post('/invite', async (req: Request, res: Response) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ error: 'Token não fornecido' }); return }

  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any
    if (decoded.role !== 'admin') {
      res.status(403).json({ error: 'Apenas administradores podem convidar membros' })
      return
    }

    const { email, name, role } = req.body
    if (!email || !name) {
      res.status(400).json({ error: 'Email e nome obrigatórios' })
      return
    }

    const existing = dbGet('SELECT id FROM users WHERE email = ? AND store_id = ?', [email, decoded.storeId])
    if (existing) {
      res.status(409).json({ error: 'Email já cadastrado nesta loja' })
      return
    }

    const sub = dbGet('SELECT plan FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1', [decoded.storeId])
    const plan = PLANS[sub?.plan || 'start'] || PLANS.start
    if (plan.maxUsers > 0) {
      const userCount = dbGet('SELECT COUNT(*) as c FROM users WHERE store_id = ?', [decoded.storeId])
      if (userCount?.c >= plan.maxUsers) {
        res.status(403).json({ error: `Limite de ${plan.maxUsers} usuários atingido. Atualize seu plano.`, limitType: 'users' })
        return
      }
    }

    const tempPassword = crypto.randomBytes(8).toString('base64url')
    const hash = await bcrypt.hash(tempPassword, 10)
    const userId = uuid()

    dbRun('INSERT INTO users (id, name, email, password, role, store_id, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, hash, role || 'staff', decoded.storeId, 1])

    log.info({ email, storeId: decoded.storeId }, 'Convite enviado para novo membro')

    res.status(201).json({ id: userId, message: 'Convite enviado. Senha temporária gerada.' })
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
})

export default router
