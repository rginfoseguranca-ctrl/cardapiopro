import { Router, Request, Response } from 'express'
import { promotionsRepository } from '../repositories/promotions'
import { combosRepository } from '../repositories/combos'
import { AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/', (req: Request, res: Response) => {
  const promotions = promotionsRepository.findAll(storeId(req), 'is_active = 1')
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

router.get('/combos', (req: Request, res: Response) => {
  const combos = combosRepository.findAll(storeId(req), 'is_active = 1')
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
