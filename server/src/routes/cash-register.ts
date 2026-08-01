import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const entries = dbAll('SELECT * FROM cash_register ORDER BY created_at DESC')
  const balance = dbAll("SELECT SUM(CASE WHEN type='income' THEN amount ELSE -amount END) as balance FROM cash_register")
  const totalIn = dbAll("SELECT COALESCE(SUM(amount), 0) as total FROM cash_register WHERE type='income'")
  const totalOut = dbAll("SELECT COALESCE(SUM(amount), 0) as total FROM cash_register WHERE type='expense'")
  const todayIn = dbAll("SELECT COALESCE(SUM(amount), 0) as total FROM cash_register WHERE type='income' AND date(created_at) = date('now')")
  const todayOut = dbAll("SELECT COALESCE(SUM(amount), 0) as total FROM cash_register WHERE type='expense' AND date(created_at) = date('now')")
  const orderCount = dbAll("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now') AND payment_status = 'paid'")
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
  const id = 'cr_' + Date.now()
  dbRun('INSERT INTO cash_register (id, type, description, amount, payment_method) VALUES (?, ?, ?, ?, ?)',
    [id, type, description, amount, paymentMethod || 'cash'])
  const entry = dbGet('SELECT * FROM cash_register WHERE id = ?', [id])
  res.status(201).json(entry)
})

export default router
