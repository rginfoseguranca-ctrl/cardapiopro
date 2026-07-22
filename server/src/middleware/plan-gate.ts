import { Request, Response, NextFunction } from 'express'
import { dbGet } from '../database'
import { AuthRequest } from '../middleware'

const PLAN_FEATURES: Record<string, string[]> = {
  start: ['cardapio', 'orders', 'customers', 'coupons', 'blog', 'loyalty'],
  profissional: ['cardapio', 'orders', 'customers', 'coupons', 'blog', 'loyalty', 'delivery', 'mesas', 'pdv', 'fiado', 'inventory', 'kds'],
  premium: ['*'],
}

export function requireFeature(feature: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const storeId = (req as AuthRequest).storeId || 'main'
    const sub = dbGet('SELECT * FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1', [storeId])

    if (!sub) {
      next()
      return
    }

    if (sub.status === 'trialing') {
      if (sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
        res.status(403).json({ error: 'Período de trial expirado', code: 'TRIAL_EXPIRED' })
        return
      }
      next()
      return
    }

    if (sub.status !== 'active') {
      res.status(403).json({ error: 'Assinatura inativa', code: 'INACTIVE_SUBSCRIPTION' })
      return
    }

    const plan = sub.plan as string
    const features = PLAN_FEATURES[plan] || []

    if (features.includes('*') || features.includes(feature)) {
      next()
    } else {
      res.status(403).json({
        error: `Recurso "${feature}" não disponível no plano ${plan}`,
        code: 'FEATURE_NOT_AVAILABLE',
        requiredPlan: getMinPlanForFeature(feature),
        currentPlan: plan,
      })
    }
  }
}

function getMinPlanForFeature(feature: string): string {
  for (const [plan, features] of Object.entries(PLAN_FEATURES)) {
    if (features.includes(feature)) return plan
  }
  return 'premium'
}
