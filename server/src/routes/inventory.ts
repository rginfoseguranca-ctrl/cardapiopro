import { Router, Request, Response } from 'express'
import { inventoryRepository, inventoryMovementsRepository } from '../repositories/inventory'
import { storeId } from './helpers'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const items = inventoryRepository.findAll(storeId(req), undefined, [], 'product_name ASC')
  const lowStock = items.filter((i: any) => i.min_quantity > 0 && i.quantity <= i.min_quantity)
  res.json({ items, lowStock })
})

router.post('/product', (req: Request, res: Response) => {
  const { productId, productName, quantity, unit, minQuantity } = req.body
  if (!productName) { res.status(400).json({ error: 'Nome obrigatório' }); return }
  const sid = storeId(req)
  const id = productId || 'inv_' + Date.now()
  inventoryRepository.raw(
    sid,
    'INSERT OR REPLACE INTO inventory (id, product_id, product_name, quantity, unit, min_quantity, store_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, productId || id, productName, quantity || 0, unit || 'un', minQuantity || 0, sid ?? 'main']
  )
  const item = inventoryRepository.findById(sid, id)
  res.status(201).json(item)
})

router.post('/adjust', (req: Request, res: Response) => {
  const { productId, type, quantity, description } = req.body
  if (!productId || !type || !quantity) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const sid = storeId(req)
  const item = inventoryRepository.findById(sid, productId)
  if (!item) { res.status(404).json({ error: 'Produto não encontrado' }); return }
  const newQty = type === 'in' ? item.quantity + quantity : item.quantity - quantity
  inventoryRepository.raw(
    sid,
    'UPDATE inventory SET quantity = ?, updated_at = datetime("now") WHERE id = ? AND store_id = ?',
    [newQty, productId, sid ?? 'main']
  )
  inventoryMovementsRepository.insert(sid, {
    product_id: productId, type, quantity, description: description || '',
  })
  res.json({ success: true, newQuantity: newQty })
})

export default router
