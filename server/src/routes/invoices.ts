import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json(dbAll('SELECT * FROM invoices ORDER BY created_at DESC'))
})

router.post('/', (req: Request, res: Response) => {
  const { orderId } = req.body
  if (!orderId) { res.status(400).json({ error: 'ID do pedido obrigatório' }); return }

  const existingInvoice = dbGet('SELECT id FROM invoices WHERE order_id = ?', [orderId])
  if (existingInvoice) { res.status(400).json({ error: 'Pedido já possui nota fiscal' }); return }

  const id = 'invf_' + Date.now()

  const lastInvoice = dbGet('SELECT nfe_number FROM invoices ORDER BY CAST(nfe_number AS INTEGER) DESC LIMIT 1')
  const lastNumber = lastInvoice ? parseInt(lastInvoice.nfe_number) : 0
  const number = String(lastNumber + 1).padStart(6, '0')

  const order = dbGet('SELECT * FROM orders WHERE id = ?', [orderId])
  if (!order) { res.status(404).json({ error: 'Pedido não encontrado' }); return }

  const items = JSON.parse(order.items || '[]')
  const orderItems = items.map((i: any) => {
    const product = dbGet('SELECT * FROM products WHERE id = ?', [i.productId])
    return {
      ...i,
      ncm: product?.ncm || '21069090',
      cest: product?.cest || '',
      cst: product?.cst || '06000',
      cfop: product?.cfop || '5102',
    }
  })

  dbRun('INSERT INTO invoices (id, order_id, status, nfe_number, total) VALUES (?, ?, ?, ?, ?)',
    [id, orderId, 'issued', number, order.total])

  const invoice = dbGet('SELECT * FROM invoices WHERE id = ?', [id])
  res.status(201).json({ ...invoice, items: orderItems })
})

router.get('/config', (_req: Request, res: Response) => {
  res.json({
    ncm: dbAll('SELECT DISTINCT ncm FROM products WHERE ncm IS NOT NULL AND ncm != ""'),
    cstList: ['06000', '06001', '06002', '04000', '04001', '04002'],
    cfopList: ['5102', '5101', '5401', '5403'],
  })
})

export default router
