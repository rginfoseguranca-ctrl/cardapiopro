import { createRepository, BaseRepository } from './base'
import { Coupon } from './types'

export const couponsRepository: BaseRepository<Coupon> = createRepository<Coupon>('coupons', {
  columns: [
    'code', 'title', 'description', 'discount_type', 'discount_value', 'min_order_value',
    'max_uses', 'used_count', 'starts_at', 'expires_at', 'is_active',
  ],
})

export function findCouponByCode(storeId: string | null, code: string): Coupon | null {
  if (!code) return null
  return couponsRepository.findOne(storeId, 'UPPER(code) = UPPER(?)', [code])
}
