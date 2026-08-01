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

export function findActiveCouponByCode(storeId: string | null, code: string): Coupon | null {
  if (!code) return null
  return couponsRepository.findOne(storeId, 'UPPER(code) = UPPER(?) AND is_active = 1', [code])
}

export function incrementCouponUse(storeId: string | null, id: string): void {
  if (!id) return
  couponsRepository.raw(
    storeId,
    'UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND store_id = ?',
    [id, storeId ?? 'main']
  )
}
