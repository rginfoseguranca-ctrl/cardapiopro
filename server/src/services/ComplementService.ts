import { v4 as uuid } from 'uuid'
import {
  complementGroupsRepository, complementsRepository,
  findGroupsByProduct, findAvailableComplementsByGroup, listGroupsWithProduct,
  findGroupById, findComplementsByIds, GroupWithProduct,
} from '../repositories/complements'
import { productsRepository } from '../repositories/products'
import { ComplementGroup, Complement } from '../repositories/types'
import { httpError } from './http'

export interface ComplementGroupDTO {
  id: string
  name: string
  type: string
  min: number
  max: number
  productId: string
  isRequired: boolean
  createdAt: string
}

export interface ComplementDTO {
  id: string
  groupId: string
  name: string
  price: number
  maxExtra: number
  isAvailable: boolean
  createdAt: string
}

function mapGroup(g: ComplementGroup): ComplementGroupDTO {
  return {
    id: g.id,
    name: g.name,
    type: g.type,
    min: g.min,
    max: g.max,
    productId: g.product_id,
    isRequired: !!g.is_required,
    createdAt: g.created_at,
  }
}

function mapComplement(c: Complement): ComplementDTO {
  return {
    id: c.id,
    groupId: c.group_id,
    name: c.name,
    price: c.price,
    maxExtra: c.max_extra,
    isAvailable: !!c.is_available,
    createdAt: c.created_at,
  }
}

export function listGroupsByProduct(storeId: string | null, productId: string): Array<ComplementGroupDTO & { items: ComplementDTO[] }> {
  return findGroupsByProduct(storeId, productId).map(g => ({
    ...mapGroup(g),
    items: findAvailableComplementsByGroup(storeId, g.id).map(mapComplement),
  }))
}

export function listAllGroups(storeId: string | null): Array<ComplementGroupDTO & { productName: string; items: ComplementDTO[] }> {
  return listGroupsWithProduct(storeId).map((g: GroupWithProduct) => ({
    ...mapGroup(g),
    productName: g.product_name,
    items: complementsRepository.findAll(storeId, 'group_id = ?', [g.id], 'name ASC').map(mapComplement),
  }))
}

export interface CreateGroupInput {
  name: string
  type?: string
  min?: number
  max?: number
  productId: string
  isRequired?: boolean
}

export function createGroup(storeId: string | null, input: CreateGroupInput): ComplementGroupDTO | null {
  if (!productsRepository.findById(storeId, input.productId)) {
    throw httpError(400, 'Produto não encontrado na loja')
  }
  const id = uuid()
  complementGroupsRepository.insert(storeId, {
    id,
    name: input.name,
    type: input.type || 'checkbox',
    min: Number(input.min) || 0,
    max: Number(input.max) || 0,
    product_id: input.productId,
    is_required: input.isRequired ? 1 : 0,
  })
  const row = complementGroupsRepository.findById(storeId, id)
  return row ? mapGroup(row) : null
}

export function updateGroup(storeId: string | null, id: string, body: Record<string, any>): ComplementGroupDTO | null {
  const patch: Record<string, any> = {}
  if (body.name !== undefined) patch.name = body.name
  if (body.type !== undefined) patch.type = body.type
  if (body.min !== undefined) patch.min = Number(body.min) || 0
  if (body.max !== undefined) patch.max = Number(body.max) || 0
  if (body.isRequired !== undefined) patch.is_required = body.isRequired ? 1 : 0
  if (Object.keys(patch).length) complementGroupsRepository.update(storeId, id, patch)
  const row = complementGroupsRepository.findById(storeId, id)
  return row ? mapGroup(row) : null
}

export function deleteGroup(storeId: string | null, id: string): void {
  complementGroupsRepository.remove(storeId, id)
}

export interface CreateComplementInput {
  groupId: string
  name: string
  price?: number
  maxExtra?: number
}

export function createComplement(storeId: string | null, input: CreateComplementInput): ComplementDTO | null {
  if (!complementGroupsRepository.findById(storeId, input.groupId)) {
    throw httpError(400, 'Grupo de complementos não encontrado na loja')
  }
  const id = uuid()
  complementsRepository.insert(storeId, {
    id,
    group_id: input.groupId,
    name: input.name,
    price: Number(input.price) || 0,
    max_extra: Number(input.maxExtra) || 0,
  })
  const row = complementsRepository.findById(storeId, id)
  return row ? mapComplement(row) : null
}

export function updateComplement(storeId: string | null, id: string, body: Record<string, any>): ComplementDTO | null {
  const patch: Record<string, any> = {}
  if (body.name !== undefined) patch.name = body.name
  if (body.price !== undefined) patch.price = Number(body.price) || 0
  if (body.maxExtra !== undefined) patch.max_extra = Number(body.maxExtra) || 0
  if (body.isAvailable !== undefined) patch.is_available = body.isAvailable !== false ? 1 : 0
  if (Object.keys(patch).length) complementsRepository.update(storeId, id, patch)
  const row = complementsRepository.findById(storeId, id)
  return row ? mapComplement(row) : null
}

export function deleteComplement(storeId: string | null, id: string): void {
  complementsRepository.remove(storeId, id)
}

export interface PriceResult {
  price: number
  extraCount: number
}

export function calculateComplementPrice(
  storeId: string | null,
  complementIds: string[],
  groupId?: string
): PriceResult {
  if (!Array.isArray(complementIds) || !complementIds.length) return { price: 0, extraCount: 0 }
  const group = groupId ? findGroupById(storeId, groupId) : null
  if (groupId && !group) return { price: 0, extraCount: 0 }

  const items = findComplementsByIds(storeId, complementIds)
  const totalPrice = items.reduce((sum, c) => sum + (Number(c.price) || 0), 0)
  const maxFree = group ? (group.type === 'radio' ? 1 : group.min) : complementIds.length
  const extraCount = Math.max(0, items.length - maxFree)
  return { price: totalPrice, extraCount }
}
