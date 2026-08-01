import { createRepository, BaseRepository } from './base'

export interface Printer {
  id: string
  name: string
  sector: string
  is_active: number
  created_at: string
  store_id: string
}

export const printersRepository: BaseRepository<Printer> = createRepository<Printer>('printers', {
  columns: ['name', 'sector', 'is_active'],
})

export function findActiveKitchenPrinter(storeId: string | null): Printer | null {
  return printersRepository.findOne(storeId, "sector = 'cozinha' AND is_active = 1")
}
