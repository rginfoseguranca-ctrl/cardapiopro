import { v4 as uuid } from 'uuid'
import {
  productsRepository, listCatalogProducts, findCatalogProductById, CatalogRow,
} from '../repositories/products'
import { categoriesRepository, listCategories, getMaxOrder } from '../repositories/categories'
import { Category } from '../repositories/types'
import { httpError } from './http'

export interface ProductDTO {
  id: string
  name: string
  description: string
  price: number
  pricePromotional: number | null
  image: string
  barcode: string
  categoryId: string | null
  categoryName: string | null
  categoryIcon: string | null
  isHighlighted: boolean
  isAvailable: boolean
  ingredients: string[]
}

export interface CategoryDTO {
  id: string
  name: string
  icon: string
  order: number
  isActive: boolean
}

function mapProduct(p: CatalogRow): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    pricePromotional: p.price_promotional,
    image: p.image,
    barcode: p.barcode || '',
    categoryId: p.category_id,
    categoryName: p.category_name,
    categoryIcon: p.category_icon,
    isHighlighted: !!p.is_highlighted,
    isAvailable: !!p.is_available,
    ingredients: safeParse(p.ingredients),
  }
}

function mapCategory(c: Category): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    order: c.order,
    isActive: !!c.is_active,
  }
}

function safeParse(value: string | null | undefined): string[] {
  try { return JSON.parse(value || '[]') } catch { return [] }
}

export function listMenuProducts(storeId: string | null): ProductDTO[] {
  return listCatalogProducts(storeId, { availableOnly: true }).map(mapProduct)
}

export function listAllProducts(storeId: string | null, since?: string): ProductDTO[] {
  return listCatalogProducts(storeId, { leftJoin: true, since }).map(mapProduct)
}

export function listHighlights(storeId: string | null): ProductDTO[] {
  return listCatalogProducts(storeId, { availableOnly: true, highlightOnly: true }).map(mapProduct)
}

export function getProduct(storeId: string | null, id: string): ProductDTO | null {
  const row = findCatalogProductById(storeId, id)
  return row ? mapProduct(row) : null
}

export interface CreateProductInput {
  name: string
  description?: string
  price: number
  pricePromotional?: number | null
  image?: string
  barcode?: string
  categoryId?: string | null
  isHighlighted?: boolean
  isAvailable?: boolean
  ingredients?: string[]
}

export function createProduct(storeId: string | null, input: CreateProductInput): ProductDTO | null {
  if (input.categoryId && !categoriesRepository.findById(storeId, input.categoryId)) {
    throw httpError(400, 'Categoria não encontrada na loja')
  }
  const id = uuid()
  productsRepository.insert(storeId, {
    id,
    name: input.name,
    description: input.description || '',
    price: input.price,
    price_promotional: input.pricePromotional || null,
    image: input.image || '',
    barcode: input.barcode || '',
    category_id: input.categoryId || null,
    is_highlighted: input.isHighlighted ? 1 : 0,
    is_available: input.isAvailable !== false ? 1 : 0,
    ingredients: JSON.stringify(input.ingredients || []),
  })
  return getProduct(storeId, id)
}

export function updateProduct(storeId: string | null, id: string, body: Record<string, any>): ProductDTO | null {
  if (body.categoryId && !categoriesRepository.findById(storeId, body.categoryId)) {
    throw httpError(400, 'Categoria não encontrada na loja')
  }
  const allowed: Record<string, (v: any) => any> = {
    name: v => v,
    description: v => v || '',
    price: v => v,
    pricePromotional: v => v || null,
    image: v => v || '',
    barcode: v => v || '',
    categoryId: v => v,
    isHighlighted: v => v ? 1 : 0,
    isAvailable: v => v !== false ? 1 : 0,
    ingredients: v => JSON.stringify(v || []),
  }
  const columns: Record<string, string> = {
    name: 'name',
    description: 'description',
    price: 'price',
    pricePromotional: 'price_promotional',
    image: 'image',
    barcode: 'barcode',
    categoryId: 'category_id',
    isHighlighted: 'is_highlighted',
    isAvailable: 'is_available',
    ingredients: 'ingredients',
  }
  const patch: Record<string, any> = {}
  for (const key of Object.keys(allowed)) {
    if (body[key] !== undefined) patch[columns[key]] = allowed[key](body[key])
  }
  if (!Object.keys(patch).length) throw httpError(400, 'Nenhum campo para atualizar')
  patch.updated_at = new Date().toISOString()
  productsRepository.update(storeId, id, patch)
  return getProduct(storeId, id)
}

export function deleteProduct(storeId: string | null, id: string): void {
  productsRepository.remove(storeId, id)
}

export function listProductCategories(storeId: string | null, since?: string): CategoryDTO[] {
  const categories = since
    ? categoriesRepository.findAll(storeId, 'updated_at >= ?', [since], '"order" ASC')
    : listCategories(storeId)
  return categories.map(mapCategory)
}

export function createCategory(storeId: string | null, input: { name: string; icon?: string }): CategoryDTO | null {
  const id = uuid()
  const maxOrder = getMaxOrder(storeId)
  categoriesRepository.insert(storeId, {
    id,
    name: input.name,
    icon: input.icon || '📁',
    order: maxOrder + 1,
    is_active: 1,
    updated_at: new Date().toISOString(),
  })
  const row = categoriesRepository.findById(storeId, id)
  return row ? mapCategory(row) : null
}

export function updateCategory(storeId: string | null, id: string, body: Record<string, any>): CategoryDTO | null {
  const patch: Record<string, any> = {}
  if (body.name !== undefined) patch.name = body.name
  if (body.icon !== undefined) patch.icon = body.icon
  if (body.order !== undefined) patch.order = body.order
  if (body.isActive !== undefined) patch.is_active = body.isActive ? 1 : 0
  if (Object.keys(patch).length) {
    patch.updated_at = new Date().toISOString()
    categoriesRepository.update(storeId, id, patch)
  }
  const row = categoriesRepository.findById(storeId, id)
  return row ? mapCategory(row) : null
}

export function deleteCategory(storeId: string | null, id: string): void {
  categoriesRepository.remove(storeId, id)
}

