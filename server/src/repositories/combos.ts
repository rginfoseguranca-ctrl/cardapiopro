import { createRepository, BaseRepository } from './base'
import { Combo } from './types'

export const combosRepository: BaseRepository<Combo> = createRepository<Combo>('combos', {
  columns: ['name', 'description', 'image', 'items', 'original_price', 'combo_price', 'is_active'],
})

export function listActiveCombos(storeId: string | null): Combo[] {
  return combosRepository.findAll(storeId, 'is_active = 1', [], 'name ASC')
}
