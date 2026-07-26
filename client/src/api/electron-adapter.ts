import type { Product, Category, Order, DashboardSummary, Customer, ComplementGroup, StoreSettings } from './client'

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean
      products: { list: () => Promise<any[]>; listAll: () => Promise<any[]>; get: (id: string) => Promise<any>; create: (p: any) => Promise<any>; update: (id: string, d: any) => Promise<any>; delete: (id: string) => Promise<any> }
      categories: { list: () => Promise<any[]>; create: (c: any) => Promise<any>; update: (id: string, d: any) => Promise<any>; delete: (id: string) => Promise<any>; reorder: (ids: string[]) => Promise<any> }
      orders: { list: () => Promise<any[]>; get: (id: string) => Promise<any>; create: (o: any) => Promise<any>; updateStatus: (id: string, s: string) => Promise<any> }
      tables: { list: () => Promise<any[]>; create: (n: number) => Promise<any>; update: (id: string, d: any) => Promise<any>; delete: (id: string) => Promise<any> }
      cashRegister: { get: () => Promise<any>; addEntry: (e: any) => Promise<any> }
      inventory: { list: () => Promise<any[]>; upsert: (p: any) => Promise<any>; adjust: (id: string, t: string, q: number, r: string) => Promise<any> }
      complements: { listGroups: (pid?: string) => Promise<any[]>; createGroup: (g: any) => Promise<any>; createItem: (i: any) => Promise<any>; deleteGroup: (id: string) => Promise<any>; deleteItem: (id: string) => Promise<any> }
      customers: { list: () => Promise<any[]>; get: (id: string) => Promise<any>; upsert: (d: any) => Promise<any> }
      fiado: { list: () => Promise<any>; create: (d: any) => Promise<any>; pay: (id: string) => Promise<any> }
      store: { get: () => Promise<any>; update: (d: any) => Promise<any> }
      dashboard: { summary: () => Promise<any> }
      sync: { getStatus: () => Promise<{ pending: number; lastSync: string | null }>; forceSync: () => Promise<any>; pushPending: () => Promise<any>; isOnline: () => Promise<boolean> }
      images: { cache: (url: string) => Promise<string | null>; getCachedPath: (url: string) => Promise<string | null>; clearCache: () => Promise<any> }
      coupons: { list: () => Promise<any[]>; create: (c: any) => Promise<any>; delete: (id: string) => Promise<any> }
      loyalty: { rewards: () => Promise<any[]>; createReward: (r: any) => Promise<any>; deleteReward: (id: string) => Promise<any> }
    }
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: Number(p.price),
    pricePromotional: p.price_promotional || p.pricePromotional || undefined,
    image: p.image || '',
    categoryId: p.category_id || p.categoryId || '',
    categoryName: p.category_name || p.categoryName || '',
    categoryIcon: p.category_icon || p.categoryIcon || '',
    isHighlighted: Boolean(p.is_highlighted ?? p.isHighlighted),
    isAvailable: Boolean(p.is_available ?? p.isAvailable ?? true),
    ingredients: typeof p.ingredients === 'string' ? JSON.parse(p.ingredients || '[]') : (p.ingredients || []),
  }
}

function mapCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon || '📋',
    order: c.order ?? 0,
    isActive: Boolean(c.is_active ?? c.isActive ?? true),
  }
}

function mapOrder(o: any): Order {
  return {
    id: o.id,
    customer_name: o.customer_name || o.customerName || '',
    customer_phone: o.customer_phone || o.customerPhone || '',
    items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
    subtotal: Number(o.subtotal),
    discount: Number(o.discount || 0),
    total: Number(o.total),
    payment_method: o.payment_method || o.paymentMethod || 'cash',
    payment_status: o.payment_status || o.paymentStatus || 'pending',
    status: o.status || 'pending',
    delivery_type: o.delivery_type || o.deliveryType || 'pickup',
    delivery_address: o.delivery_address || o.deliveryAddress || undefined,
    table_number: o.table_number || o.tableNumber || undefined,
    notes: o.notes || undefined,
    scheduled_at: o.scheduled_at || o.scheduledAt || undefined,
    printed: Boolean(o.printed),
    created_at: o.created_at || o.createdAt || new Date().toISOString(),
    updated_at: o.updated_at || o.updatedAt || new Date().toISOString(),
  }
}

