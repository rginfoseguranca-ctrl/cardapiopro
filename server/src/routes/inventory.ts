import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const items = dbAll('SELECT * FROM inventory ORDER BY product_name ASC')
  const lowStock = items.filter((i: any) => i.min_quantity > 0 && i.quantity <= i.min_quantity)
  res.json({ items, lowStock })
})

router.post('/product', (req: Request, res: Response) => {
  const { productId, productName, quantity, unit, minQuantity } = req.body
  if (!productName) { res.status(400).json({ error: 'Nome obrigatório' }); return }
  const id = productId || 'inv_' + Date.now()
  dbRun('INSERT OR REPLACE INTO inventory (id, product_id, product_name, quantity, unit, min_quantity) VALUES (?, ?, ?, ?, ?, ?)',
    [id, productId || id, productName, quantity || 0, unit || 'un', minQuantity || 0])
  const item = dbGet('SELECT * FROM inventory WHERE id = ?', [id])
  res.status(201).json(item)
})

router.post('/adjust', (req: Request, res: Response) => {
  const { productId, type, quantity, description } = req.body
  if (!productId || !type || !quantity) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const item = dbGet('SELECT * FROM inventory WHERE id = ?', [productId])
  if (!item) { res.status(404).json({ error: 'Produto não encontrado' }); return }
  const newQty = type === 'in' ? item.quantity + quantity : item.quantity - quantity
  dbRun('UPDATE inventory SET quantity = ?, updated_at = datetime("now") WHERE id = ?', [newQty, productId])
  dbRun('INSERT INTO inventory_movements (id, product_id, type, quantity, description) VALUES (?, ?, ?, ?, ?)',
    ['imv_' + Date.now(), productId, type, quantity, description || ''])
  res.json({ success: true, newQuantity: newQty })
})

export default router
