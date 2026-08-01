import { Router, Request, Response } from 'express'
import { dbRun } from '../database'
import { authMiddleware, AuthRequest } from '../middleware'

const router = Router()

router.patch('/:id/occupy', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  const { customer_name, customer_phone } = req.body
  const table = dbRun(
    'UPDATE tables SET is_occupied = 1, customer_name = ?, customer_phone = ? WHERE id = ?',
    [customer_name || '', customer_phone || '', id]
  )
  res.json({ success: true })
})

router.patch('/:id/release', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params
  dbRun(
    'UPDATE tables SET is_occupied = 0, customer_name = NULL, customer_phone = NULL WHERE id = ?',
    [id]
  )
  res.json({ success: true })
})

export default router
