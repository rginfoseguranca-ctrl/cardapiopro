import { Router, Request, Response } from 'express'
import { dbAll, dbGet } from '../database'
import { authMiddleware, AuthRequest } from '../middleware'

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

const router = Router()

router.get('/products', authMiddleware, (req: Request, res: Response) => {
  const storeId = (req as AuthRequest).storeId || 'main'

  const categories = dbAll('SELECT * FROM categories WHERE is_active = 1 ORDER BY "order"')
  const products = dbAll(`SELECT p.*, c.name as category_name, c.icon as category_icon
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_available = 1 ORDER BY c."order", p.name`)

  const productIds = products.map((p: any) => p.id).filter(Boolean)
  const groups: any[] = productIds.length > 0
    ? dbAll(`SELECT * FROM complement_groups WHERE product_id IN (${productIds.map(() => '?').join(',')})`, productIds)
    : []
  const groupIds = groups.map((g: any) => g.id).filter(Boolean)
  const items: any[] = groupIds.length > 0
    ? dbAll(`SELECT * FROM complements WHERE group_id IN (${groupIds.map(() => '?').join(',')}) AND is_available = 1`, groupIds)
    : []

  const complementsByProduct: Record<string, any[]> = {}
  for (const group of groups) {
    if (!complementsByProduct[group.product_id]) complementsByProduct[group.product_id] = []
    complementsByProduct[group.product_id].push({
      ...mapGroup(group),
      items: items.filter((i: any) => i.group_id === group.id).map(mapComplement),
    })
  }

  res.json({ categories, products, complements: complementsByProduct })
})

router.get('/customers', authMiddleware, (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim()
  const storeId = (req as AuthRequest).storeId || 'main'
  if (!q) { res.json([]); return }
  const results = dbAll(
    `SELECT id, name, phone FROM customers WHERE store_id = ? AND (name LIKE ? OR phone LIKE ?) LIMIT 20`,
    [storeId, `%${q}%`, `%${q}%`]
  )
  res.json(results)
})

export default router
