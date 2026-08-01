import { Router, Request, Response } from 'express'
import { leadsRepository } from '../repositories/leads'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const leads = leadsRepository.findAll(null, undefined, [], 'created_at DESC')
  res.json(leads)
})

router.post('/', (req: Request, res: Response) => {
  const { name, company, email, phone, segment, monthlyRevenue } = req.body
  if (!name || !email) { res.status(400).json({ error: 'Nome e email obrigatórios' }); return }
  const lead = leadsRepository.insert(null, {
    name, company: company || '', email, phone: phone || '', segment: segment || '', monthly_revenue: monthlyRevenue || '',
  })
  res.status(201).json({ id: lead.id, success: true })
})

export default router
