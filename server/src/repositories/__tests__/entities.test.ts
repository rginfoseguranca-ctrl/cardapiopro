import { describe, it, expect, beforeAll } from 'vitest'
import { DbHandle } from '../db'
import { createRepository, BaseRepository } from '../base'
import { createMemoryDb } from './helpers'
import { averageRatingByProduct } from '../reviews'
import { findBlogBySlug } from '../blog-posts'
import { nextNfeNumber } from '../invoices'
import { findPaymentWebhook } from '../payment-webhooks'
import { totalPendingByCustomer } from '../fiado'
import { BlogPost, Review, FiadoEntry, Invoice, PaymentWebhook } from '../types'

const SCHEMA = [
  `CREATE TABLE reviews (id TEXT PRIMARY KEY, product_id TEXT, customer_name TEXT, rating INTEGER, comment TEXT, store_id TEXT DEFAULT 'main')`,
  `CREATE TABLE abandoned_carts (id TEXT PRIMARY KEY, customer_phone TEXT, customer_name TEXT, items TEXT, subtotal REAL, status TEXT, store_id TEXT DEFAULT 'main')`,
  `CREATE TABLE blog_posts (id TEXT PRIMARY KEY, title TEXT, slug TEXT, content TEXT, excerpt TEXT, image TEXT, author TEXT, is_published INTEGER, published_at TEXT, store_id TEXT DEFAULT 'main')`,
  `CREATE TABLE partners (id TEXT PRIMARY KEY, name TEXT, company TEXT, email TEXT, phone TEXT, city TEXT)`,
  `CREATE TABLE leads (id TEXT PRIMARY KEY, name TEXT, company TEXT, email TEXT, phone TEXT, segment TEXT, monthly_revenue TEXT)`,
  `CREATE TABLE invoices (id TEXT PRIMARY KEY, order_id TEXT, status TEXT, nfe_number TEXT, xml_url TEXT, store_id TEXT DEFAULT 'main')`,
  `CREATE TABLE payment_webhooks (id TEXT PRIMARY KEY, provider TEXT, order_id TEXT, payment_id TEXT, status TEXT, payload TEXT, store_id TEXT DEFAULT 'main')`,
  `CREATE TABLE fiado (id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT, customer_phone TEXT, order_id TEXT, amount REAL, paid_amount REAL, status TEXT, due_date TEXT, notes TEXT, store_id TEXT DEFAULT 'main')`,
  `CREATE TABLE campaigns (id TEXT PRIMARY KEY, name TEXT, message TEXT, filters TEXT, status TEXT, sent_count INTEGER, is_active INTEGER, store_id TEXT DEFAULT 'main')`,
  `CREATE TABLE delivery_areas (id TEXT PRIMARY KEY, name TEXT, base_fee REAL, free_delivery_from REAL, radius REAL, active INTEGER, store_id TEXT DEFAULT 'main')`,
]

