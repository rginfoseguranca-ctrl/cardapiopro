import { createRepository, BaseRepository } from './base'
import { v4 as uuid } from 'uuid'
import { db } from './db'
import {
  CompanySettings, Store, StoreSetting, Product, Category,
} from './types'
import { listCategories } from './categories'
import { findAvailableProducts } from './products'

// company_settings: PK = id = store_id (sem coluna store_id própria)
export const companySettingsRepository: BaseRepository<CompanySettings> = createRepository<CompanySettings>('company_settings', {
  scoped: false,
  columns: [
    'store_name', 'store_icon', 'primary_color', 'primary_dark', 'payment_pix_key',
    'payment_pix_name', 'payment_card_info', 'payment_cash_info', 'footer_text',
    'scheduling_enabled', 'logo_url', 'whatsapp', 'opening_hours', 'delivery_fee',
    'free_delivery_from', 'avisos', 'is_open', 'updated_at',
  ],
})

// store_settings: chave primária é `key`, escopada por store_id
export const storeSettingsRepository: BaseRepository<StoreSetting> = createRepository<StoreSetting>('store_settings', {
  pk: 'key',
})

export function getStoreSetting(storeId: string | null, key: string): string | null {
  if (!key) return null
  const row = storeSettingsRepository.findById(storeId, key)
  return row ? row.value : null
}

export function setStoreSetting(storeId: string | null, key: string, value: string): void {
  if (!key) return
  db.run(
    'INSERT OR REPLACE INTO store_settings (key, value, store_id) VALUES (?, ?, ?)',
    [key, String(value ?? ''), storeId ?? 'main']
  )
}

// Tabela `stores` (multi-loja, sem escopo) — usada para resolução de slug
export const storesRepository: BaseRepository<Store> = createRepository<Store>('stores', {
  scoped: false,
  columns: ['name', 'slug', 'phone', 'address', 'primary_color', 'is_active'],
})

export function findStoreBySlug(slug: string): Store | null {
  if (!slug) return null
  return storesRepository.findOne(null, 'slug = ?', [slug])
}

export function findStoreById(id: string): Store | null {
  return storesRepository.findById(null, id)
}

export function ensureCompanySettings(storeId: string): CompanySettings {
  const existing = companySettingsRepository.findById(null, storeId)
  if (existing) return existing
  const record: CompanySettings = {
    id: storeId,
    store_name: 'Minha Loja',
    store_icon: '🍔',
    primary_color: '#e74c3c',
    primary_dark: '#c0392b',
    payment_pix_key: '',
    payment_pix_name: '',
    payment_card_info: 'Débito/Crédito',
    payment_cash_info: 'Dinheiro',
    footer_text: '',
    scheduling_enabled: 0,
    logo_url: '',
    whatsapp: '',
    opening_hours: '{}',
    delivery_fee: 0,
    free_delivery_from: 0,
    avisos: '[]',
    is_open: 1,
  }
  companySettingsRepository.insert(null, record)
  return record
}

export interface PublicMenu {
  companySettings: CompanySettings
  categories: Category[]
  products: Product[]
  highlights: Product[]
}

export function getPublicMenu(storeId: string | null): PublicMenu {
  const companySettings = ensureCompanySettings(storeId ?? 'main')
  const categories = listCategories(storeId, { activeOnly: true })
  const products = findAvailableProducts(storeId)
  const highlights = products.filter(p => p.is_highlighted === 1)
  return { companySettings, categories, products, highlights }
}

export function generateStoreId(): string {
  return uuid()
}
