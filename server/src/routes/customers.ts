import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'

const router = Router()

// Public endpoint - get customer orders by phone (no auth required)
router.get('/phone/:phone/orders', (req: Request, res: Response) => {
  const phone = Array.isArray(req.params.phone) ? req.params.phone[0] : req.params.phone
  const cleanPhone = phone.replace(/\D/g, '')
  const customer = dbGet('SELECT * FROM customers WHERE phone = ?', [cleanPhone])
  
  if (!customer) {
    res.json({ orders: [], customer: null })
    return
  }
  
  const orders = dbAll('SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC', [customer.phone])
  res.json({ 
    customer: { ...customer, tags: JSON.parse(customer.tags || '[]') },
    orders: orders.map((o: any) => ({ ...o, items: JSON.parse(o.items) }))
  })
})

router.get('/', (req: Request, res: Response) => {
  const search = req.query.search as string || ''
  const tag = req.query.tag as string || ''
  const minOrders = Number(req.query.minOrders) || 0

  let sql = 'SELECT * FROM customers WHERE 1=1'
  const params: any[] = []

  if (search) {
    sql += ' AND (name LIKE ? OR phone LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (tag) {
    sql += ' AND tags LIKE ?'
    params.push(`%"${tag}"%`)
  }
  if (minOrders > 0) {
    sql += ' AND total_orders >= ?'
    params.push(minOrders)
  }

  sql += ' ORDER BY total_spent DESC'

  const customers = dbAll(sql, params)
  res.json(customers.map((c: any) => ({ ...c, tags: JSON.parse(c.tags || '[]') })))
})

router.get('/:id', (req: Request, res: Response) => {
  const customer = dbGet('SELECT * FROM customers WHERE id = ?', [req.params.id])
  if (!customer) { res.status(404).json({ error: 'Cliente não encontrado' }); return }

  const orders = dbAll('SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC', [customer.phone])
  const cashback = dbAll('SELECT * FROM cashback_transactions WHERE customer_id = ? ORDER BY created_at DESC', [req.params.id])
  const loyalty = dbAll('SELECT points FROM loyalty_points WHERE customer_id = ?', [req.params.id])
  const loyaltyBalance = loyalty.reduce((s: number, r: any) => s + r.points, 0)

  res.json({
    ...customer,
    tags: JSON.parse(customer.tags || '[]'),
    orders: orders.map((o: any) => ({ ...o, items: JSON.parse(o.items) })),
    cashback,
    loyaltyBalance,
  })
})

router.patch('/:id', (req: Request, res: Response) => {
  const { notes, tags } = req.body
  if (notes !== undefined) dbRun('UPDATE customers SET notes = ? WHERE id = ?', [notes, req.params.id])
  if (tags !== undefined) dbRun('UPDATE customers SET tags = ? WHERE id = ?', [JSON.stringify(tags), req.params.id])
  const customer = dbGet('SELECT * FROM customers WHERE id = ?', [req.params.id])
  res.json({ ...customer, tags: JSON.parse(customer.tags || '[]') })
})

router.get('/stats/segmentation', (_req: Request, res: Response) => {
  const total = dbAll('SELECT COUNT(*) as count FROM customers')[0]?.count || 0
  const repeat = dbAll('SELECT COUNT(*) as count FROM customers WHERE total_orders > 1')[0]?.count || 0
  const active30days = dbAll("SELECT COUNT(*) as count FROM customers WHERE last_order_at >= datetime('now', '-30 days')")[0]?.count || 0
  const highValue = dbAll('SELECT COUNT(*) as count FROM customers WHERE total_spent > 100')[0]?.count || 0
  const atRisk = dbAll("SELECT COUNT(*) as count FROM customers WHERE (last_order_at IS NULL OR last_order_at < datetime('now', '-60 days')) AND total_orders > 0")[0]?.count || 0
  const top = dbAll('SELECT * FROM customers ORDER BY total_spent DESC LIMIT 10')
  const byMonth = dbAll(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM customers GROUP BY month ORDER BY month DESC LIMIT 12
  `)
  res.json({ total, active30days, highValue, atRisk, repeatRate: total > 0 ? (repeat / total * 100).toFixed(1) : 0, top, byMonth })
})

export default router
