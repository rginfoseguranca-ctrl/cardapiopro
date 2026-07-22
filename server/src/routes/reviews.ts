import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const reviews = dbAll(`
    SELECT r.*, p.name as product_name FROM reviews r
    JOIN products p ON p.id = r.product_id
    ORDER BY r.created_at DESC
  `)
  res.json(reviews)
})

router.get('/product/:productId', (req: Request, res: Response) => {
  const reviews = dbAll(
    'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
    [req.params.productId]
  )
  const avg = dbGet('SELECT AVG(rating) as avg FROM reviews WHERE product_id = ?', [req.params.productId])
  res.json({ reviews, averageRating: avg?.avg || 0 })
})

router.post('/', (req: Request, res: Response) => {
  const { productId, customerName, rating, comment } = req.body
  if (!productId || !customerName || !rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Dados inválidos' }); return
  }
  const id = uuid()
  dbRun('INSERT INTO reviews (id, product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [id, productId, customerName, rating, comment || ''])
  const review = dbGet('SELECT * FROM reviews WHERE id = ?', [id])
  res.status(201).json(review)
})

export default router
