import { Router, Request, Response } from 'express'
import { couponsRepository, findActiveCouponByCode, findCouponByCode, incrementCouponUse } from '../repositories/coupons'
import { authMiddleware, AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const coupons = couponsRepository.findAll(storeId(req), undefined, [], 'created_at DESC')
  res.json(coupons.map((c: any) => ({
    ...c,
    isActive: !!c.is_active,
    minOrderValue: c.min_order_value,
    discountType: c.discount_type,
    discountValue: c.discount_value,
    maxUses: c.max_uses,
    usedCount: c.used_count,
    startsAt: c.starts_at,
    expiresAt: c.expires_at,
  })))
})

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { code, title, description, discountType, discountValue, minOrderValue, maxUses, startsAt, expiresAt } = req.body
  if (!code || !title || !discountType || discountValue == null) {
    res.status(400).json({ error: 'Dados obrigatórios faltando' }); return
  }
  const sid = storeId(req)
  if (findCouponByCode(sid, code)) { res.status(400).json({ error: 'Código já existe' }); return }

  const coupon = couponsRepository.insert(sid, {
    code: code.toUpperCase(), title, description: description || '', discount_type: discountType,
    discount_value: discountValue, min_order_value: minOrderValue || 0, max_uses: maxUses || 0,
    starts_at: startsAt || null, expires_at: expiresAt || null,
  })
  res.status(201).json(coupon)
})

router.post('/validate', (req: Request, res: Response) => {
  const { code, orderValue } = req.body
  if (!code) { res.status(400).json({ error: 'Código obrigatório' }); return }

  const coupon = findActiveCouponByCode(storeId(req), code)
  if (!coupon) { res.status(404).json({ error: 'Cupom não encontrado' }); return }

  const now = new Date().toISOString()
  if (coupon.starts_at && now < coupon.starts_at) {
    res.status(400).json({ error: 'Cupom ainda não está disponível' }); return
  }
  if (coupon.expires_at && now > coupon.expires_at) {
    res.status(400).json({ error: 'Cupom expirado' }); return
  }
  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
    res.status(400).json({ error: 'Cupom já atingiu o limite de usos' }); return
  }
  if (orderValue && coupon.min_order_value > 0 && orderValue < coupon.min_order_value) {
    res.status(400).json({ error: `Valor mínimo do pedido: R$ ${coupon.min_order_value.toFixed(2)}` }); return
  }

  let discount = coupon.discount_type === 'percentage'
    ? (orderValue || 0) * (coupon.discount_value / 100)
    : coupon.discount_value

  res.json({
    valid: true,
    coupon: { id: coupon.id, code: coupon.code, title: coupon.title, discountType: coupon.discount_type, discountValue: coupon.discount_value },
    discount,
  })
})

router.patch('/:id/use', authMiddleware, (req: Request, res: Response) => {
  incrementCouponUse(storeId(req), String(req.params.id))
  res.json({ success: true })
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  couponsRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

export default router
