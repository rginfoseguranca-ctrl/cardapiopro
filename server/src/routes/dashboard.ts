import { Router, Request, Response } from 'express'
import { dbAll, dbGet } from '../database'

const router = Router()

router.get('/summary', (_req: Request, res: Response) => {
  const totalOrders = dbGet('SELECT COUNT(*) as count FROM orders')?.count || 0
  const totalRevenue = dbGet("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status = 'paid'")?.total || 0
  const todayOrders = dbGet("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now')")?.count || 0
  const todayRevenue = dbGet("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE date(created_at) = date('now') AND payment_status = 'paid'")?.total || 0
  const pendingOrders = dbGet("SELECT COUNT(*) as count FROM orders WHERE status != 'delivered' AND status != 'cancelled'")?.count || 0

  const ordersByStatus = dbAll('SELECT status, COUNT(*) as count FROM orders GROUP BY status')
  const ordersByDay = dbAll(`
    SELECT date(created_at) as day, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
    FROM orders
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY day
  `)

  const topProducts = dbAll(`
    SELECT json_extract(value, '$.productName') as name, SUM(json_extract(value, '$.quantity')) as total
    FROM orders, json_each(orders.items)
    GROUP BY name
    ORDER BY total DESC
    LIMIT 5
  `)

  res.json({
    totalOrders,
    totalRevenue,
    todayOrders,
    todayRevenue,
    pendingOrders,
    ordersByStatus,
    ordersByDay,
    topProducts,
  })
})

router.get('/recent-orders', (_req: Request, res: Response) => {
  const orders = dbAll('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10')
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items), printed: !!o.printed })))
})

export default router
