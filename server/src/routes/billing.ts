import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware'
import { createSubscription, findSubscriptionByStore, updateSubscriptionByStore } from '../repositories/global'
import { storeId as getStoreId } from './helpers'

const router = Router()

export const PLANS: Record<string, { name: string; price: number; features: string[]; maxProducts: number; maxOrdersMonth: number; maxUsers: number }> = {
  start: {
    name: 'Start',
    price: 49.99,
    features: ['cardapio', 'orders', 'customers', 'coupons', 'blog', 'loyalty'],
    maxProducts: 100,
    maxOrdersMonth: 2000,
    maxUsers: 2,
  },
  profissional: {
    name: 'Profissional',
    price: 79.99,
    features: ['cardapio', 'orders', 'customers', 'coupons', 'blog', 'loyalty', 'delivery', 'mesas', 'pdv', 'fiado', 'inventory', 'kds'],
    maxProducts: 500,
    maxOrdersMonth: 5000,
    maxUsers: 5,
  },
  premium: {
    name: 'Premium',
    price: 149.99,
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
  const storeId = getStoreId(req)
  let sub = findSubscriptionByStore(storeId)

  if (!sub) {
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    sub = createSubscription(storeId, 'premium', 'trialing', trialEndsAt)
    return res.json(sub)
  }

  if (sub.status === 'trialing' && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
    updateSubscriptionByStore(storeId, { status: 'active', plan: 'start' })
    sub.status = 'active'
    sub.plan = 'start'
  }

  const plan = PLANS[sub.plan as keyof typeof PLANS] || PLANS.premium
  res.json({
    ...sub,
    planDetails: plan,
    isTrial: sub.status === 'trialing',
    trialExpired: false,
  })
})

router.post('/checkout', authMiddleware, (req: Request, res: Response) => {
  const { plan } = req.body
  if (!plan || !PLANS[plan as keyof typeof PLANS]) {
    res.status(400).json({ error: 'Plano inválido' })
    return
  }

  const storeId = getStoreId(req)
  updateSubscriptionByStore(storeId, { plan, status: 'active' })

  res.json({ success: true, plan: PLANS[plan as keyof typeof PLANS], message: 'Plano ativado com sucesso!' })
})

router.post('/portal', authMiddleware, (req: Request, res: Response) => {
  const storeId = getStoreId(req)
  const sub = findSubscriptionByStore(storeId)

  if (!sub) {
    res.status(400).json({ error: 'Nenhuma assinatura encontrada' })
    return
  }

  res.json({ url: `${process.env.APP_URL || 'http://localhost:3001'}/dashboard` })
})

export default router
