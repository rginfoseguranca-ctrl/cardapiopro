import { Router, Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { dbAll, dbGet, dbRun } from '../database'
import { authMiddleware } from '../middleware'

const router = Router()

function mapProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    pricePromotional: p.price_promotional,
    image: p.image,
    categoryId: p.category_id,
    categoryName: p.category_name,
    categoryIcon: p.category_icon,
    isHighlighted: !!p.is_highlighted,
    isAvailable: !!p.is_available,
    ingredients: JSON.parse(p.ingredients || '[]'),
  }
}

router.get('/', (_req: Request, res: Response) => {
  const products = dbAll(`
    SELECT p.*, c.name as category_name, c.icon as category_icon
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_available = 1
    ORDER BY c."order", p.name
  `)
  res.json(products.map(mapProduct))
})

router.get('/all', (_req: Request, res: Response) => {
  const products = dbAll(`
    SELECT p.*, c.name as category_name, c.icon as category_icon
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY c."order", p.name
  `)
  res.json(products.map(mapProduct))
})

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { name, description, price, pricePromotional, image, categoryId, isHighlighted, isAvailable, ingredients } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  if (price === undefined) { res.status(400).json({ error: 'Preço é obrigatório' }); return }
  const id = uuid()
  dbRun(`INSERT INTO products (id, name, description, price, price_promotional, image, category_id, is_highlighted, is_available, ingredients, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [id, name, description || '', price, pricePromotional || null, image || '', categoryId || null, isHighlighted ? 1 : 0, isAvailable !== false ? 1 : 0, JSON.stringify(ingredients || [])])
  const product = dbGet(`SELECT p.*, c.name as category_name, c.icon as category_icon FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`, [id])
  res.status(201).json(mapProduct(product))
})

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const { name, description, price, pricePromotional, image, categoryId, isHighlighted, isAvailable, ingredients } = req.body
  dbRun(`UPDATE products SET
    name = ?, description = ?, price = ?, price_promotional = ?, image = ?,
    category_id = ?, is_highlighted = ?, is_available = ?, ingredients = ?,
    updated_at = datetime('now')
    WHERE id = ?`,
    [name, description || '', price, pricePromotional || null, image || '',
      categoryId, isHighlighted ? 1 : 0, isAvailable !== false ? 1 : 0,
      JSON.stringify(ingredients || []), req.params.id])
  const product = dbGet(`SELECT p.*, c.name as category_name, c.icon as category_icon FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`, [req.params.id])
  if (product) res.json(mapProduct(product))
  else res.status(404).json({ error: 'Produto não encontrado' })
})

router.get('/categories', (_req: Request, res: Response) => {
  const categories = dbAll('SELECT * FROM categories ORDER BY "order"')
  res.json(categories.map(c => ({ id: c.id, name: c.name, icon: c.icon, order: c.order, isActive: !!c.is_active })))
})

router.post('/categories', authMiddleware, (req: Request, res: Response) => {
  const { name, icon } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const id = uuid()
  const maxOrder = dbGet('SELECT COALESCE(MAX("order"), 0) as m FROM categories')
  dbRun('INSERT INTO categories (id, name, icon, "order", is_active) VALUES (?, ?, ?, ?, 1)', [id, name, icon || '📁', (maxOrder?.m || 0) + 1])
  const cat = dbGet('SELECT * FROM categories WHERE id = ?', [id])
  res.json({ id: cat.id, name: cat.name, icon: cat.icon, order: cat.order, isActive: !!cat.is_active })
})

router.put('/categories/:id', authMiddleware, (req: Request, res: Response) => {
  const { name, icon, order, isActive } = req.body
  if (name !== undefined) dbRun('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id])
  if (icon !== undefined) dbRun('UPDATE categories SET icon = ? WHERE id = ?', [icon, req.params.id])
  if (order !== undefined) dbRun('UPDATE categories SET "order" = ? WHERE id = ?', [order, req.params.id])
  if (isActive !== undefined) dbRun('UPDATE categories SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, req.params.id])
  const cat = dbGet('SELECT * FROM categories WHERE id = ?', [req.params.id])
  if (cat) res.json({ id: cat.id, name: cat.name, icon: cat.icon, order: cat.order, isActive: !!cat.is_active })
  else res.status(404).json({ error: 'Categoria não encontrada' })
})

router.delete('/categories/:id', authMiddleware, (req: Request, res: Response) => {
  dbRun('DELETE FROM categories WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

router.get('/highlighted', (_req: Request, res: Response) => {
  const products = dbAll(`
    SELECT p.*, c.name as category_name, c.icon as category_icon
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_available = 1 AND p.is_highlighted = 1
    ORDER BY p.name
  `)
  res.json(products.map(p => ({ ...mapProduct(p), isHighlighted: true })))
})

export default router
