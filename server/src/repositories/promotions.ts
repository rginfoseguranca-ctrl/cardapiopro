import { createRepository, BaseRepository } from './base'
import { Promotion } from './types'

export const promotionsRepository: BaseRepository<Promotion> = createRepository<Promotion>('promotions', {
  columns: ['title', 'description', 'discount_type', 'discount_value', 'product_ids', 'starts_at', 'ends_at', 'is_active'],
})

export function listActivePromotions(storeId: string | null): Promotion[] {
  const now = new Date().toISOString()
  return promotionsRepository.findAll(
    storeId,
    'is_active = 1 AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?)',
    [now, now],
    'title ASC'
  )
}
