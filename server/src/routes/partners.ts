import { Router, Request, Response } from 'express'
import { dbAll, dbRun } from '../database'
import { v4 as uuid } from 'uuid'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const partners = dbAll('SELECT * FROM partners ORDER BY created_at DESC')
  res.json(partners)
})

router.post('/', (req: Request, res: Response) => {
  const { name, company, email, phone, city } = req.body
  if (!name) { res.status(400).json({ error: 'Nome obrigatório' }); return }
  const id = 'prt_' + uuid()
  dbRun('INSERT INTO partners (id, name, company, email, phone, city) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, company || '', email || '', phone || '', city || ''])
  res.status(201).json({ id, success: true })
})

export default router
