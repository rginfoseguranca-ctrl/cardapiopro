import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'

const router = Router()

// Points balance
router.get('/points/:customerId', (req: Request, res: Response) => {
  const rows = dbAll('SELECT points FROM loyalty_points WHERE customer_id = ?', [req.params.customerId])
  const total = rows.reduce((s: number, r: any) => s + r.points, 0)
  res.json({ customerId: req.params.customerId, points: total })
})

// Points history
router.get('/history/:customerId', (req: Request, res: Response) => {
  const rows = dbAll('SELECT * FROM loyalty_points WHERE customer_id = ? ORDER BY created_at DESC', [req.params.customerId])
  res.json(rows)
})

// Rewards (admin)
router.get('/rewards', (_req: Request, res: Response) => {
  const rewards = dbAll('SELECT * FROM loyalty_rewards ORDER BY points_required ASC')
  res.json(rewards.map((r: any) => ({ ...r, isActive: !!r.is_active, pointsRequired: r.points_required })))
})

router.post('/rewards', (req: Request, res: Response) => {
  const { name, description, pointsRequired } = req.body
  if (!name || !pointsRequired) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const id = 'rw_' + Date.now() + Math.random().toString(36).slice(2, 6)
  dbRun('INSERT INTO loyalty_rewards (id, name, description, points_required) VALUES (?, ?, ?, ?)',
    [id, name, description || '', pointsRequired])
  const reward = dbGet('SELECT * FROM loyalty_rewards WHERE id = ?', [id])
  res.status(201).json({ ...reward, isActive: !!reward.is_active, pointsRequired: reward.points_required })
})

router.delete('/rewards/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM loyalty_rewards WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

// Redeem reward
router.post('/redeem', (req: Request, res: Response) => {
  const { customerId, rewardId } = req.body
  if (!customerId || !rewardId) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }

  const reward = dbGet('SELECT * FROM loyalty_rewards WHERE id = ? AND is_active = 1', [rewardId])
  if (!reward) { res.status(404).json({ error: 'Recompensa não encontrada' }); return }

  const pointsRows = dbAll('SELECT points FROM loyalty_points WHERE customer_id = ?', [customerId])
  const balance = pointsRows.reduce((s: number, r: any) => s + r.points, 0)

  if (balance < reward.points_required) {
    res.status(400).json({ error: 'Pontos insuficientes' }); return
  }

  dbRun('INSERT INTO loyalty_points (id, customer_id, points, description) VALUES (?, ?, ?, ?)',
    ['lp_' + Date.now(), customerId, -reward.points_required, `Resgate: ${reward.name}`])

  res.json({ success: true, redeemed: reward.name, pointsUsed: reward.points_required })
})

export default router
