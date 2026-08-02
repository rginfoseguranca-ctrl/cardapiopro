import { Router, Request, Response } from 'express'
import { fiadoRepository } from '../repositories/fiado'
import { storeId } from './helpers'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const debts = fiadoRepository.findAll(storeId(req), undefined, [], 'created_at DESC')
  const rows = fiadoRepository.raw(
    storeId(req),
    "SELECT COALESCE(SUM(amount - paid_amount), 0) as total FROM fiado WHERE status = 'pending' AND store_id = ?",
    [storeId(req) ?? 'main']
  )
  res.json({ debts, totalPending: rows[0]?.total || 0 })
})

router.post('/', (req: Request, res: Response) => {
  const { customerId, customerName, customerPhone, orderId, amount, dueDate, notes } = req.body
  if (!customerName || !amount) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const debt = fiadoRepository.insert(storeId(req), {
    customer_id: customerId || '', customer_name: customerName, customer_phone: customerPhone || '',
    order_id: orderId || null, amount, due_date: dueDate || null, notes: notes || '',
  })
  res.status(201).json(debt)
})

router.patch('/:id/pay', (req: Request, res: Response) => {
  const { amount } = req.body
  const debt = fiadoRepository.findById(storeId(req), String(req.params.id))
  if (!debt) { res.status(404).json({ error: 'Fiado não encontrado' }); return }
  const newPaid = (debt.paid_amount || 0) + (amount || debt.amount)
  const status = newPaid >= debt.amount ? 'paid' : 'partial'
  fiadoRepository.update(storeId(req), String(req.params.id), { paid_amount: newPaid, status })
  res.json({ success: true, paidAmount: newPaid, status })
})

export default router
