import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const tables = dbAll('SELECT * FROM tables ORDER BY number ASC')
  res.json(tables.map((t: any) => ({ ...t, isActive: !!t.is_active })))
})

router.post('/', (req: Request, res: Response) => {
  const { number } = req.body
  if (!number) { res.status(400).json({ error: 'Número da mesa obrigatório' }); return }

  const existing = dbGet('SELECT id FROM tables WHERE number = ?', [number])
  if (existing) { res.status(400).json({ error: 'Mesa já existe' }); return }

  const id = 'tbl_' + Date.now() + Math.random().toString(36).slice(2, 6)
  dbRun('INSERT INTO tables (id, number) VALUES (?, ?)', [id, number])
  const table = dbGet('SELECT * FROM tables WHERE id = ?', [id])
  res.status(201).json({ ...table, isActive: !!table.is_active })
})

router.delete('/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM tables WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

export default router
