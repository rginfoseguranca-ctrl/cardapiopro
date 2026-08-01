import { Router, Request, Response } from 'express'
import { abandonedCartsRepository } from '../repositories/abandoned-carts'
import { AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/', (req: Request, res: Response) => {
  const carts = abandonedCartsRepository.findAll(storeId(req), undefined, [], 'created_at DESC')
  res.json(carts.map((c: any) => ({ ...c, items: JSON.parse(c.items) })))
})

router.post('/', (req: Request, res: Response) => {
  const { customerName, customerPhone, items, subtotal } = req.body
  if (!items?.length) { res.status(400).json({ error: 'Carrinho vazio' }); return }

  const cart = abandonedCartsRepository.insert(storeId(req), {
    customer_name: customerName || '', customer_phone: customerPhone || '', items: JSON.stringify(items), subtotal: subtotal || 0,
  })
  res.status(201).json({ id: cart.id, success: true })
})

router.patch('/:id/recover', (req: Request, res: Response) => {
  abandonedCartsRepository.update(storeId(req), String(req.params.id), { status: 'recovered' })
  res.json({ success: true })
})

export default router
