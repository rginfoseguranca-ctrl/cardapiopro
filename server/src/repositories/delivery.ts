import { createRepository, BaseRepository } from './base'

export interface DeliveryRoute {
  id: string
  order_id: string | null
  address: string
  customer_name: string | null
  customer_phone: string | null
  sequence: number
  status: string
  driver: string | null
  notes: string | null
  created_at: string
  started_at: string | null
  delivered_at: string | null
  distance: number
  fee: number
  store_id: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  email: string
  vehicle: string
  plate: string
  document: string
  pix_key: string
  status: string
  rating: number
  total_deliveries: number
  notes: string
  is_active: number
  created_at: string
  store_id: string
}

export const deliveryRoutesRepository: BaseRepository<DeliveryRoute> = createRepository<DeliveryRoute>('delivery_routes', {
  columns: [
    'order_id', 'address', 'customer_name', 'customer_phone', 'sequence', 'status',
    'driver', 'notes', 'started_at', 'delivered_at', 'distance', 'fee',
  ],
})

export const driversRepository: BaseRepository<Driver> = createRepository<Driver>('drivers', {
  columns: [
    'name', 'phone', 'email', 'vehicle', 'plate', 'document', 'pix_key', 'status',
    'rating', 'total_deliveries', 'notes', 'is_active',
  ],
})

export function nextRouteSequence(storeId: string | null): number {
  const rows = deliveryRoutesRepository.raw(
    storeId,
    `SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM delivery_routes
     WHERE status != 'delivered' AND store_id = ?`,
    [storeId ?? 'main']
  )
  return Number(rows[0]?.next ?? 1)
}

export function findPendingRouteByOrder(storeId: string | null, orderId: string): DeliveryRoute | null {
  if (!orderId) return null
  return deliveryRoutesRepository.findOne(storeId, "order_id = ? AND status = 'pending'", [orderId])
}

export function findRouteByOrder(storeId: string | null, orderId: string): DeliveryRoute | null {
  if (!orderId) return null
  return deliveryRoutesRepository.findOne(storeId, 'order_id = ?', [orderId])
}

export function findAvailableDriver(storeId: string | null): Driver | null {
  const rows = driversRepository.findAll(
    storeId,
    "status = 'available' AND is_active = 1",
    [],
    'total_deliveries ASC'
  )
  return rows.length > 0 ? rows[0] : null
}

export function findDriverByName(storeId: string | null, name: string): Driver | null {
  if (!name) return null
  return driversRepository.findOne(storeId, 'name = ?', [name])
}
