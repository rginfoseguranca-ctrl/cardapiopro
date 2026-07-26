interface ElectronAPI {
  isElectron: boolean
  getVersion: () => Promise<string>
  getPath: (name: string) => Promise<string>
  onMenuEvent: (channel: string, callback: (...args: any[]) => void) => void
  products: {
    list: () => Promise<any[]>
    listAll: () => Promise<any[]>
    get: (id: string) => Promise<any>
    create: (product: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  categories: {
    list: () => Promise<any[]>
    create: (cat: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
    reorder: (ids: string[]) => Promise<any>
  }
  orders: {
    list: () => Promise<any[]>
    get: (id: string) => Promise<any>
    create: (order: any) => Promise<any>
    updateStatus: (id: string, status: string) => Promise<any>
  }
  tables: {
    list: () => Promise<any[]>
    create: (number: number) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  cashRegister: {
    get: () => Promise<any>
    addEntry: (entry: any) => Promise<any>
  }
  inventory: {
    list: () => Promise<any[]>
    upsert: (product: any) => Promise<any>
    adjust: (productId: string, type: string, quantity: number, reason: string) => Promise<any>
  }
  complements: {
    listGroups: (productId?: string) => Promise<any[]>
    createGroup: (group: any) => Promise<any>
    createItem: (item: any) => Promise<any>
    deleteGroup: (id: string) => Promise<any>
    deleteItem: (id: string) => Promise<any>
  }
  customers: {
    list: () => Promise<any[]>
    get: (id: string) => Promise<any>
    upsert: (data: any) => Promise<any>
  }
  fiado: {
    list: () => Promise<any>
    create: (data: any) => Promise<any>
    pay: (id: string) => Promise<any>
  }
  store: {
    get: () => Promise<any>
    update: (data: any) => Promise<any>
  }
  dashboard: {
    summary: () => Promise<any>
  }
  sync: {
    getStatus: () => Promise<{ pending: number; lastSync: string | null }>
    forceSync: () => Promise<any>
    pushPending: () => Promise<any>
    isOnline: () => Promise<boolean>
  }
  images: {
    cache: (url: string) => Promise<string | null>
    getCachedPath: (url: string) => Promise<string | null>
    clearCache: () => Promise<any>
  }
  coupons: {
    list: () => Promise<any[]>
    create: (coupon: any) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  loyalty: {
    rewards: () => Promise<any[]>
    createReward: (reward: any) => Promise<any>
    deleteReward: (id: string) => Promise<any>
  }
}

interface Window {
  electronAPI?: ElectronAPI
}
