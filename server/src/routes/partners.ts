import { Router, Request, Response } from 'express'
import { partnersRepository } from '../repositories/partners'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const partners = partnersRepository.findAll(null, undefined, [], 'created_at DESC')
  res.json(partners)
})

router.post('/', (req: Request, res: Response) => {
  const { name, company, email, phone, city } = req.body
  if (!name) { res.status(400).json({ error: 'Nome obrigatório' }); return }
  const partner = partnersRepository.insert(null, {
    name, company: company || '', email: email || '', phone: phone || '', city: city || '',
  })
  res.status(201).json({ id: partner.id, success: true })
})

export default router
