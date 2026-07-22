import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const campaigns = dbAll('SELECT * FROM campaigns ORDER BY created_at DESC')
  res.json(campaigns.map((c: any) => ({ ...c, isActive: !!c.is_active, filters: JSON.parse(c.filters || '{}') })))
})

router.post('/', (req: Request, res: Response) => {
  const { name, message, filters } = req.body
  if (!name || !message) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const id = 'cmp_' + Date.now() + Math.random().toString(36).slice(2, 6)
  dbRun('INSERT INTO campaigns (id, name, message, filters) VALUES (?, ?, ?, ?)',
    [id, name, message, JSON.stringify(filters || {})])
  const campaign = dbGet('SELECT * FROM campaigns WHERE id = ?', [id])
  res.status(201).json({ ...campaign, filters: JSON.parse(campaign.filters || '{}') })
})

router.post('/:id/send', (req: Request, res: Response) => {
  const campaign = dbGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id])
  if (!campaign) { res.status(404).json({ error: 'Campanha não encontrada' }); return }

  const filters = JSON.parse(campaign.filters || '{}')
  let sql = 'SELECT * FROM customers WHERE 1=1 AND phone IS NOT NULL AND phone != ""'
  const params: any[] = []

  if (filters.minOrders) { sql += ' AND total_orders >= ?'; params.push(Number(filters.minOrders)) }
  if (filters.minSpent) { sql += ' AND total_spent >= ?'; params.push(Number(filters.minSpent)) }
  if (filters.tag) { sql += ' AND tags LIKE ?'; params.push(`%${filters.tag}%`) }
  if (filters.lastOrderDays) {
    const date = new Date()
    date.setDate(date.getDate() - Number(filters.lastOrderDays))
    sql += ` AND (last_order_at IS NULL OR last_order_at <= ?)`
    params.push(date.toISOString())
  }

  const customers = dbAll(sql, params)
  const message = campaign.message
    .replace('{store_name}', dbGet("SELECT value FROM store_settings WHERE key = 'store_name'")?.value || 'Loja')

  const sentCount = customers.length
  dbRun('UPDATE campaigns SET status = ?, sent_count = ? WHERE id = ?', ['sent', sentCount, req.params.id])

  res.json({ success: true, sentCount, customers: customers.map((c: any) => ({ name: c.name, phone: c.phone })) })
})

router.get('/segmentation/stats', (_req: Request, res: Response) => {
  const total = dbGet('SELECT COUNT(*) as count FROM customers')
  const active30 = dbGet("SELECT COUNT(*) as count FROM customers WHERE last_order_at >= datetime('now', '-30 days')")
  const highValue = dbGet('SELECT COUNT(*) as count FROM customers WHERE total_spent >= 200')
  const atRisk = dbGet("SELECT COUNT(*) as count FROM customers WHERE last_order_at < datetime('now', '-90 days') AND total_orders > 0")

  res.json({
    total: total.count,
    active30Days: active30.count,
    highValue: highValue.count,
    atRisk: atRisk.count,
  })
})

router.delete('/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM campaigns WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

export default router