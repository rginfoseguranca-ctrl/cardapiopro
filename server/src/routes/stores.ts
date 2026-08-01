import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'
import { authMiddleware, adminMiddleware } from '../middleware'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const stores = dbAll('SELECT * FROM stores ORDER BY name')
  res.json(stores.map(s => ({ ...s, isActive: !!s.is_active })))
})

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { name, slug, phone, address, primaryColor } = req.body
  if (!name || !slug) { res.status(400).json({ error: 'Nome e slug são obrigatórios' }); return }
  const id = uuid()
  dbRun(`INSERT INTO stores (id, name, slug, phone, address, primary_color) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, slug, phone || '', address || '', primaryColor || '#e74c3c'])
  const store = dbGet('SELECT * FROM stores WHERE id = ?', [id])
  res.status(201).json({ ...store, isActive: !!store.is_active })
})

router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { name, slug, phone, address, primaryColor, isActive } = req.body
  dbRun('UPDATE stores SET name=?, slug=?, phone=?, address=?, primary_color=?, is_active=? WHERE id=?',
    [name, slug, phone || '', address || '', primaryColor || '#e74c3c', isActive !== false ? 1 : 0, req.params.id])
  res.json({ success: true })
})

router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  dbRun('DELETE FROM stores WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

router.get('/:id/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const store = dbGet('SELECT * FROM stores WHERE id = ?', [req.params.id])
  if (!store) { res.status(404).json({ error: 'Loja não encontrada' }); return }
  const todayOrders = dbGet(
    "SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE store_id = ? AND date(created_at) = date('now')",
    [req.params.id]
  )
  const totalOrders = dbGet(
    'SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE store_id = ?',
    [req.params.id]
  )
  res.json({
    store,
    todayOrders: todayOrders.count,
    todayRevenue: todayOrders.revenue,
    totalOrders: totalOrders.count,
    totalRevenue: totalOrders.revenue,
  })
})

router.get('/summary/all', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  const stores = dbAll('SELECT * FROM stores WHERE is_active = 1')
  const result = stores.map((s: any) => {
    const today = dbGet(
      "SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE store_id = ? AND date(created_at) = date('now')",
      [s.id]
    )
    return { ...s, todayOrders: today.count, todayRevenue: today.revenue }
  })
  res.json(result)
})

export default router
