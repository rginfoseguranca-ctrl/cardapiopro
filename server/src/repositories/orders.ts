import { createRepository, BaseRepository } from './base'
import { Order, OrderItem } from './types'

export const ordersRepository: BaseRepository<Order> = createRepository<Order>('orders', {
  columns: [
    'customer_id', 'customer_name', 'customer_phone', 'items', 'subtotal', 'discount',
    'delivery_fee', 'total', 'payment_method', 'payment_status', 'status', 'delivery_type',
    'delivery_address', 'table_number', 'notes', 'scheduled_at', 'printed', 'updated_at',
  ],
})

export function listOrders(storeId: string | null, since?: string): Order[] {
  return ordersRepository.findAll(
    storeId,
    since ? 'updated_at >= ?' : undefined,
    since ? [since] : [],
    'created_at DESC'
  )
}

export function countOrdersInMonth(storeId: string | null): number {
  return ordersRepository.count(
    storeId,
    "created_at >= DATE('now','start of month')"
  )
}

export function findOrderById(storeId: string | null, id: string): Order | null {
  return ordersRepository.findById(storeId, id)
}

export function parseItems(order: Order): OrderItem[] {
  try {
    return JSON.parse(order.items || '[]')
  } catch {
    return []
  }
}
