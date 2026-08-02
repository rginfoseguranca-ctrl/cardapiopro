import { createRepository, BaseRepository } from './base'
import { Product } from './types'

export const productsRepository: BaseRepository<Product> = createRepository<Product>('products', {
  columns: [
    'name', 'description', 'price', 'price_promotional', 'image', 'category_id',
    'is_highlighted', 'is_available', 'ingredients', 'ncm', 'cest', 'cst', 'cfop', 'barcode',
    'updated_at',
  ],
})

export interface CatalogRow extends Product {
  category_name: string
  category_icon: string
}

interface ListCatalogOptions {
  availableOnly?: boolean
  leftJoin?: boolean
  since?: string
  highlightOnly?: boolean
}

export function listCatalogProducts(storeId: string | null, opts: ListCatalogOptions = {}): CatalogRow[] {
  const join = opts.leftJoin
    ? 'LEFT JOIN categories c ON c.id = p.category_id AND c.store_id = p.store_id'
    : 'JOIN categories c ON c.id = p.category_id AND c.store_id = p.store_id'
  const where: string[] = []
  const params: any[] = []
  if (storeId != null) { where.push('p.store_id = ?'); params.push(storeId) }
  if (opts.availableOnly) where.push('p.is_available = 1')
  if (opts.highlightOnly) where.push('p.is_highlighted = 1')
  if (opts.since) { where.push('p.updated_at >= ?'); params.push(opts.since) }
  const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : ''
  return productsRepository.raw(
    storeId,
    `SELECT p.*, c.name as category_name, c.icon as category_icon FROM products p ${join}${whereSql} ORDER BY c."order", p.name`,
    params
  ) as CatalogRow[]
}

export function findCatalogProductById(storeId: string | null, id: string): CatalogRow | null {
  const rows = productsRepository.raw(
    storeId,
    `SELECT p.*, c.name as category_name, c.icon as category_icon
     FROM products p LEFT JOIN categories c ON c.id = p.category_id AND c.store_id = p.store_id
     WHERE p.id = ? AND p.store_id = ?`,
    [id, storeId ?? 'main']
  )
  return rows.length > 0 ? rows[0] as CatalogRow : null
}

export function findAvailableProducts(storeId: string | null, categoryId?: string): Product[] {
  const clause = categoryId ? 'is_available = 1 AND category_id = ?' : 'is_available = 1'
  const params = categoryId ? [categoryId] : []
  return productsRepository.findAll(storeId, clause, params, 'name ASC')
}

export function findByBarcode(storeId: string | null, barcode: string): Product | null {
  if (!barcode) return null
  return productsRepository.findOne(storeId, 'barcode = ?', [barcode])
}
