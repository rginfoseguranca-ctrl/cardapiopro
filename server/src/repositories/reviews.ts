import { createRepository, BaseRepository } from './base'
import { Review } from './types'

export const reviewsRepository: BaseRepository<Review> = createRepository<Review>('reviews', {
  columns: ['product_id', 'customer_name', 'rating', 'comment'],
})

export function averageRatingByProduct(
  storeId: string | null,
  productId: string,
  repo: BaseRepository<Review> = reviewsRepository
): number {
  const rows = repo.raw(
    storeId,
    `SELECT AVG(rating) AS avg FROM reviews WHERE product_id = ? AND store_id = ?`,
    [productId, storeId ?? 'main']
  )
  return Number(rows[0]?.avg ?? 0)
}
