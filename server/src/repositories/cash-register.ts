import { createRepository, BaseRepository } from './base'
import { CashRegisterEntry } from './types'

export const cashRegisterRepository: BaseRepository<CashRegisterEntry> = createRepository<CashRegisterEntry>('cash_register', {
  columns: ['type', 'description', 'amount', 'payment_method', 'order_id'],
})

export function findByOrderId(storeId: string | null, orderId: string): CashRegisterEntry | null {
  if (!orderId) return null
  return cashRegisterRepository.findOne(storeId, 'order_id = ?', [orderId])
}

export function findByTypeAndOrder(storeId: string | null, type: string, orderId: string): CashRegisterEntry | null {
  if (!orderId) return null
  return cashRegisterRepository.findOne(storeId, 'type = ? AND order_id = ?', [type, orderId])
}

export function listByPeriod(storeId: string | null, from: string, to: string): CashRegisterEntry[] {
  return cashRegisterRepository.findAll(
    storeId,
    "created_at >= ? AND created_at <= datetime(?, '+1 day')",
    [from, to],
    'created_at DESC'
  )
}
