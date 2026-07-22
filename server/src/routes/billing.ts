import { Router, Request, Response } from 'express'
import { dbGet, dbRun } from '../database'
import { authMiddleware, AuthRequest } from '../middleware'
import { v4 as uuid } from 'uuid'

const router = Router()

export const PLANS: Record<string, { name: string; price: number; features: string[]; maxProducts: number; maxOrdersMonth: number; maxUsers: number }> = {
  delivery: {
    name: 'Delivery',
    price: 0,
    features: ['cardapio', 'orders', 'delivery', 'kds', 'customers', 'coupons', 'blog'],
    maxProducts: 100,
    maxOrdersMonth: 2000,
    maxUsers: 3,
  },
  mesa: {
    name: 'Mesa',
    price: 0,
    features: ['cardapio', 'orders', 'delivery', 'kds', 'customers', 'coupons', 'blog', 'mesas', 'pdv', 'fiado', 'inventory'],
    maxProducts: 500,
    maxOrdersMonth: 5000,
    maxUsers: 5,
  },
  premium: {
    name: 'Premium',
    price: 0,
    features: ['*'],
    maxProducts: -1,
    maxOrdersMonth: -1,
    maxUsers: -1,
  },
}

router.get('/plans', (_req: Request, res: Response) => {
  res.json(PLANS)
})

router.get('/subscription', authMiddleware, (req: Request, res: Response) => {
  const storeId = (req as AuthRequest).storeId || 'main'
  const sub = dbGet('SELECT * FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1', [storeId])

  if (!sub) {
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    dbRun('INSERT INTO subscriptions (id, store_id, plan, status, trial_ends_at) VALUES (?, ?, ?, ?, ?)',
      ['sub_' + uuid(), storeId, 'premium', 'active', trialEndsAt])
    const newSub = dbGet('SELECT * FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1', [storeId])
    return res.json(newSub)
  }

  if (sub.status === 'trialing' && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
    dbRun('UPDATE subscriptions SET status = ?, updated_at = datetime(\'now\') WHERE id = ?', ['active', sub.id])
    sub.status = 'active'
  }

  const plan = PLANS[sub.plan as keyof typeof PLANS] || PLANS.premium
  res.json({
    ...sub,
    planDetails: plan,
    isTrial: false,
    trialExpired: false,
  })
})

router.post('/checkout', authMiddleware, (req: Request, res: Response) => {
  const { plan } = req.body
  if (!plan || !PLANS[plan as keyof typeof PLANS]) {
    res.status(400).json({ error: 'Plano inválido' })
    return
  }

  const storeId = (req as AuthRequest).storeId || 'main'

  dbRun('UPDATE subscriptions SET plan = ?, status = ?, updated_at = datetime(\'now\') WHERE store_id = ?',
    [plan, 'active', storeId])

  res.json({ success: true, plan: PLANS[plan as keyof typeof PLANS], message: 'Plano ativado com sucesso!' })
})

router.post('/portal', authMiddleware, (req: Request, res: Response) => {
  const storeId = (req as AuthRequest).storeId || 'main'
  const sub = dbGet('SELECT * FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1', [storeId])

  if (!sub) {
    res.status(400).json({ error: 'Nenhuma assinatura encontrada' })
    return
  }

  res.json({ url: `${process.env.APP_URL || 'http://localhost:3001'}/dashboard` })
})

export default router