describe('repositorios novos (entidades)', () => {
  let db: DbHandle
  let reviews: BaseRepository<Review>
  let abandonedCarts: BaseRepository<Record<string, any>>
  let blogPosts: BaseRepository<BlogPost>
  let partners: BaseRepository<Record<string, any>>
  let leads: BaseRepository<Record<string, any>>
  let invoices: BaseRepository<Invoice>
  let paymentWebhooks: BaseRepository<PaymentWebhook>
  let fiado: BaseRepository<FiadoEntry>
  let campaigns: BaseRepository<Record<string, any>>
  let deliveryAreas: BaseRepository<Record<string, any>>

  beforeAll(async () => {
    db = await createMemoryDb(SCHEMA)
    reviews = createRepository('reviews', { columns: ['product_id', 'customer_name', 'rating', 'comment'] }, db)
    abandonedCarts = createRepository('abandoned_carts', { columns: ['customer_phone', 'customer_name', 'items', 'subtotal', 'status'] }, db)
    blogPosts = createRepository('blog_posts', { columns: ['title', 'slug', 'content', 'excerpt', 'image', 'author', 'is_published', 'published_at'] }, db)
    partners = createRepository('partners', { scoped: false, columns: ['name', 'company', 'email', 'phone', 'city'] }, db)
    leads = createRepository('leads', { scoped: false, columns: ['name', 'company', 'email', 'phone', 'segment', 'monthly_revenue'] }, db)
    invoices = createRepository('invoices', { columns: ['order_id', 'status', 'nfe_number', 'xml_url'] }, db)
    paymentWebhooks = createRepository('payment_webhooks', { columns: ['provider', 'order_id', 'payment_id', 'status', 'payload'] }, db)
    fiado = createRepository('fiado', { columns: ['customer_id', 'customer_name', 'customer_phone', 'order_id', 'amount', 'paid_amount', 'status', 'due_date', 'notes'] }, db)
    campaigns = createRepository('campaigns', { columns: ['name', 'message', 'filters', 'status', 'sent_count', 'is_active'] }, db)
    deliveryAreas = createRepository('delivery_areas', { columns: ['name', 'base_fee', 'free_delivery_from', 'radius', 'active'] }, db)
  })

  it('partners e leads são globais (sem escopo)', () => {
    partners.insert(null, { id: 'pt-1', name: 'Parceiro', company: 'ACME' })
    leads.insert(null, { id: 'ld-1', name: 'Lead', email: 'l@x.com' })
    expect(partners.findById(null, 'pt-1')?.name).toBe('Parceiro')
    expect(leads.findAll(null).length).toBe(1)
  })

  it('campaigns respeita escopo por loja', () => {
    campaigns.insert('storeA', { id: 'cmp-a', name: 'A', message: 'x', filters: '{}', status: 'draft' })
    campaigns.insert('storeB', { id: 'cmp-b', name: 'B', message: 'x', filters: '{}', status: 'draft' })
    expect(campaigns.findById('storeA', 'cmp-b')).toBeNull()
    expect(campaigns.findAll('storeA').map(r => r.id)).toEqual(['cmp-a'])
  })

  it('abandoned_carts isola por loja', () => {
    abandonedCarts.insert('storeA', { id: 'ab-a', items: '[]', subtotal: 10, status: 'abandoned' })
    abandonedCarts.insert('storeB', { id: 'ab-b', items: '[]', subtotal: 20, status: 'abandoned' })
    expect(abandonedCarts.findAll('storeA').map(r => r.id)).toEqual(['ab-a'])
    expect(abandonedCarts.findById('storeB', 'ab-a')).toBeNull()
  })

  it('blog: findBlogBySlug escopado', () => {
    blogPosts.insert('storeA', { id: 'b-a', title: 'A', slug: 'slug-a', content: '' })
    blogPosts.insert('storeB', { id: 'b-b', title: 'B', slug: 'slug-a', content: '' })
    expect(findBlogBySlug('storeA', 'slug-a', blogPosts)?.id).toBe('b-a')
    expect(findBlogBySlug('storeB', 'slug-a', blogPosts)?.id).toBe('b-b')
  })

  it('reviews: averageRatingByProduct por loja', () => {
    reviews.insert('storeA', { id: 'r-a1', product_id: 'p1', customer_name: 'Ana', rating: 4, comment: '' })
    reviews.insert('storeA', { id: 'r-a2', product_id: 'p1', customer_name: 'Bia', rating: 2, comment: '' })
    reviews.insert('storeB', { id: 'r-b1', product_id: 'p1', customer_name: 'Cia', rating: 5, comment: '' })
    expect(averageRatingByProduct('storeA', 'p1', reviews)).toBe(3)
    expect(averageRatingByProduct('storeB', 'p1', reviews)).toBe(5)
  })

  it('fiado: totalPendingByCustomer por loja', () => {
    fiado.insert('storeA', { id: 'f-a1', customer_id: 'c1', customer_name: 'Ana', amount: 100, paid_amount: 30, status: 'partial' })
    fiado.insert('storeA', { id: 'f-a2', customer_id: 'c1', customer_name: 'Ana', amount: 10, paid_amount: 10, status: 'paid' })
    fiado.insert('storeB', { id: 'f-b1', customer_id: 'c1', customer_name: 'Ana', amount: 500, paid_amount: 0, status: 'pending' })
    expect(totalPendingByCustomer('storeA', 'c1', fiado)).toBe(70)
    expect(totalPendingByCustomer('storeB', 'c1', fiado)).toBe(500)
  })

  it('invoices: nextNfeNumber ignora não-numérico e isola por loja', () => {
    invoices.insert('storeA', { id: 'inv-1', order_id: 'o1', status: 'pending', nfe_number: 'NF-00042' })
    invoices.insert('storeA', { id: 'inv-2', order_id: 'o2', status: 'pending', nfe_number: '007' })
    invoices.insert('storeB', { id: 'inv-3', order_id: 'o3', status: 'pending', nfe_number: '999' })
    expect(nextNfeNumber('storeA', invoices)).toBe(42)
    expect(nextNfeNumber('storeB', invoices)).toBe(999)
  })

  it('payment-webhooks: findPaymentWebhook por provider', () => {
    paymentWebhooks.insert('storeA', { id: 'w-1', provider: 'mp', order_id: 'o1', status: 'approved', payload: '{}' })
    paymentWebhooks.insert('storeA', { id: 'w-2', provider: 'asaas', order_id: 'o1', status: 'pending', payload: '{}' })
    expect(findPaymentWebhook('storeA', 'o1', 'mp', paymentWebhooks)?.id).toBe('w-1')
    expect(findPaymentWebhook('storeA', 'o1', 'asaas', paymentWebhooks)?.id).toBe('w-2')
  })

  it('delivery-areas: whitelist bloqueia colunas protegidas', () => {
    const before = db.all('SELECT COUNT(*) AS c FROM delivery_areas')
    deliveryAreas.update('storeA', 'nope', { store_id: 'storeB', id: 'x' } as any)
    expect(db.all('SELECT COUNT(*) AS c FROM delivery_areas')).toEqual(before)
  })
})
