import { Router, Request, Response } from 'express'
import { loyaltyPointsRepository, loyaltyRewardsRepository } from '../repositories/loyalty'
import { AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/points/:customerId', (req: Request, res: Response) => {
  const customerId = String(req.params.customerId)
  const rows = loyaltyPointsRepository.findAll(storeId(req), 'customer_id = ?', [customerId])
  const total = rows.reduce((s: number, r: any) => s + r.points, 0)
  res.json({ customerId, points: total })
})

router.get('/history/:customerId', (req: Request, res: Response) => {
  const customerId = String(req.params.customerId)
  const rows = loyaltyPointsRepository.findAll(storeId(req), 'customer_id = ?', [customerId], 'created_at DESC')
  res.json(rows)
})

router.get('/rewards', (req: Request, res: Response) => {
  const rewards = loyaltyRewardsRepository.findAll(storeId(req), undefined, [], 'points_required ASC')
  res.json(rewards.map((r: any) => ({ ...r, isActive: !!r.is_active, pointsRequired: r.points_required })))
})

router.post('/rewards', (req: Request, res: Response) => {
  const { name, description, pointsRequired } = req.body
  if (!name || !pointsRequired) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const reward = loyaltyRewardsRepository.insert(storeId(req), {
    name, description: description || '', points_required: pointsRequired,
  })
  res.status(201).json({ ...reward, isActive: !!reward.is_active, pointsRequired: reward.points_required })
})

router.delete('/rewards/:id', (req: Request, res: Response) => {
  loyaltyRewardsRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

router.post('/redeem', (req: Request, res: Response) => {
  const { customerId, rewardId } = req.body
  if (!customerId || !rewardId) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const sid = storeId(req)

  const reward = loyaltyRewardsRepository.findOne(sid, 'id = ? AND is_active = 1', [rewardId])
  if (!reward) { res.status(404).json({ error: 'Recompensa não encontrada' }); return }

  const pointsRows = loyaltyPointsRepository.findAll(sid, 'customer_id = ?', [customerId])
  const balance = pointsRows.reduce((s: number, r: any) => s + r.points, 0)

  if (balance < reward.points_required) {
    res.status(400).json({ error: 'Pontos insuficientes' }); return
  }

  loyaltyPointsRepository.insert(sid, {
    customer_id: customerId, points: -reward.points_required, description: `Resgate: ${reward.name}`,
  })

  res.json({ success: true, redeemed: reward.name, pointsUsed: reward.points_required })
})

export default router
