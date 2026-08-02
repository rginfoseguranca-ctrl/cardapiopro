import { Router, Request, Response } from 'express'
import { storesRepository } from '../repositories/fixtures'
import { ordersRepository } from '../repositories/orders'
import { v4 as uuid } from 'uuid'
import { authMiddleware, adminMiddleware } from '../middleware'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const stores = storesRepository.findAll(null, undefined, [], 'name')
  res.json(stores.map(s => ({ ...s, isActive: !!s.is_active })))
})

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { name, slug, phone, address, primaryColor } = req.body
  if (!name || !slug) { res.status(400).json({ error: 'Nome e slug são obrigatórios' }); return }
  const store = storesRepository.insert(null, {
    id: uuid(), name, slug, phone: phone || '', address: address || '', primary_color: primaryColor || '#e74c3c',
  })
  res.status(201).json({ ...store, isActive: !!store.is_active })
})

router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { name, slug, phone, address, primaryColor, isActive } = req.body
  storesRepository.update(null, String(req.params.id), {
    name, slug, phone: phone || '', address: address || '',
    primary_color: primaryColor || '#e74c3c', is_active: isActive !== false ? 1 : 0,
  })
  res.json({ success: true })
})

router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  storesRepository.remove(null, String(req.params.id))
  res.json({ success: true })
})

router.get('/:id/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const store = storesRepository.findById(null, String(req.params.id))
  if (!store) { res.status(404).json({ error: 'Loja não encontrada' }); return }
  const todayOrders = ordersRepository.raw(
    null,
    "SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE store_id = ? AND date(created_at) = date('now')",
    [req.params.id]
  )[0]
  const totalOrders = ordersRepository.raw(
    null,
    'SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE store_id = ?',
    [req.params.id]
  )[0]
  res.json({
    store,
    todayOrders: todayOrders.count,
    todayRevenue: todayOrders.revenue,
    totalOrders: totalOrders.count,
    totalRevenue: totalOrders.revenue,
  })
})

router.get('/summary/all', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  const stores = storesRepository.findAll(null, 'is_active = 1')
  const result = stores.map((s: any) => {
    const today = ordersRepository.raw(
      null,
      "SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE store_id = ? AND date(created_at) = date('now')",
      [s.id]
    )[0]
    return { ...s, todayOrders: today.count, todayRevenue: today.revenue }
  })
  res.json(result)
})

export default router
