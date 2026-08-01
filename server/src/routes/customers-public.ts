import { Router, Request, Response } from 'express'
import { customersRepository, findCustomerByPhone } from '../repositories/customers'
import { ordersRepository } from '../repositories/orders'
import { loyaltyPointsRepository, loyaltyRewardsRepository, cashbackTransactionsRepository } from '../repositories/loyalty'
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
    orders: orders.map((o: any) => {
      const { delivery_address, notes, ...safe } = o
      return { ...safe, items: JSON.parse(o.items) }
    })
  })
})

router.get('/phone/:phone/loyalty', (req: Request, res: Response) => {
  const phone = Array.isArray(req.params.phone) ? req.params.phone[0] : req.params.phone
  const cleanPhone = phone.replace(/\D/g, '')
  const customer = findCustomerByPhone(storeId(req), cleanPhone)

  if (!customer) {
    res.json({ points: 0, history: [], rewards: [], cashback: 0, cashbackHistory: [] })
    return
  }

  const pointsRows = loyaltyPointsRepository.raw(
    storeId(req),
    'SELECT COALESCE(SUM(points), 0) as total FROM loyalty_points WHERE customer_id = ? AND store_id = ?',
    [customer.id, storeId(req) ?? 'main']
  )
  const points = pointsRows[0]?.total || 0

  const history = loyaltyPointsRepository.findAll(storeId(req), 'customer_id = ?', [customer.id], 'created_at DESC LIMIT 20')
  const rewards = loyaltyRewardsRepository.findAll(storeId(req), 'is_active = 1', [], 'points_required ASC')

  const cashbackRows = cashbackTransactionsRepository.raw(
    storeId(req),
    "SELECT COALESCE(SUM(amount), 0) as total FROM cashback_transactions WHERE customer_id = ? AND status = 'available' AND store_id = ?",
    [customer.id, storeId(req) ?? 'main']
  )
  const cashback = cashbackRows[0]?.total || 0

  const cashbackHistory = cashbackTransactionsRepository.findAll(storeId(req), 'customer_id = ?', [customer.id], 'created_at DESC LIMIT 20')

  res.json({ points, history, rewards, cashback, cashbackHistory })
})

export default router
