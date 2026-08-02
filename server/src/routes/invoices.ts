import { Router, Request, Response } from 'express'
import { invoicesRepository, nextNfeNumber } from '../repositories/invoices'
import { ordersRepository } from '../repositories/orders'
import { productsRepository } from '../repositories/products'
import { storeId } from './helpers'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  res.json(invoicesRepository.findAll(storeId(req), undefined, [], 'created_at DESC'))
})

router.post('/', (req: Request, res: Response) => {
  const { orderId } = req.body
  if (!orderId) { res.status(400).json({ error: 'ID do pedido obrigatório' }); return }
  const sid = storeId(req)

  const existingInvoice = invoicesRepository.findOne(sid, 'order_id = ?', [orderId])
  if (existingInvoice) { res.status(400).json({ error: 'Pedido já possui nota fiscal' }); return }

  const lastNumber = nextNfeNumber(sid)
  const number = String(lastNumber + 1).padStart(6, '0')

  const order = ordersRepository.findById(sid, orderId)
  if (!order) { res.status(404).json({ error: 'Pedido não encontrado' }); return }

  const items = JSON.parse(order.items || '[]')
  const orderItems = items.map((i: any) => {
    const product = productsRepository.findById(sid, i.productId)
    return {
      ...i,
      ncm: product?.ncm || '21069090',
      cest: product?.cest || '',
      cst: product?.cst || '06000',
      cfop: product?.cfop || '5102',
    }
  })

  const invoice = invoicesRepository.insert(sid, {
    order_id: orderId, status: 'issued', nfe_number: number,
  })
  res.status(201).json({ ...invoice, items: orderItems })
})

router.get('/config', (req: Request, res: Response) => {
  const rows = productsRepository.raw(
    storeId(req),
    `SELECT DISTINCT ncm FROM products WHERE store_id = ? AND ncm IS NOT NULL AND ncm != ""`,
    [storeId(req) ?? 'main']
  )
  res.json({
    ncm: rows,
    cstList: ['06000', '06001', '06002', '04000', '04001', '04002'],
    cfopList: ['5102', '5101', '5401', '5403'],
  })
})

export default router
