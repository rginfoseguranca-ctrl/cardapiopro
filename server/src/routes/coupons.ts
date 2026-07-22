import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { authMiddleware } from '../middleware'

const router = Router()

router.get('/', authMiddleware, (_req: Request, res: Response) => {
  const coupons = dbAll('SELECT * FROM coupons ORDER BY created_at DESC')
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
  const existing = dbGet('SELECT id FROM coupons WHERE code = ?', [code.toUpperCase()])
  if (existing) { res.status(400).json({ error: 'Código já existe' }); return }

  const id = 'coup_' + Date.now() + Math.random().toString(36).slice(2, 6)
  dbRun(
    `INSERT INTO coupons (id, code, title, description, discount_type, discount_value, min_order_value, max_uses, starts_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, code.toUpperCase(), title, description || '', discountType, discountValue, minOrderValue || 0, maxUses || 0, startsAt || null, expiresAt || null]
  )
  const coupon = dbGet('SELECT * FROM coupons WHERE id = ?', [id])
  res.status(201).json(coupon)
})

router.post('/validate', (req: Request, res: Response) => {
  const { code, orderValue } = req.body
  if (!code) { res.status(400).json({ error: 'Código obrigatório' }); return }

  const coupon = dbGet('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [code.toUpperCase()])
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
  dbRun('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  dbRun('DELETE FROM coupons WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

export default router
