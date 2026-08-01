import { Router, Request, Response } from 'express'
import { deliveryAreasRepository } from '../repositories/delivery-areas'
import { authMiddleware, AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || (req.query.storeId as string) || 'main'
}

function mapArea(a: any) {
  return {
    id: a.id, name: a.name, baseFee: a.base_fee, freeDeliveryFrom: a.free_delivery_from,
    radius: a.radius, active: !!a.active,
  }
}

router.get('/', (req: Request, res: Response) => {
  const areas = deliveryAreasRepository.findAll(storeId(req), undefined, [], 'name')
  res.json(areas.map(mapArea))
})

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { name, baseFee, freeDeliveryFrom, radius } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const area = deliveryAreasRepository.insert(storeId(req), {
    name, base_fee: baseFee || 0, free_delivery_from: freeDeliveryFrom || 0, radius: radius || 0, active: 1,
  })
  res.status(201).json(mapArea(area))
})

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const { name, baseFee, freeDeliveryFrom, radius, active } = req.body
  const patch: Record<string, any> = {}
  if (name !== undefined) patch.name = name
  if (baseFee !== undefined) patch.base_fee = baseFee
  if (freeDeliveryFrom !== undefined) patch.free_delivery_from = freeDeliveryFrom
  if (radius !== undefined) patch.radius = radius
  if (active !== undefined) patch.active = active ? 1 : 0
  if (Object.keys(patch).length === 0) { res.json({ success: true }); return }
  deliveryAreasRepository.update(storeId(req), String(req.params.id), patch)
  const area = deliveryAreasRepository.findById(storeId(req), String(req.params.id))
  if (area) res.json(mapArea(area))
  else res.status(404).json({ error: 'Área não encontrada' })
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  deliveryAreasRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

export default router
