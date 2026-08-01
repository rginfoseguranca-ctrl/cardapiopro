import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // App info
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getPath: (name: string) => ipcRenderer.invoke('app:get-path', name),
  isElectron: true,

  // Menu events
  onMenuEvent: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },

  // Products
  products: {
    list: () => ipcRenderer.invoke('products:list'),
    listAll: () => ipcRenderer.invoke('products:list-all'),
    get: (id: string) => ipcRenderer.invoke('products:get', id),
    create: (product: any) => ipcRenderer.invoke('products:create', product),
    update: (id: string, data: any) => ipcRenderer.invoke('products:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('products:delete', id),
  },

  // Categories
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    create: (cat: any) => ipcRenderer.invoke('categories:create', cat),
    update: (id: string, data: any) => ipcRenderer.invoke('categories:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('categories:delete', id),
    reorder: (ids: string[]) => ipcRenderer.invoke('categories:reorder', ids),
  },

  // Orders
  orders: {
    list: () => ipcRenderer.invoke('orders:list'),
    get: (id: string) => ipcRenderer.invoke('orders:get', id),
    create: (order: any) => ipcRenderer.invoke('orders:create', order),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke('orders:update-status', id, status),
  },

  // Tables
  tables: {
    list: () => ipcRenderer.invoke('tables:list'),
    create: (number: number) => ipcRenderer.invoke('tables:create', number),
    update: (id: string, data: any) => ipcRenderer.invoke('tables:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('tables:delete', id),
  },

  // Cash Register
  cashRegister: {
    get: () => ipcRenderer.invoke('cash-register:get'),
    addEntry: (entry: any) => ipcRenderer.invoke('cash-register:add-entry', entry),
  },

  // Inventory
  inventory: {
    list: () => ipcRenderer.invoke('inventory:list'),
    upsert: (product: any) => ipcRenderer.invoke('inventory:upsert', product),
    adjust: (productId: string, type: string, quantity: number, reason: string) =>
      ipcRenderer.invoke('inventory:adjust', productId, type, quantity, reason),
  },

  // Complements
  complements: {
    listGroups: (productId?: string) => ipcRenderer.invoke('complements:list-groups', productId),
    listAllGroups: () => ipcRenderer.invoke('complements:list-all-groups'),
    createGroup: (group: any) => ipcRenderer.invoke('complements:create-group', group),
    updateGroup: (id: string, data: any) => ipcRenderer.invoke('complements:update-group', id, data),
    createItem: (item: any) => ipcRenderer.invoke('complements:create-item', item),
    updateItem: (id: string, data: any) => ipcRenderer.invoke('complements:update-item', id, data),
    deleteGroup: (id: string) => ipcRenderer.invoke('complements:delete-group', id),
    deleteItem: (id: string) => ipcRenderer.invoke('complements:delete-item', id),
  },

  // Customers
  customers: {
    list: () => ipcRenderer.invoke('customers:list'),
    get: (id: string) => ipcRenderer.invoke('customers:get', id),
    upsert: (data: any) => ipcRenderer.invoke('customers:upsert', data),
  },

  // Fiado (credit)
  fiado: {
    list: () => ipcRenderer.invoke('fiado:list'),
    create: (data: any) => ipcRenderer.invoke('fiado:create', data),
    pay: (id: string) => ipcRenderer.invoke('fiado:pay', id),
  },

  // Store Settings
  store: {
    get: () => ipcRenderer.invoke('store:get'),
    update: (data: any) => ipcRenderer.invoke('store:update', data),
  },

  // Dashboard
  dashboard: {
    summary: () => ipcRenderer.invoke('dashboard:summary'),
  },

  // Sync
  sync: {
    getStatus: () => ipcRenderer.invoke('sync:get-status'),
    forceSync: () => ipcRenderer.invoke('sync:force'),
    pushPending: () => ipcRenderer.invoke('sync:push-pending'),
    isOnline: () => ipcRenderer.invoke('sync:is-online'),
    setServerUrl: (url: string) => ipcRenderer.invoke('sync:set-server-url', url),
  },

  // Images
  images: {
    cache: (url: string) => ipcRenderer.invoke('images:cache', url),
    cacheFromBuffer: (name: string, buffer: ArrayBuffer) => ipcRenderer.invoke('images:cache-from-buffer', name, buffer),
    getCachedPath: (url: string) => ipcRenderer.invoke('images:get-cached-path', url),
    clearCache: () => ipcRenderer.invoke('images:clear-cache'),
  },

  // Coupons
  coupons: {
    list: () => ipcRenderer.invoke('coupons:list'),
    create: (coupon: any) => ipcRenderer.invoke('coupons:create', coupon),
    delete: (id: string) => ipcRenderer.invoke('coupons:delete', id),
  },

  // Loyalty
  loyalty: {
    rewards: () => ipcRenderer.invoke('loyalty:rewards'),
    createReward: (reward: any) => ipcRenderer.invoke('loyalty:create-reward', reward),
    deleteReward: (id: string) => ipcRenderer.invoke('loyalty:delete-reward', id),
  },

  // Integrations
  integrations: {
    list: () => ipcRenderer.invoke('integrations:list'),
    save: (key: string, value: string) => ipcRenderer.invoke('integrations:save', key, value),
  },

  // Auth (local)
  auth: {
    login: (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
    register: (payload: any) => ipcRenderer.invoke('auth:register', payload),
    me: (token: string) => ipcRenderer.invoke('auth:me', token),
    changePassword: (currentPassword: string, newPassword: string) => ipcRenderer.invoke('auth:change-password', currentPassword, newPassword),
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
