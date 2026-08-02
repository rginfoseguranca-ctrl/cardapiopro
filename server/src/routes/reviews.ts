import { Router, Request, Response } from 'express'
import { reviewsRepository } from '../repositories/reviews'
import { productsRepository } from '../repositories/products'
import { storeId } from './helpers'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const sid = storeId(req)
  const reviews = reviewsRepository.raw(
    sid,
    `SELECT r.*, p.name as product_name FROM reviews r
     JOIN products p ON p.id = r.product_id
     WHERE r.store_id = ?
     ORDER BY r.created_at DESC`,
    [sid ?? 'main']
  )
  res.json(reviews)
})

router.get('/product/:productId', (req: Request, res: Response) => {
  const sid = storeId(req)
  const productId = String(req.params.productId)
  const reviews = reviewsRepository.findAll(sid, 'product_id = ?', [productId], 'created_at DESC')
  const avg = reviewsRepository.raw(
    sid,
    `SELECT AVG(rating) as avg FROM reviews WHERE product_id = ? AND store_id = ?`,
    [productId, sid ?? 'main']
  )
  res.json({ reviews, averageRating: avg[0]?.avg || 0 })
})

router.post('/', (req: Request, res: Response) => {
  const { productId, customerName, rating, comment } = req.body
  if (!productId || !customerName || !rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Dados inválidos' }); return
  }
  const sid = storeId(req)
  if (!productsRepository.findById(sid, String(productId))) {
    res.status(400).json({ error: 'Produto não encontrado' }); return
  }
  const review = reviewsRepository.insert(sid, {
    product_id: productId, customer_name: customerName, rating, comment: comment || '',
  })
  res.status(201).json(review)
})

export default router
