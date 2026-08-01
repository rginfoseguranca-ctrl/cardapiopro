import { Router, Request, Response } from 'express'
import { customersRepository, findCustomerByPhone } from '../repositories/customers'
import { ordersRepository } from '../repositories/orders'
import { cashbackTransactionsRepository } from '../repositories/loyalty'
import { loyaltyPointsRepository } from '../repositories/loyalty'
import { AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/phone/:phone/orders', (req: Request, res: Response) => {
  const phone = Array.isArray(req.params.phone) ? req.params.phone[0] : req.params.phone
  const cleanPhone = phone.replace(/\D/g, '')
  const customer = findCustomerByPhone(storeId(req), cleanPhone)

  if (!customer) {
    res.json({ orders: [], customer: null })
    return
  }

  const orders = ordersRepository.findAll(storeId(req), 'customer_phone = ?', [customer.phone], 'created_at DESC')
  res.json({
    customer: { ...customer, tags: JSON.parse(customer.tags || '[]') },
    orders: orders.map((o: any) => ({ ...o, items: JSON.parse(o.items) }))
  })
})

router.get('/', (req: Request, res: Response) => {
  const search = req.query.search as string || ''
  const tag = req.query.tag as string || ''
  const minOrders = Number(req.query.minOrders) || 0
  const since = req.query.since as string || ''
  const sid = storeId(req)

  let sql = 'SELECT * FROM customers WHERE store_id = ?'
  const params: any[] = [sid ?? 'main']

  if (since) {
    sql += ' AND updated_at >= ?'
    params.push(since)
  }
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

  const customers = customersRepository.raw(sid, sql, params)
  res.json(customers.map((c: any) => ({ ...c, tags: JSON.parse(c.tags || '[]') })))
})

router.get('/:id', (req: Request, res: Response) => {
  const sid = storeId(req)
  const id = String(req.params.id)
  const customer = customersRepository.findById(sid, id)
  if (!customer) { res.status(404).json({ error: 'Cliente não encontrado' }); return }

  const orders = ordersRepository.findAll(sid, 'customer_phone = ?', [customer.phone], 'created_at DESC')
  const cashback = cashbackTransactionsRepository.findAll(sid, 'customer_id = ?', [id], 'created_at DESC')
  const loyalty = loyaltyPointsRepository.findAll(sid, 'customer_id = ?', [id])
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
  const sid = storeId(req)
  const id = String(req.params.id)
  const { notes, tags } = req.body
  const patch: Record<string, any> = {}
  if (notes !== undefined) patch.notes = notes
  if (tags !== undefined) patch.tags = JSON.stringify(tags)
  customersRepository.update(sid, id, patch)
  const customer = customersRepository.findById(sid, id)
  res.json({ ...customer, tags: JSON.parse(customer?.tags || '[]') })
})

router.get('/stats/segmentation', (req: Request, res: Response) => {
  const sid = storeId(req)
  const count = (clause: string) => {
    const rows = customersRepository.raw(sid, `SELECT COUNT(*) as count FROM customers WHERE store_id = ? AND ${clause}`, [sid ?? 'main'])
    return rows[0]?.count || 0
  }
  const total = count('1=1')
  const repeat = count('total_orders > 1')
  const active30days = count("last_order_at >= datetime('now', '-30 days')")
  const highValue = count('total_spent > 100')
  const atRisk = count("(last_order_at IS NULL OR last_order_at < datetime('now', '-60 days')) AND total_orders > 0")
  const top = customersRepository.findAll(sid, undefined, [], 'total_spent DESC LIMIT 10')
  const byMonth = customersRepository.raw(
    sid,
    `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
     FROM customers WHERE store_id = ? GROUP BY month ORDER BY month DESC LIMIT 12`,
    [sid ?? 'main']
  )
  res.json({ total, active30days, highValue, atRisk, repeatRate: total > 0 ? (repeat / total * 100).toFixed(1) : 0, top, byMonth })
})

export default router
