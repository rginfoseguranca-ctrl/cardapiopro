import { createRepository, BaseRepository } from './base'
import { LoyaltyPoint, LoyaltyReward, CashbackTransaction } from './types'

export const loyaltyPointsRepository: BaseRepository<LoyaltyPoint> = createRepository<LoyaltyPoint>('loyalty_points', {
  columns: ['customer_id', 'points', 'order_id', 'description'],
})

export const loyaltyRewardsRepository: BaseRepository<LoyaltyReward> = createRepository<LoyaltyReward>('loyalty_rewards', {
  columns: ['name', 'description', 'points_required', 'is_active'],
})

export const cashbackTransactionsRepository: BaseRepository<CashbackTransaction> = createRepository<CashbackTransaction>('cashback_transactions', {
  columns: ['customer_id', 'order_id', 'amount', 'status'],
})

export function balanceByCustomer(storeId: string | null, customerId: string): number {
  const rows = loyaltyPointsRepository.raw(
    storeId,
    `SELECT COALESCE(SUM(points), 0) AS s FROM loyalty_points WHERE customer_id = ? AND store_id = ?`,
    [customerId, storeId ?? 'main']
  )
  return Number(rows[0]?.s ?? 0)
}
