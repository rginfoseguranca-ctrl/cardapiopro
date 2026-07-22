import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const debts = dbAll('SELECT * FROM fiado ORDER BY created_at DESC')
  const totalPending = dbAll("SELECT COALESCE(SUM(amount - paid_amount), 0) as total FROM fiado WHERE status = 'pending'")
  res.json({ debts, totalPending: totalPending[0]?.total || 0 })
})

router.post('/', (req: Request, res: Response) => {
  const { customerId, customerName, customerPhone, orderId, amount, dueDate, notes } = req.body
  if (!customerName || !amount) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const id = 'fia_' + Date.now()
  dbRun('INSERT INTO fiado (id, customer_id, customer_name, customer_phone, order_id, amount, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, customerId || '', customerName, customerPhone || '', orderId || null, amount, dueDate || null, notes || ''])
  const debt = dbGet('SELECT * FROM fiado WHERE id = ?', [id])
  res.status(201).json(debt)
})

router.patch('/:id/pay', (req: Request, res: Response) => {
  const { amount } = req.body
  const debt = dbGet('SELECT * FROM fiado WHERE id = ?', [req.params.id])
  if (!debt) { res.status(404).json({ error: 'Fiado não encontrado' }); return }
  const newPaid = (debt.paid_amount || 0) + (amount || debt.amount)
  const status = newPaid >= debt.amount ? 'paid' : 'partial'
  dbRun('UPDATE fiado SET paid_amount = ?, status = ? WHERE id = ?', [newPaid, status, req.params.id])
  res.json({ success: true, paidAmount: newPaid, status })
})

export default router
