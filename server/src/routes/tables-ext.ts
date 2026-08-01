import { Router, Request, Response } from 'express'
import { tablesRepository } from '../repositories/tables'
import { authMiddleware, AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.patch('/:id/occupy', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  const { customer_name, customer_phone } = req.body
  tablesRepository.update(storeId(req), String(id), {
    is_occupied: 1, customer_name: customer_name || '', customer_phone: customer_phone || '',
  })
  res.json({ success: true })
})

router.patch('/:id/release', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  tablesRepository.update(storeId(req), String(id), {
    is_occupied: 0, customer_name: null, customer_phone: null,
  })
  res.json({ success: true })
})

export default router
