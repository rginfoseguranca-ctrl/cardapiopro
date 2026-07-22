import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const routes = dbAll('SELECT * FROM delivery_routes ORDER BY sequence ASC')
  res.json(routes)
})

router.post('/', (req: Request, res: Response) => {
  const { orderId, address, customerName, customerPhone, driver } = req.body
  if (!address) { res.status(400).json({ error: 'Endereço obrigatório' }); return }
  const id = 'dr_' + Date.now()
  const seq = dbAll('SELECT COALESCE(MAX(sequence), 0) + 1 as next FROM delivery_routes WHERE status != ?', ['delivered'])[0]?.next || 1
  dbRun('INSERT INTO delivery_routes (id, order_id, address, customer_name, customer_phone, sequence, driver) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, orderId || null, address, customerName || '', customerPhone || '', seq, driver || ''])
  const route = dbGet('SELECT * FROM delivery_routes WHERE id = ?', [id])
  res.status(201).json(route)
})

router.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body
  dbRun('UPDATE delivery_routes SET status = ? WHERE id = ?', [status, req.params.id])
  res.json({ success: true })
})

export default router
