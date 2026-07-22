import { Router, Request, Response } from 'express'
import { dbAll, dbRun } from '../database'
import { v4 as uuid } from 'uuid'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const leads = dbAll('SELECT * FROM leads ORDER BY created_at DESC')
  res.json(leads)
})

router.post('/', (req: Request, res: Response) => {
  const { name, company, email, phone, segment, monthlyRevenue } = req.body
  if (!name || !email) { res.status(400).json({ error: 'Nome e email obrigatórios' }); return }
  const id = 'lead_' + uuid()
  dbRun('INSERT INTO leads (id, name, company, email, phone, segment, monthly_revenue) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, company || '', email, phone || '', segment || '', monthlyRevenue || ''])
  res.status(201).json({ id, success: true })
})

export default router
