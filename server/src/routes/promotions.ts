import { Router, Request, Response } from 'express'
import { dbAll } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const promotions = dbAll('SELECT * FROM promotions WHERE is_active = 1')
  res.json(promotions.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    discountType: p.discount_type,
    discountValue: p.discount_value,
    productIds: JSON.parse(p.product_ids || '[]'),
    startsAt: p.starts_at,
    endsAt: p.ends_at,
    isActive: !!p.is_active,
  })))
})

router.get('/combos', (_req: Request, res: Response) => {
  const combos = dbAll('SELECT * FROM combos WHERE is_active = 1')
  res.json(combos.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    image: c.image,
    items: JSON.parse(c.items || '[]'),
    originalPrice: c.original_price,
    comboPrice: c.combo_price,
    isActive: !!c.is_active,
  })))
})

export default router
