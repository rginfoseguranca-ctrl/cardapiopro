import { Router, Request, Response } from 'express'
import { cashRegisterRepository } from '../repositories/cash-register'
import { ordersRepository } from '../repositories/orders'
import { AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/', (req: Request, res: Response) => {
  const sid = storeId(req)
  const entries = cashRegisterRepository.findAll(sid, undefined, [], 'created_at DESC')
  const aggregate = (sql: string, params: any[] = []) =>
    cashRegisterRepository.raw(sid, sql, [sid ?? 'main', ...params])
  const balance = aggregate("SELECT SUM(CASE WHEN type='income' THEN amount ELSE -amount END) as balance FROM cash_register WHERE store_id = ?")
  const totalIn = aggregate("SELECT COALESCE(SUM(amount), 0) as total FROM cash_register WHERE store_id = ? AND type='income'")
  const totalOut = aggregate("SELECT COALESCE(SUM(amount), 0) as total FROM cash_register WHERE store_id = ? AND type='expense'")
  const todayIn = aggregate("SELECT COALESCE(SUM(amount), 0) as total FROM cash_register WHERE store_id = ? AND type='income' AND date(created_at) = date('now')")
  const todayOut = aggregate("SELECT COALESCE(SUM(amount), 0) as total FROM cash_register WHERE store_id = ? AND type='expense' AND date(created_at) = date('now')")
  const orderCount = ordersRepository.raw(
    sid,
    "SELECT COUNT(*) as count FROM orders WHERE store_id = ? AND date(created_at) = date('now') AND payment_status = 'paid'",
    [sid ?? 'main']
  )
  res.json({
    entries,
    balance: balance[0]?.balance || 0,
    totalIn: totalIn[0]?.total || 0,
    totalOut: totalOut[0]?.total || 0,
    todayIn: todayIn[0]?.total || 0,
    todayOut: todayOut[0]?.total || 0,
    todayOrders: orderCount[0]?.count || 0,
  })
})

router.post('/', (req: Request, res: Response) => {
  const { type, description, amount, paymentMethod } = req.body
  if (!type || !description || !amount) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const entry = cashRegisterRepository.insert(storeId(req), {
    type, description, amount, payment_method: paymentMethod || 'cash',
  })
  res.status(201).json(entry)
})

export default router
