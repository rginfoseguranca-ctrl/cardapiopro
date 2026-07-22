import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'
import { authMiddleware } from '../middleware'

const router = Router()

function mapGroup(g: any) {
  return {
    id: g.id,
    name: g.name,
    type: g.type,
    min: g.min,
    max: g.max,
    productId: g.product_id,
    isRequired: !!g.is_required,
    createdAt: g.created_at,
  }
}

function mapComplement(c: any) {
  return {
    id: c.id,
    groupId: c.group_id,
    name: c.name,
    price: c.price,
    maxExtra: c.max_extra,
    isAvailable: !!c.is_available,
    createdAt: c.created_at,
  }
}

router.get('/groups/:productId', (req: Request, res: Response) => {
  const groups = dbAll('SELECT * FROM complement_groups WHERE product_id = ? ORDER BY name', [req.params.productId])
  const result = groups.map(g => ({
    ...mapGroup(g),
    items: dbAll('SELECT * FROM complements WHERE group_id = ? AND is_available = 1 ORDER BY name', [g.id]).map(mapComplement),
  }))
  res.json(result)
})

router.get('/groups', (_req: Request, res: Response) => {
  const groups = dbAll('SELECT cg.*, p.name as product_name FROM complement_groups cg JOIN products p ON p.id = cg.product_id ORDER BY p.name, cg.name')
  const result = groups.map(g => ({
    ...mapGroup(g),
    productName: g.product_name,
    items: dbAll('SELECT * FROM complements WHERE group_id = ? ORDER BY name', [g.id]).map(mapComplement),
  }))
  res.json(result)
})

router.post('/groups', authMiddleware, (req: Request, res: Response) => {
  const { name, type, min, max, productId, isRequired } = req.body
  if (!name || !productId) { res.status(400).json({ error: 'Nome e produto são obrigatórios' }); return }
  const id = uuid()
  dbRun('INSERT INTO complement_groups (id, name, type, min, max, product_id, is_required) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, type || 'checkbox', min || 0, max || 0, productId, isRequired ? 1 : 0])
  const group = dbGet('SELECT * FROM complement_groups WHERE id = ?', [id])
  res.status(201).json(mapGroup(group))
})

router.put('/groups/:id', authMiddleware, (req: Request, res: Response) => {
  const { name, type, min, max, isRequired } = req.body
  dbRun('UPDATE complement_groups SET name = ?, type = ?, min = ?, max = ?, is_required = ? WHERE id = ?',
    [name, type, min, max, isRequired ? 1 : 0, req.params.id])
  const group = dbGet('SELECT * FROM complement_groups WHERE id = ?', [req.params.id])
  if (group) res.json(mapGroup(group))
  else res.status(404).json({ error: 'Grupo não encontrado' })
})

router.delete('/groups/:id', authMiddleware, (req: Request, res: Response) => {
  dbRun('DELETE FROM complement_groups WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { groupId, name, price, maxExtra } = req.body
  if (!groupId || !name) { res.status(400).json({ error: 'Grupo e nome são obrigatórios' }); return }
  const id = uuid()
  dbRun('INSERT INTO complements (id, group_id, name, price, max_extra) VALUES (?, ?, ?, ?, ?)',
    [id, groupId, name, price || 0, maxExtra || 0])
  const item = dbGet('SELECT * FROM complements WHERE id = ?', [id])
  res.status(201).json(mapComplement(item))
})

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const { name, price, maxExtra, isAvailable } = req.body
  dbRun('UPDATE complements SET name = ?, price = ?, max_extra = ?, is_available = ? WHERE id = ?',
    [name, price || 0, maxExtra || 0, isAvailable !== false ? 1 : 0, req.params.id])
  const item = dbGet('SELECT * FROM complements WHERE id = ?', [req.params.id])
  if (item) res.json(mapComplement(item))
  else res.status(404).json({ error: 'Complemento não encontrado' })
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  dbRun('DELETE FROM complements WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

router.post('/price', (req: Request, res: Response) => {
  const { complementIds, groupId } = req.body
  if (!complementIds || !Array.isArray(complementIds)) { res.json({ price: 0 }); return }
  const group = dbGet('SELECT * FROM complement_groups WHERE id = ?', [groupId])
  if (!group) { res.json({ price: 0 }); return }
  const placeholders = complementIds.map(() => '?').join(',')
  const items = dbAll(`SELECT * FROM complements WHERE id IN (${placeholders})`, complementIds)
  const totalPrice = items.reduce((sum: number, c: any) => sum + c.price, 0)
  const maxFree = group.type === 'radio' ? 1 : group.min
  const extraCount = Math.max(0, complementIds.length - maxFree)
  res.json({ price: totalPrice, extraCount })
})

export default router