import { createRepository, BaseRepository } from './base'
import { Complement, ComplementGroup } from './types'

export const complementGroupsRepository: BaseRepository<ComplementGroup> = createRepository<ComplementGroup>('complement_groups', {
  columns: ['name', 'type', 'min', 'max', 'product_id', 'is_required'],
})

export const complementsRepository: BaseRepository<Complement> = createRepository<Complement>('complements', {
  columns: ['group_id', 'name', 'price', 'max_extra', 'is_available'],
})

export function findGroupsByProduct(storeId: string | null, productId: string): ComplementGroup[] {
  return complementGroupsRepository.findAll(storeId, 'product_id = ?', [productId], 'name ASC')
}

export function findComplementsByGroup(storeId: string | null, groupId: string): Complement[] {
  return complementsRepository.findAll(storeId, 'group_id = ?', [groupId], 'name ASC')
}

export function findAvailableComplementsByGroup(storeId: string | null, groupId: string): Complement[] {
  return complementsRepository.findAll(storeId, 'group_id = ? AND is_available = 1', [groupId], 'name ASC')
}

export interface GroupWithProduct extends ComplementGroup {
  product_name: string
}

export function listGroupsWithProduct(storeId: string | null): GroupWithProduct[] {
  const where = storeId != null ? 'WHERE cg.store_id = ?' : ''
  const params = storeId != null ? [storeId] : []
  return complementGroupsRepository.raw(
    storeId,
    `SELECT cg.*, p.name as product_name
     FROM complement_groups cg JOIN products p ON p.id = cg.product_id
     ${where} ORDER BY p.name, cg.name`,
    params
  ) as GroupWithProduct[]
}

export function findGroupById(storeId: string | null, groupId: string): ComplementGroup | null {
  return complementGroupsRepository.findById(storeId, groupId)
}

export function findComplementsByIds(storeId: string | null, ids: string[]): Complement[] {
  if (!ids.length) return []
  const placeholders = ids.map(() => '?').join(',')
  return complementsRepository.findAll(storeId, `id IN (${placeholders})`, ids)
}
