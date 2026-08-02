import { Router, Request, Response } from 'express'
import { ordersRepository } from '../repositories/orders'
import { AuthRequest } from '../middleware'
import { storeId } from './helpers'

const router = Router()

function storeScope(req: Request): { sid: string | null; params: any[] } {
  const user = (req as AuthRequest).user
  if (user?.role === 'super_admin') return { sid: null, params: [] }
  const sid = storeId(req)
  return { sid, params: [sid] }
}

function scopeWhere(sid: string | null, clause: string): { sql: string; params: any[] } {
  const parts: string[] = []
  const params: any[] = []
  if (sid != null) { parts.push('store_id = ?'); params.push(sid) }
  if (clause) parts.push(clause)
  return { sql: parts.length ? ' WHERE ' + parts.join(' AND ') : '', params }
}

router.get('/summary', (req: Request, res: Response) => {
  const { sid } = storeScope(req)
  const byStore = (sql: string, params: any[]) => ordersRepository.raw(sid, sql, params)

  const w0 = scopeWhere(sid, '')
  const totalOrders = byStore(`SELECT COUNT(*) as count FROM orders${w0.sql}`, w0.params)[0]?.count || 0
  const wPaid = scopeWhere(sid, "payment_status = 'paid'")
  const totalRevenue = byStore(`SELECT COALESCE(SUM(total), 0) as total FROM orders${wPaid.sql}`, wPaid.params)[0]?.total || 0
  const wToday = scopeWhere(sid, "date(created_at) = date('now')")
  const todayOrders = byStore(`SELECT COUNT(*) as count FROM orders${wToday.sql}`, wToday.params)[0]?.count || 0
  const wTodayPaid = scopeWhere(sid, "date(created_at) = date('now') AND payment_status = 'paid'")
  const todayRevenue = byStore(`SELECT COALESCE(SUM(total), 0) as total FROM orders${wTodayPaid.sql}`, wTodayPaid.params)[0]?.total || 0
  const wPending = scopeWhere(sid, "status != 'delivered' AND status != 'cancelled'")
  const pendingOrders = byStore(`SELECT COUNT(*) as count FROM orders${wPending.sql}`, wPending.params)[0]?.count || 0

  const ordersByStatus = byStore(`SELECT status, COUNT(*) as count FROM orders${w0.sql} GROUP BY status`, w0.params)
  const wWeek = scopeWhere(sid, "created_at >= datetime('now', '-7 days')")
  const ordersByDay = byStore(`
    SELECT date(created_at) as day, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
    FROM orders${wWeek.sql}
    GROUP BY date(created_at)
    ORDER BY day
  `, wWeek.params)

  const topProducts = byStore(`
    SELECT json_extract(value, '$.productName') as name, SUM(json_extract(value, '$.quantity')) as total
    FROM orders, json_each(orders.items)
    ${sid != null ? 'WHERE orders.store_id = ?' : ''}
    GROUP BY name
    ORDER BY total DESC
    LIMIT 5
  `, sid != null ? [sid] : [])

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

router.get('/recent-orders', (req: Request, res: Response) => {
  const { sid } = storeScope(req)
  const w = scopeWhere(sid, '')
  const orders = ordersRepository.raw(sid, `SELECT * FROM orders${w.sql} ORDER BY created_at DESC LIMIT 10`, w.params)
  res.json(orders.map((o: any) => ({ ...o, items: JSON.parse(o.items), printed: !!o.printed })))
})

export default router
