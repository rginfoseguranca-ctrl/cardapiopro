import type { Product, Category, Order, StoreSettings } from './client'

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
    barcode: p.barcode || '',
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
    listAllGroups: () => window.electronAPI!.complements.listAllGroups(),
    createGroup: (group: any) => window.electronAPI!.complements.createGroup(group),
    updateGroup: (id: string, data: any) => window.electronAPI!.complements.updateGroup(id, data),
    createItem: (item: any) => window.electronAPI!.complements.createItem(item),
    updateItem: (id: string, data: any) => window.electronAPI!.complements.updateItem(id, data),
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
        isOpen: data.is_open !== undefined ? Boolean(data.is_open) : true,
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
    setServerUrl: (url: string) => window.electronAPI!.sync.setServerUrl(url),
  },

  images: {
    cache: (url: string) => window.electronAPI!.images.cache(url),
    cacheFromBuffer: (name: string, buffer: ArrayBuffer) => window.electronAPI!.images.cacheFromBuffer(name, buffer),
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

  integrations: {
    list: () => window.electronAPI!.integrations.list(),
    save: (key: string, value: string) => window.electronAPI!.integrations.save(key, value),
  },

  auth: {
    login: (email: string, password: string) => window.electronAPI!.auth.login(email, password),
    register: (payload: any) => window.electronAPI!.auth.register(payload),
    me: (token: string) => window.electronAPI!.auth.me(token),
    changePassword: (currentPassword: string, newPassword: string) => window.electronAPI!.auth.changePassword(currentPassword, newPassword),
  },
}
