import { Router, Request, Response } from 'express'
import { cashbackTransactionsRepository } from '../repositories/loyalty'
import { getStoreSetting, setStoreSetting } from '../repositories/fixtures'
import { storeId } from './helpers'

const router = Router()

const CASHBACK_PERCENTAGE = 5 // 5% de cashback por pedido

router.get('/balance/:customerId', (req: Request, res: Response) => {
  const customerId = String(req.params.customerId)
  const rows = cashbackTransactionsRepository.findAll(storeId(req), 'customer_id = ?', [customerId])
  const available = rows
    .filter((r: any) => r.status === 'available')
    .reduce((s: number, r: any) => s + r.amount, 0)
  const total = rows.reduce((s: number, r: any) => s + r.amount, 0)
  res.json({ customerId, available, total })
})

router.get('/history/:customerId', (req: Request, res: Response) => {
  const customerId = String(req.params.customerId)
  const rows = cashbackTransactionsRepository.findAll(storeId(req), 'customer_id = ?', [customerId], 'created_at DESC')
  res.json(rows)
})

router.get('/settings', (req: Request, res: Response) => {
  const value = getStoreSetting(storeId(req), 'cashback_percentage')
  res.json({ percentage: value !== null ? Number(value) : CASHBACK_PERCENTAGE })
})

router.post('/settings', (req: Request, res: Response) => {
  const { percentage } = req.body
  setStoreSetting(storeId(req), 'cashback_percentage', String(percentage))
  res.json({ percentage: Number(percentage) })
})

export default router
