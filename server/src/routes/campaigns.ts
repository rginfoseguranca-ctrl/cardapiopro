import { Router, Request, Response } from 'express'
import { campaignsRepository } from '../repositories/campaigns'
import { customersRepository } from '../repositories/customers'
import { getStoreSetting } from '../repositories/fixtures'
import { authMiddleware, AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const campaigns = campaignsRepository.findAll(storeId(req), undefined, [], 'created_at DESC')
  res.json(campaigns.map((c: any) => ({ ...c, isActive: !!c.is_active, filters: JSON.parse(c.filters || '{}') })))
})

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { name, message, filters } = req.body
  if (!name || !message) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const campaign = campaignsRepository.insert(storeId(req), {
    name, message, filters: JSON.stringify(filters || {}),
  })
  res.status(201).json({ ...campaign, filters: JSON.parse(campaign.filters || '{}') })
})

router.post('/:id/send', authMiddleware, (req: Request, res: Response) => {
  const sid = storeId(req)
  const campaign = campaignsRepository.findById(sid, String(req.params.id))
  if (!campaign) { res.status(404).json({ error: 'Campanha não encontrada' }); return }

  const filters = JSON.parse(campaign.filters || '{}')
  let sql = 'SELECT * FROM customers WHERE store_id = ? AND phone IS NOT NULL AND phone != ""'
  const params: any[] = [sid ?? 'main']

  if (filters.minOrders) { sql += ' AND total_orders >= ?'; params.push(Number(filters.minOrders)) }
  if (filters.minSpent) { sql += ' AND total_spent >= ?'; params.push(Number(filters.minSpent)) }
  if (filters.tag) { sql += ' AND tags LIKE ?'; params.push(`%${filters.tag}%`) }
  if (filters.lastOrderDays) {
    const date = new Date()
    date.setDate(date.getDate() - Number(filters.lastOrderDays))
    sql += ` AND (last_order_at IS NULL OR last_order_at <= ?)`
    params.push(date.toISOString())
  }

  const customers = customersRepository.raw(sid, sql, params)
  const message = campaign.message
    .replace('{store_name}', getStoreSetting(sid, 'store_name') || 'Loja')

  const sentCount = customers.length
  campaignsRepository.update(sid, String(req.params.id), { status: 'sent', sent_count: sentCount })

  res.json({ success: true, sentCount, customers: customers.map((c: any) => ({ name: c.name, phone: c.phone })) })
})

router.get('/segmentation/stats', authMiddleware, (req: Request, res: Response) => {
  const sid = storeId(req)
  const count = (clause: string) => {
    const rows = customersRepository.raw(sid, `SELECT COUNT(*) as count FROM customers WHERE store_id = ? AND ${clause}`, [sid ?? 'main'])
    return rows[0]?.count || 0
  }
  const total = count('1=1')
  const active30 = count("last_order_at >= datetime('now', '-30 days')")
  const highValue = count('total_spent >= 200')
  const atRisk = count("last_order_at < datetime('now', '-90 days') AND total_orders > 0")

  res.json({
    total,
    active30Days: active30,
    highValue,
    atRisk,
  })
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  campaignsRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

export default router
