import { createRepository, BaseRepository } from './base'
import { InventoryItem, InventoryMovement } from './types'

export const inventoryRepository: BaseRepository<InventoryItem> = createRepository<InventoryItem>('inventory', {
  columns: ['product_id', 'product_name', 'quantity', 'unit', 'min_quantity', 'updated_at'],
})

export const inventoryMovementsRepository: BaseRepository<InventoryMovement> = createRepository<InventoryMovement>('inventory_movements', {
  columns: ['product_id', 'type', 'quantity', 'description'],
})

export function findByProductId(storeId: string | null, productId: string): InventoryItem | null {
  if (!productId) return null
  return inventoryRepository.findOne(storeId, 'product_id = ?', [productId])
}

export function listLowStock(storeId: string | null): InventoryItem[] {
  return inventoryRepository.findAll(storeId, 'quantity <= min_quantity', [], 'product_name ASC')
}
