import { Router, Request, Response } from 'express'
import { ordersRepository } from '../repositories/orders'
import { storesRepository } from '../repositories/fixtures'
import { listUsers, findSubscriptionByStore, countTable, deleteByStore, listStoresWithStats } from '../repositories/global'
import { authMiddleware, adminMiddleware } from '../middleware'

const router = Router()

router.get('/stats', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  const totalStores = countTable('stores')
  const totalUsers = countTable('users')
  const totalOrders = countTable('orders')
  const activeSubs = countTable('subscriptions', "status = 'active'")
  const trialingSubs = countTable('subscriptions', "status = 'trialing'")
  const canceledSubs = countTable('subscriptions', "status = 'canceled'")

  const recentOrders = ordersRepository.raw(null, 'SELECT id, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10')

  const revenue = ordersRepository.raw(null, "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'canceled'")[0]

  res.json({
    stores: { total: totalStores },
    users: { total: totalUsers },
    orders: { total: totalOrders, recent: recentOrders },
    subscriptions: {
      active: activeSubs,
      trialing: trialingSubs,
      canceled: canceledSubs,
    },
    revenue: { total: revenue?.total || 0 },
  })
})

router.get('/stores', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  res.json(listStoresWithStats())
})

router.get('/stores/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const store = storesRepository.findById(null, String(req.params.id))
  if (!store) { res.status(404).json({ error: 'Loja não encontrada' }); return }

  const users = listUsers(String(req.params.id))
  const orders = ordersRepository.raw(null, 'SELECT id, customer_name, total, status, created_at FROM orders WHERE store_id = ? ORDER BY created_at DESC LIMIT 20', [req.params.id])
  const sub = findSubscriptionByStore(String(req.params.id))

  res.json({ ...store, users, orders, subscription: sub })
})

router.put('/stores/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { name, phone, address, primaryColor, isActive } = req.body
  const patch: Record<string, any> = {}
  if (name !== undefined) patch.name = name
  if (phone !== undefined) patch.phone = phone
  if (address !== undefined) patch.address = address
  if (primaryColor !== undefined) patch.primary_color = primaryColor
  if (isActive !== undefined) patch.is_active = isActive
  storesRepository.update(null, String(req.params.id), patch)
  res.json({ success: true })
})

router.delete('/stores/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const storeId = String(req.params.id)
  deleteByStore('orders', storeId)
  deleteByStore('products', storeId)
  deleteByStore('categories', storeId)
  deleteByStore('users', storeId)
  deleteByStore('subscriptions', storeId)
  storesRepository.remove(null, storeId)
  res.json({ success: true })
})

router.get('/analytics', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  const revenueByDay = ordersRepository.raw(null, `
    SELECT DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders
    FROM orders WHERE status != 'canceled' AND created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at) ORDER BY date
  `)

  const ordersByStatus = ordersRepository.raw(null, `
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `)

  const topStores = ordersRepository.raw(null, `
    SELECT st.name, st.slug, SUM(o.total) as revenue, COUNT(o.id) as orders
    FROM orders o JOIN stores st ON st.id = o.store_id
    WHERE o.status != 'canceled'
    GROUP BY o.store_id ORDER BY revenue DESC LIMIT 5
  `)

  const deliveryVsPickup = ordersRepository.raw(null, `
    SELECT COALESCE(delivery_type, 'balcao') as type, COUNT(*) as count
    FROM orders WHERE status != 'canceled' GROUP BY delivery_type
  `)

  const monthlyRevenue = ordersRepository.raw(null, `
    SELECT strftime('%Y-%m', created_at) as month, SUM(total) as revenue
    FROM orders WHERE status != 'canceled'
    GROUP BY month ORDER BY month DESC LIMIT 6
  `)

  const storeLimits = storesRepository.raw(null, `
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
  const subs = storesRepository.raw(null, `
    SELECT s.*, st.name as store_name, st.slug as store_slug
    FROM subscriptions s
    LEFT JOIN stores st ON st.id = s.store_id
    ORDER BY s.created_at DESC
  `)
  res.json(subs)
})

export default router
