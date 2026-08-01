import { Router, Request, Response } from 'express'
import { dbAll, dbGet } from '../database'

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
    orders: orders.map((o: any) => {
      const { delivery_address, notes, ...safe } = o
      return { ...safe, items: JSON.parse(o.items) }
    })
  })
})

// Public endpoint - get customer loyalty by phone
router.get('/phone/:phone/loyalty', (req: Request, res: Response) => {
  const phone = Array.isArray(req.params.phone) ? req.params.phone[0] : req.params.phone
  const cleanPhone = phone.replace(/\D/g, '')
  const customer = dbGet('SELECT * FROM customers WHERE phone = ?', [cleanPhone])

  if (!customer) {
    res.json({ points: 0, history: [], rewards: [], cashback: 0, cashbackHistory: [] })
    return
  }

  const pointsRow = dbGet('SELECT COALESCE(SUM(points), 0) as total FROM loyalty_points WHERE customer_id = ?', [customer.id])
  const points = pointsRow?.total || 0

  const history = dbAll('SELECT * FROM loyalty_points WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20', [customer.id])
  const rewards = dbAll('SELECT * FROM loyalty_rewards WHERE is_active = 1 ORDER BY points_required ASC')

  const cashbackRow = dbGet("SELECT COALESCE(SUM(amount), 0) as total FROM cashback_transactions WHERE customer_id = ? AND status = 'available'", [customer.id])
  const cashback = cashbackRow?.total || 0

  const cashbackHistory = dbAll('SELECT * FROM cashback_transactions WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20', [customer.id])

  res.json({ points, history, rewards, cashback, cashbackHistory })
})

export default router
