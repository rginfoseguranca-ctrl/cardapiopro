import { Router, Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { dbAll, dbGet, dbRun } from '../database'
import { authMiddleware, AuthRequest } from '../middleware'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const storeId = (req as AuthRequest).storeId || (req.query.storeId as string) || 'main'
  const areas = dbAll('SELECT * FROM delivery_areas WHERE store_id = ? ORDER BY name', [storeId])
  res.json(areas.map(a => ({
    id: a.id, name: a.name, baseFee: a.base_fee, freeDeliveryFrom: a.free_delivery_from,
    radius: a.radius, active: !!a.active,
  })))
})

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const storeId = (req as AuthRequest).storeId || 'main'
  const { name, baseFee, freeDeliveryFrom, radius } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const id = uuid()
  dbRun('INSERT INTO delivery_areas (id, name, base_fee, free_delivery_from, radius, active, store_id) VALUES (?, ?, ?, ?, ?, 1, ?)',
    [id, name, baseFee || 0, freeDeliveryFrom || 0, radius || 0, storeId])
  const area = dbGet('SELECT * FROM delivery_areas WHERE id = ?', [id])
  res.status(201).json({ id: area.id, name: area.name, baseFee: area.base_fee, freeDeliveryFrom: area.free_delivery_from, radius: area.radius, active: !!area.active })
})

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const { name, baseFee, freeDeliveryFrom, radius, active } = req.body
  const fields: string[] = []
  const values: any[] = []
  if (name !== undefined) { fields.push('name = ?'); values.push(name) }
  if (baseFee !== undefined) { fields.push('base_fee = ?'); values.push(baseFee) }
  if (freeDeliveryFrom !== undefined) { fields.push('free_delivery_from = ?'); values.push(freeDeliveryFrom) }
  if (radius !== undefined) { fields.push('radius = ?'); values.push(radius) }
  if (active !== undefined) { fields.push('active = ?'); values.push(active ? 1 : 0) }
  if (fields.length === 0) { res.json({ success: true }); return }
  fields.push("updated_at = datetime('now')")
  values.push(req.params.id)
  dbRun(`UPDATE delivery_areas SET ${fields.join(', ')} WHERE id = ?`, values)
  const area = dbGet('SELECT * FROM delivery_areas WHERE id = ?', [req.params.id])
  if (area) res.json({ id: area.id, name: area.name, baseFee: area.base_fee, freeDeliveryFrom: area.free_delivery_from, radius: area.radius, active: !!area.active })
  else res.status(404).json({ error: 'Área não encontrada' })
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  dbRun('DELETE FROM delivery_areas WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

export default router
