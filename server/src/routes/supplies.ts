import { Router, Request, Response } from 'express'
import { suppliesRepository, recipeItemsRepository, supplyMovementsRepository } from '../repositories/supplies'
import { productsRepository } from '../repositories/products'
import { AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/supplies', (req: Request, res: Response) => {
  res.json(suppliesRepository.findAll(storeId(req), undefined, [], 'name'))
})

router.post('/supplies', (req: Request, res: Response) => {
  const { name, unit, cost, quantity, minQuantity, notes } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const supply = suppliesRepository.insert(storeId(req), {
    name, unit: unit || 'un', cost: cost || 0, quantity: quantity || 0, min_quantity: minQuantity || 0, notes: notes || '',
  })
  res.status(201).json(supply)
})

router.put('/supplies/:id', (req: Request, res: Response) => {
  const { name, unit, cost, quantity, minQuantity, notes } = req.body
  suppliesRepository.update(storeId(req), String(req.params.id), {
    name, unit, cost: cost || 0, quantity: quantity ?? 0, min_quantity: minQuantity || 0, notes: notes || '',
  })
  res.json({ success: true })
})

router.delete('/supplies/:id', (req: Request, res: Response) => {
  suppliesRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

router.post('/supplies/:id/movement', (req: Request, res: Response) => {
  const { type, quantity, description } = req.body
  if (!type || !quantity) { res.status(400).json({ error: 'Tipo e quantidade são obrigatórios' }); return }
  const sid = storeId(req)
  const supply = suppliesRepository.findById(sid, String(req.params.id))
  if (!supply) { res.status(404).json({ error: 'Insumo não encontrado' }); return }
  const newQty = type === 'in' ? supply.quantity + quantity : supply.quantity - quantity
  suppliesRepository.update(sid, String(req.params.id), { quantity: Math.max(0, newQty) })
  supplyMovementsRepository.insert(sid, {
    supply_id: String(req.params.id), type, quantity, description: description || '',
  })
  res.json({ success: true, newQuantity: Math.max(0, newQty) })
})

router.get('/supplies/:id/movements', (req: Request, res: Response) => {
  const rows = supplyMovementsRepository.findAll(storeId(req), 'supply_id = ?', [String(req.params.id)], 'created_at DESC')
  res.json(rows)
})

router.get('/recipes', (req: Request, res: Response) => {
  const sid = storeId(req)
  const rows = recipeItemsRepository.raw(
    sid,
    `SELECT ri.*, p.name as product_name, s.name as supply_name, s.unit as supply_unit, s.cost as supply_cost
     FROM recipe_items ri
     JOIN products p ON p.id = ri.product_id
     JOIN supplies s ON s.id = ri.supply_id
     WHERE ri.store_id = ?
     ORDER BY p.name, s.name`,
    [sid ?? 'main']
  )
  res.json(rows)
})

router.get('/recipes/:productId', (req: Request, res: Response) => {
  const sid = storeId(req)
  const productId = String(req.params.productId)
  const product = productsRepository.findById(sid, productId)
  if (!product) { res.status(404).json({ error: 'Produto não encontrado' }); return }
  const items = recipeItemsRepository.raw(
    sid,
    `SELECT ri.*, s.name as supply_name, s.unit as supply_unit, s.cost as supply_cost
     FROM recipe_items ri
     JOIN supplies s ON s.id = ri.supply_id
     WHERE ri.product_id = ? AND ri.store_id = ?`,
    [productId, sid ?? 'main']
  )
  const totalCost = items.reduce((sum: number, i: any) => sum + (i.quantity * i.supply_cost), 0)
  res.json({ product: { id: product.id, name: product.name, price: product.price }, items, totalCost })
})

router.post('/recipes', (req: Request, res: Response) => {
  const { productId, supplyId, quantity } = req.body
  if (!productId || !supplyId || !quantity) { res.status(400).json({ error: 'Dados obrigatórios' }); return }
  const item = recipeItemsRepository.insert(storeId(req), { product_id: productId, supply_id: supplyId, quantity })
  res.status(201).json({ success: true, id: item.id })
})

router.delete('/recipes/:id', (req: Request, res: Response) => {
  recipeItemsRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

router.get('/cost-analysis', (req: Request, res: Response) => {
  const sid = storeId(req)
  const products = productsRepository.raw(
    sid,
    'SELECT id, name, price FROM products WHERE is_available = 1 AND store_id = ?',
    [sid ?? 'main']
  )
  const recipeCosts = recipeItemsRepository.raw(
    sid,
    `SELECT ri.product_id, ri.quantity, s.cost as supply_cost
     FROM recipe_items ri
     JOIN supplies s ON s.id = ri.supply_id
     WHERE ri.store_id = ?`,
    [sid ?? 'main']
  )
  const byProduct = new Map<string, number>()
  for (const r of recipeCosts) {
    byProduct.set(r.product_id, (byProduct.get(r.product_id) || 0) + r.quantity * r.supply_cost)
  }
  const result = products.map((p: any) => {
    const cost = byProduct.get(p.id) || 0
    const margin = p.price > 0 ? ((p.price - cost) / p.price * 100) : 0
    return { ...p, cost, margin: Math.round(margin * 100) / 100 }
  })
  res.json(result)
})

export default router
