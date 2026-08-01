import { createRepository, BaseRepository } from './base'
import { PaymentWebhook } from './types'

export const paymentWebhooksRepository: BaseRepository<PaymentWebhook> = createRepository<PaymentWebhook>('payment_webhooks', {
  columns: ['provider', 'order_id', 'payment_id', 'status', 'payload'],
})

export function findPaymentWebhook(
  storeId: string | null,
  orderId: string,
  provider: string,
  repo: BaseRepository<PaymentWebhook> = paymentWebhooksRepository
): PaymentWebhook | null {
  if (!orderId) return null
  return repo.findOne(storeId, 'order_id = ? AND provider = ?', [orderId, provider])
}
