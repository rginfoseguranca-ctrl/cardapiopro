import { createRepository, BaseRepository } from './base'
import { DeliveryArea } from './types'

export const deliveryAreasRepository: BaseRepository<DeliveryArea> = createRepository<DeliveryArea>('delivery_areas', {
  columns: ['name', 'base_fee', 'free_delivery_from', 'radius', 'active'],
})
