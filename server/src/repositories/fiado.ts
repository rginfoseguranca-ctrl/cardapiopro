import { createRepository, BaseRepository } from './base'
import { FiadoEntry } from './types'

export const fiadoRepository: BaseRepository<FiadoEntry> = createRepository<FiadoEntry>('fiado', {
  columns: ['customer_id', 'customer_name', 'customer_phone', 'order_id', 'amount', 'paid_amount', 'status', 'due_date', 'notes'],
})

export function totalPendingByCustomer(
  storeId: string | null,
  customerId: string,
  repo: BaseRepository<FiadoEntry> = fiadoRepository
): number {
  const rows = repo.raw(
    storeId,
    `SELECT COALESCE(SUM(amount - paid_amount), 0) AS s FROM fiado WHERE customer_id = ? AND status != 'paid' AND store_id = ?`,
    [customerId, storeId ?? 'main']
  )
  return Number(rows[0]?.s ?? 0)
}
