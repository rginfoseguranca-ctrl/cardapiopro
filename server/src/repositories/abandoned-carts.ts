import { createRepository, BaseRepository } from './base'
import { AbandonedCart } from './types'

export const abandonedCartsRepository: BaseRepository<AbandonedCart> = createRepository<AbandonedCart>('abandoned_carts', {
  columns: ['customer_phone', 'customer_name', 'items', 'subtotal', 'status'],
})
