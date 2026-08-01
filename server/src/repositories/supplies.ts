import { createRepository, BaseRepository } from './base'
import { Supply, RecipeItem, SupplyMovement } from './types'

export const suppliesRepository: BaseRepository<Supply> = createRepository<Supply>('supplies', {
  columns: ['name', 'unit', 'cost', 'quantity', 'min_quantity', 'notes'],
})

export const recipeItemsRepository: BaseRepository<RecipeItem> = createRepository<RecipeItem>('recipe_items', {
  columns: ['product_id', 'supply_id', 'quantity'],
})

export const supplyMovementsRepository: BaseRepository<SupplyMovement> = createRepository<SupplyMovement>('supply_movements', {
  columns: ['supply_id', 'type', 'quantity', 'description'],
})

export function findRecipeByProduct(storeId: string | null, productId: string): RecipeItem[] {
  if (!productId) return []
  return recipeItemsRepository.findAll(storeId, 'product_id = ?', [productId])
}

export function findSupplyByName(storeId: string | null, name: string): Supply | null {
  if (!name) return null
  return suppliesRepository.findOne(storeId, 'name = ?', [name])
}