export const electronApi = {
  products: {
    list: async (): Promise<Product[]> => {
      const items = await window.electronAPI!.products.list()
      return items.map(mapProduct)
    },
    listAll: async (): Promise<Product[]> => {
      const items = await window.electronAPI!.products.listAll()
      return items.map(mapProduct)
    },
    get: async (id: string): Promise<Product> => {
      const item = await window.electronAPI!.products.get(id)
      return mapProduct(item)
    },
    create: async (product: any): Promise<Product> => {
      const item = await window.electronAPI!.products.create(product)
      return mapProduct(item)
    },
    update: async (id: string, data: any): Promise<Product> => {
      const item = await window.electronAPI!.products.update(id, data)
      return mapProduct(item)
    },
    delete: async (id: string) => {
      return window.electronAPI!.products.delete(id)
    },
  },

  categories: {
    list: async (): Promise<Category[]> => {
      const items = await window.electronAPI!.categories.list()
      return items.map(mapCategory)
    },
    create: async (cat: any): Promise<Category> => {
      const item = await window.electronAPI!.categories.create(cat)
      return mapCategory(item)
    },
    update: async (id: string, data: any): Promise<Category> => {
      const item = await window.electronAPI!.categories.update(id, data)
      return mapCategory(item)
    },
    delete: async (id: string) => {
      return window.electronAPI!.categories.delete(id)
    },
    reorder: async (ids: string[]) => {
      return window.electronAPI!.categories.reorder(ids)
    },
  },

  orders: {
    list: async (): Promise<Order[]> => {
      const items = await window.electronAPI!.orders.list()
      return items.map(mapOrder)
    },
    get: async (id: string): Promise<Order> => {
      const item = await window.electronAPI!.orders.get(id)
      return mapOrder(item)
    },
    create: async (order: any): Promise<Order> => {
      const item = await window.electronAPI!.orders.create(order)
      return mapOrder(item)
    },
    updateStatus: async (id: string, status: string): Promise<Order> => {
      const item = await window.electronAPI!.orders.updateStatus(id, status)
      return mapOrder(item)
    },
  },

  tables: {
    list: () => window.electronAPI!.tables.list(),
    create: (number: number) => window.electronAPI!.tables.create(number),
    update: (id: string, data: any) => window.electronAPI!.tables.update(id, data),
    delete: (id: string) => window.electronAPI!.tables.delete(id),
  },

  cashRegister: {
    get: () => window.electronAPI!.cashRegister.get(),
    addEntry: (entry: any) => window.electronAPI!.cashRegister.addEntry(entry),
  },

  inventory: {
    list: () => window.electronAPI!.inventory.list(),
    upsert: (product: any) => window.electronAPI!.inventory.upsert(product),
    adjust: (productId: string, type: string, quantity: number, reason: string) =>
      window.electronAPI!.inventory.adjust(productId, type, quantity, reason),
  },

  complements: {
    listGroups: (productId?: string) => window.electronAPI!.complements.listGroups(productId),
    createGroup: (group: any) => window.electronAPI!.complements.createGroup(group),
    createItem: (item: any) => window.electronAPI!.complements.createItem(item),
    deleteGroup: (id: string) => window.electronAPI!.complements.deleteGroup(id),
    deleteItem: (id: string) => window.electronAPI!.complements.deleteItem(id),
  },

  customers: {
    list: () => window.electronAPI!.customers.list(),
    get: (id: string) => window.electronAPI!.customers.get(id),
    upsert: (data: any) => window.electronAPI!.customers.upsert(data),
  },

  fiado: {
    list: () => window.electronAPI!.fiado.list(),
    create: (data: any) => window.electronAPI!.fiado.create(data),
    pay: (id: string) => window.electronAPI!.fiado.pay(id),
  },

  store: {
    get: async (): Promise<StoreSettings> => {
      const data = await window.electronAPI!.store.get()
      return {
        storeName: data.store_name || data.storeName || 'Minha Loja',
        storeIcon: data.store_icon || data.storeIcon || '🍔',
        primaryColor: data.primary_color || data.primaryColor || '#e74c3c',
        primaryDark: data.primary_dark || data.primaryDark || '#c0392b',
        paymentPixKey: data.payment_pix_key || data.paymentPixKey || '',
        paymentPixName: data.payment_pix_name || data.paymentPixName || '',
        paymentCardInfo: data.payment_card_info || data.paymentCardInfo || '',
        paymentCashInfo: data.payment_cash_info || data.paymentCashInfo || '',
        footerText: data.footer_text || data.footerText || '',
        schedulingEnabled: Boolean(data.scheduling_enabled ?? data.schedulingEnabled),
        logoUrl: data.logo_url || data.logoUrl || '',
        whatsapp: data.whatsapp || '',
        openingHours: typeof data.opening_hours === 'string' ? JSON.parse(data.opening_hours || '{}') : (data.opening_hours || {}),
        deliveryFee: Number(data.delivery_fee || data.deliveryFee || 0),
        freeDeliveryFrom: Number(data.free_delivery_from || data.freeDeliveryFrom || 0),
        avisos: typeof data.avisos === 'string' ? JSON.parse(data.avisos || '[]') : (data.avisos || []),
      }
    },
    update: (data: any) => window.electronAPI!.store.update(data),
  },

  dashboard: {
    summary: () => window.electronAPI!.dashboard.summary(),
  },

  sync: {
    getStatus: () => window.electronAPI!.sync.getStatus(),
    forceSync: () => window.electronAPI!.sync.forceSync(),
    pushPending: () => window.electronAPI!.sync.pushPending(),
    isOnline: () => window.electronAPI!.sync.isOnline(),
  },

  images: {
    cache: (url: string) => window.electronAPI!.images.cache(url),
    getCachedPath: (url: string) => window.electronAPI!.images.getCachedPath(url),
    clearCache: () => window.electronAPI!.images.clearCache(),
  },

  coupons: {
    list: () => window.electronAPI!.coupons.list(),
    create: (coupon: any) => window.electronAPI!.coupons.create(coupon),
    delete: (id: string) => window.electronAPI!.coupons.delete(id),
  },

  loyalty: {
    rewards: () => window.electronAPI!.loyalty.rewards(),
    createReward: (reward: any) => window.electronAPI!.loyalty.createReward(reward),
    deleteReward: (id: string) => window.electronAPI!.loyalty.deleteReward(id),
  },

  auth: {
    login: (email: string, password: string) => window.electronAPI!.auth.login(email, password),
    register: (payload: any) => window.electronAPI!.auth.register(payload),
    me: (token: string) => window.electronAPI!.auth.me(token),
    changePassword: (currentPassword: string, newPassword: string) => window.electronAPI!.auth.changePassword(currentPassword, newPassword),
  },
}
