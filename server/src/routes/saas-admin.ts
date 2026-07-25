import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { authMiddleware, AuthRequest, adminMiddleware } from '../middleware'

const router = Router()

router.get('/stats', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  const totalStores = dbGet('SELECT COUNT(*) as count FROM stores')
  const totalUsers = dbGet('SELECT COUNT(*) as count FROM users')
  const totalOrders = dbGet('SELECT COUNT(*) as count FROM orders')
  const activeSubs = dbGet("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'")
  const trialingSubs = dbGet("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'trialing'")
  const canceledSubs = dbGet("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'canceled'")

  const recentOrders = dbAll('SELECT id, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10')

  const revenue = dbGet("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'canceled'")

  res.json({
    stores: { total: totalStores?.count || 0 },
    users: { total: totalUsers?.count || 0 },
    orders: { total: totalOrders?.count || 0, recent: recentOrders },
    subscriptions: {
      active: activeSubs?.count || 0,
      trialing: trialingSubs?.count || 0,
      canceled: canceledSubs?.count || 0,
    },
    revenue: { total: revenue?.total || 0 },
  })
})

router.get('/stores', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  const stores = dbAll(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM users WHERE store_id = s.id) as user_count,
      (SELECT COUNT(*) FROM orders WHERE store_id = s.id) as order_count,
      (SELECT status FROM subscriptions WHERE store_id = s.id ORDER BY created_at DESC LIMIT 1) as sub_status,
      (SELECT plan FROM subscriptions WHERE store_id = s.id ORDER BY created_at DESC LIMIT 1) as sub_plan
    FROM stores s
    ORDER BY s.created_at DESC
  `)
  res.json(stores)
})

router.get('/stores/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const store = dbGet('SELECT * FROM stores WHERE id = ?', [req.params.id])
  if (!store) { res.status(404).json({ error: 'Loja não encontrada' }); return }

  const users = dbAll('SELECT id, name, email, role, created_at FROM users WHERE store_id = ?', [req.params.id])
  const orders = dbAll('SELECT id, customer_name, total, status, created_at FROM orders WHERE store_id = ? ORDER BY created_at DESC LIMIT 20', [req.params.id])
  const sub = dbGet('SELECT * FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.id])

  res.json({ ...store, users, orders, subscription: sub })
})

router.put('/stores/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { name, phone, address, primaryColor, isActive } = req.body
  dbRun('UPDATE stores SET name=COALESCE(?,name), phone=COALESCE(?,phone), address=COALESCE(?,address), primary_color=COALESCE(?,primary_color), is_active=COALESCE(?,is_active) WHERE id=?',
    [name, phone, address, primaryColor, isActive, req.params.id])
  res.json({ success: true })
})

router.delete('/stores/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const storeId = req.params.id
  dbRun('DELETE FROM orders WHERE store_id = ?', [storeId])
  dbRun('DELETE FROM products WHERE store_id = ?', [storeId])
  dbRun('DELETE FROM categories WHERE store_id = ?', [storeId])
  dbRun('DELETE FROM users WHERE store_id = ?', [storeId])
  dbRun('DELETE FROM subscriptions WHERE store_id = ?', [storeId])
  dbRun('DELETE FROM stores WHERE id = ?', [storeId])
  res.json({ success: true })
})

router.get('/analytics', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  const revenueByDay = dbAll(`
    SELECT DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders
    FROM orders WHERE status != 'canceled' AND created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at) ORDER BY date
  `)

  const ordersByStatus = dbAll(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `)

  const topStores = dbAll(`
    SELECT st.name, st.slug, SUM(o.total) as revenue, COUNT(o.id) as orders
    FROM orders o JOIN stores st ON st.id = o.store_id
    WHERE o.status != 'canceled'
    GROUP BY o.store_id ORDER BY revenue DESC LIMIT 5
  `)

  const deliveryVsPickup = dbAll(`
    SELECT COALESCE(delivery_type, 'balcao') as type, COUNT(*) as count
    FROM orders WHERE status != 'canceled' GROUP BY delivery_type
  `)

  const monthlyRevenue = dbAll(`
    SELECT strftime('%Y-%m', created_at) as month, SUM(total) as revenue
    FROM orders WHERE status != 'canceled'
    GROUP BY month ORDER BY month DESC LIMIT 6
  `)

  const storeLimits = dbAll(`
    SELECT st.name, st.slug,
      (SELECT plan FROM subscriptions WHERE store_id = st.id ORDER BY created_at DESC LIMIT 1) as plan,
      (SELECT COUNT(*) FROM products WHERE store_id = st.id) as product_count,
      (SELECT COUNT(*) FROM orders WHERE store_id = st.id AND created_at >= DATE('now', 'start of month')) as month_orders,
      (SELECT COUNT(*) FROM users WHERE store_id = st.id) as user_count
    FROM stores st WHERE st.is_active = 1
  `)

  res.json({ revenueByDay, ordersByStatus, topStores, deliveryVsPickup, monthlyRevenue, storeLimits })
})

router.get('/subscriptions', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  const subs = dbAll(`
    SELECT s.*, st.name as store_name, st.slug as store_slug
    FROM subscriptions s
    LEFT JOIN stores st ON st.id = s.store_id
    ORDER BY s.created_at DESC
  `)
  res.json(subs)
})

export default router
