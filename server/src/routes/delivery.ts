import { Router, Request, Response } from 'express'
import { deliveryRoutesRepository, nextRouteSequence } from '../repositories/delivery'
import { AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/', (req: Request, res: Response) => {
  const routes = deliveryRoutesRepository.findAll(storeId(req), undefined, [], 'sequence ASC')
  res.json(routes)
})

router.post('/', (req: Request, res: Response) => {
  const { orderId, address, customerName, customerPhone, driver } = req.body
  if (!address) { res.status(400).json({ error: 'Endereço obrigatório' }); return }
  const route = deliveryRoutesRepository.insert(storeId(req), {
    order_id: orderId || null, address, customer_name: customerName || '',
    customer_phone: customerPhone || '', sequence: nextRouteSequence(storeId(req)), driver: driver || '',
  })
  res.status(201).json(route)
})

router.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body
  deliveryRoutesRepository.update(storeId(req), String(req.params.id), { status })
  res.json({ success: true })
})

export default router
