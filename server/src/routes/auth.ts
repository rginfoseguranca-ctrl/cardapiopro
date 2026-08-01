import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { v4 as uuid } from 'uuid'
import { JWT_SECRET } from '../middleware'
import { createChildLogger } from '../logger'
import { PLANS } from './billing'
import {
  findUserByEmail, findUserByEmailInStore, findUserById, insertUser, updateUser,
  findSubscriptionByStore, countUsersInStore,
  findUnusedPasswordReset, createPasswordReset, markPasswordResetUsed, createSubscription,
} from '../repositories/global'
import { storesRepository, companySettingsRepository } from '../repositories/fixtures'

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

  const existingUser = findUserByEmail(email)
  if (existingUser) {
    res.status(409).json({ error: 'Email já cadastrado' })
    return
  }

  const storeId = uuid()
  const userId = uuid()
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
  const hash = await bcrypt.hash(password, 10)

  storesRepository.insert(null, { id: storeId, name: storeName, slug })
  companySettingsRepository.insert(null, { id: storeId, store_name: storeName })
  insertUser({ id: userId, name, email, password: hash, role: 'owner', store_id: storeId })

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  createSubscription(storeId, 'premium', 'trialing', trialEndsAt)

  const token = jwt.sign(
    { id: userId, email, role: 'owner', storeId },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.status(201).json({
    token,
    user: { id: userId, name, email, role: 'owner' },
    store: { id: storeId, name: storeName, slug },
  })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha obrigatórios' })
    return
  }

  const user = findUserByEmail(email)
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
      updateUser(user.id, { password: newHash })
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

  const user = findUserByEmail(email)
  if (!user) {
    res.json({ message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' })
    return
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  createPasswordReset(user.id, token, expiresAt)

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

  const reset = findUnusedPasswordReset(token)
  if (!reset) {
    res.status(400).json({ error: 'Token inválido ou já utilizado' })
    return
  }

  if (new Date(reset.expires_at) < new Date()) {
    res.status(400).json({ error: 'Token expirado' })
    return
  }

  const hash = await bcrypt.hash(newPassword, 10)
  updateUser(reset.user_id, { password: hash, must_change_password: 0 })
  markPasswordResetUsed(reset.id)

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

    const user = findUserById(decoded.id)
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
    updateUser(user.id, { password: newHash, must_change_password: 0 })
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
    const user = findUserById(decoded.id)
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
    if (decoded.role !== 'owner' && decoded.role !== 'admin') {
      res.status(403).json({ error: 'Apenas administradores podem convidar membros' })
      return
    }

    const { email, name, role } = req.body
    if (!email || !name) {
      res.status(400).json({ error: 'Email e nome obrigatórios' })
      return
    }

    const existing = findUserByEmailInStore(email, decoded.storeId)
    if (existing) {
      res.status(409).json({ error: 'Email já cadastrado nesta loja' })
      return
    }

    const sub = findSubscriptionByStore(decoded.storeId)
    const plan = PLANS[sub?.plan || 'start'] || PLANS.start
    if (plan.maxUsers > 0) {
      const userCount = countUsersInStore(decoded.storeId)
      if (userCount >= plan.maxUsers) {
        res.status(403).json({ error: `Limite de ${plan.maxUsers} usuários atingido. Atualize seu plano.`, limitType: 'users' })
        return
      }
    }

    const tempPassword = crypto.randomBytes(8).toString('base64url')
    const hash = await bcrypt.hash(tempPassword, 10)
    const userId = uuid()

    insertUser({ id: userId, name, email, password: hash, role: role || 'staff', store_id: decoded.storeId, must_change_password: 1 })

    log.info({ email, storeId: decoded.storeId }, 'Convite enviado para novo membro')

    res.status(201).json({ id: userId, message: 'Convite enviado. Senha temporária gerada.' })
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
})

export default router
