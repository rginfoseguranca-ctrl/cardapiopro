import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'

const router = Router()

// ─── Supplies (Insumos) ───
router.get('/supplies', (_req: Request, res: Response) => {
  res.json(dbAll('SELECT * FROM supplies ORDER BY name'))
})

router.post('/supplies', (req: Request, res: Response) => {
  const { name, unit, cost, quantity, minQuantity, notes } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const id = uuid()
  dbRun('INSERT INTO supplies (id, name, unit, cost, quantity, min_quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, unit || 'un', cost || 0, quantity || 0, minQuantity || 0, notes || ''])
  const supply = dbGet('SELECT * FROM supplies WHERE id = ?', [id])
  res.status(201).json(supply)
})

router.put('/supplies/:id', (req: Request, res: Response) => {
  const { name, unit, cost, quantity, minQuantity, notes } = req.body
  dbRun('UPDATE supplies SET name=?, unit=?, cost=?, quantity=?, min_quantity=?, notes=? WHERE id=?',
    [name, unit, cost || 0, quantity ?? 0, minQuantity || 0, notes || '', req.params.id])
  res.json({ success: true })
})

router.delete('/supplies/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM supplies WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

router.post('/supplies/:id/movement', (req: Request, res: Response) => {
  const { type, quantity, description } = req.body
  if (!type || !quantity) { res.status(400).json({ error: 'Tipo e quantidade são obrigatórios' }); return }
  const supply = dbGet('SELECT * FROM supplies WHERE id = ?', [req.params.id])
  if (!supply) { res.status(404).json({ error: 'Insumo não encontrado' }); return }
  const id = uuid()
  const newQty = type === 'in' ? supply.quantity + quantity : supply.quantity - quantity
  dbRun('UPDATE supplies SET quantity = ? WHERE id = ?', [Math.max(0, newQty), req.params.id])
  dbRun('INSERT INTO supply_movements (id, supply_id, type, quantity, description) VALUES (?, ?, ?, ?, ?)',
    [id, req.params.id, type, quantity, description || ''])
  res.json({ success: true, newQuantity: Math.max(0, newQty) })
})

router.get('/supplies/:id/movements', (req: Request, res: Response) => {
  res.json(dbAll('SELECT * FROM supply_movements WHERE supply_id = ? ORDER BY created_at DESC', [req.params.id]))
})

// ─── Recipe Items (Ficha Técnica) ───
router.get('/recipes', (_req: Request, res: Response) => {
  res.json(dbAll(`
    SELECT ri.*, p.name as product_name, s.name as supply_name, s.unit as supply_unit, s.cost as supply_cost
    FROM recipe_items ri
    JOIN products p ON p.id = ri.product_id
    JOIN supplies s ON s.id = ri.supply_id
    ORDER BY p.name, s.name`))
})

router.get('/recipes/:productId', (req: Request, res: Response) => {
  const product = dbGet('SELECT * FROM products WHERE id = ?', [req.params.productId])
  if (!product) { res.status(404).json({ error: 'Produto não encontrado' }); return }
  const items = dbAll(`
    SELECT ri.*, s.name as supply_name, s.unit as supply_unit, s.cost as supply_cost
    FROM recipe_items ri
    JOIN supplies s ON s.id = ri.supply_id
    WHERE ri.product_id = ?`, [req.params.productId])
  const totalCost = items.reduce((sum: number, i: any) => sum + (i.quantity * i.supply_cost), 0)
  res.json({ product: { id: product.id, name: product.name, price: product.price }, items, totalCost })
})

router.post('/recipes', (req: Request, res: Response) => {
  const { productId, supplyId, quantity } = req.body
  if (!productId || !supplyId || !quantity) { res.status(400).json({ error: 'Dados obrigatórios' }); return }
  const id = uuid()
  dbRun('INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES (?, ?, ?, ?)',
    [id, productId, supplyId, quantity])
  res.status(201).json({ success: true, id })
})

router.delete('/recipes/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM recipe_items WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

router.get('/cost-analysis', (_req: Request, res: Response) => {
  const products = dbAll('SELECT id, name, price FROM products WHERE is_available = 1')
  const result = products.map((p: any) => {
    const items = dbAll(`
      SELECT ri.quantity, s.cost as supply_cost, s.name as supply_name, s.unit as supply_unit
      FROM recipe_items ri JOIN supplies s ON s.id = ri.supply_id WHERE ri.product_id = ?`, [p.id])
    const cost = items.reduce((sum: number, i: any) => sum + (i.quantity * i.supply_cost), 0)
    const margin = p.price > 0 ? ((p.price - cost) / p.price * 100) : 0
    return { ...p, cost, margin: Math.round(margin * 100) / 100 }
  })
  res.json(result)
})

export default router