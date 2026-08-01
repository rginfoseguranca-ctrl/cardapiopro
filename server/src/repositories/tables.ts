import { createRepository, BaseRepository } from './base'
import { Table } from './types'

export const tablesRepository: BaseRepository<Table> = createRepository<Table>('tables', {
  columns: ['number', 'is_active', 'is_occupied', 'customer_name', 'customer_phone', 'updated_at'],
})

export function findTableByNumber(storeId: string | null, number: number): Table | null {
  return tablesRepository.findOne(storeId, 'number = ?', [number])
}

export function listTables(storeId: string | null): Table[] {
  return tablesRepository.findAll(storeId, undefined, [], 'number ASC')
}
