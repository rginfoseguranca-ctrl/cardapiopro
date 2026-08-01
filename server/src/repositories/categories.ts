import { createRepository, BaseRepository } from './base'
import { Category } from './types'

export const categoriesRepository: BaseRepository<Category> = createRepository<Category>('categories', {
  columns: ['name', 'icon', 'order', 'is_active', 'updated_at'],
})

export function listCategories(
  storeId: string | null,
  opts: { activeOnly?: boolean } = {}
): Category[] {
  return categoriesRepository.findAll(
    storeId,
    opts.activeOnly ? 'is_active = 1' : undefined,
    [],
    '"order" ASC, name ASC'
  )
}

export function getMaxOrder(storeId: string | null): number {
  const rows = categoriesRepository.raw(
    storeId,
    'SELECT COALESCE(MAX("order"), 0) AS m FROM categories WHERE store_id = ?',
    [storeId ?? 'main']
  )
  return Number(rows[0]?.m ?? 0)
}
