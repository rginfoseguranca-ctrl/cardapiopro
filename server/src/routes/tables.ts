import { Router, Request, Response } from 'express'
import { tablesRepository, findTableByNumber } from '../repositories/tables'
import { storeId } from './helpers'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const since = req.query.since as string | undefined
  const tables = since
    ? tablesRepository.findAll(storeId(req), 'updated_at >= ?', [since], 'number ASC')
    : tablesRepository.findAll(storeId(req), undefined, [], 'number ASC')
  res.json(tables.map((t: any) => ({ ...t, isActive: !!t.is_active })))
})

router.post('/', (req: Request, res: Response) => {
  const { number } = req.body
  if (!number) { res.status(400).json({ error: 'Número da mesa obrigatório' }); return }

  if (findTableByNumber(storeId(req), number)) { res.status(400).json({ error: 'Mesa já existe' }); return }

  const table = tablesRepository.insert(storeId(req), { number })
  res.status(201).json({ ...table, isActive: !!table.is_active })
})

router.delete('/:id', (req: Request, res: Response) => {
  tablesRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

export default router
