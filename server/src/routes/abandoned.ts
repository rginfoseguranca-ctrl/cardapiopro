import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const carts = dbAll('SELECT * FROM abandoned_carts ORDER BY created_at DESC')
  res.json(carts.map((c: any) => ({ ...c, items: JSON.parse(c.items) })))
})

router.post('/', (req: Request, res: Response) => {
  const { customerName, customerPhone, items, subtotal } = req.body
  if (!items?.length) { res.status(400).json({ error: 'Carrinho vazio' }); return }

  const id = 'ab_' + uuid()
  dbRun('INSERT INTO abandoned_carts (id, customer_name, customer_phone, items, subtotal) VALUES (?, ?, ?, ?, ?)',
    [id, customerName || '', customerPhone || '', JSON.stringify(items), subtotal || 0])
  res.status(201).json({ id, success: true })
})

router.patch('/:id/recover', (req: Request, res: Response) => {
  dbRun("UPDATE abandoned_carts SET status = 'recovered' WHERE id = ?", [req.params.id])
  res.json({ success: true })
})

export default router
