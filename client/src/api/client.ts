import axios from 'axios'
import { isElectron, electronApi } from './electron-adapter'

const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
export const api = axios.create({ baseURL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const isDesktop = isElectron()

if (isDesktop) {
  const w = window.electronAPI!
  const methods: Record<string, (...args: any[]) => Promise<any>> = {}

  function matchRoute(method: string, url: string, data?: any, params?: any): Promise<any> | null {
    const clean = url.replace(/^\/api/, '').replace(/^\//, '')

    if (method === 'GET' && clean === 'products/all') return w.products.listAll()
    if (method === 'GET' && clean === 'products') return w.products.list()
    if (method === 'GET' && clean === 'products/highlighted') return w.products.listAll().then((p: any[]) => p.filter((x: any) => x.is_highlighted || x.isHighlighted))
    if (method === 'GET' && clean.startsWith('products/categories')) return w.categories.list()
    if (method === 'GET' && clean.startsWith('products/')) return w.products.get(clean.split('/')[1])
    if (method === 'POST' && clean === 'products') return w.products.create(data)
    if (method === 'POST' && clean === 'products/upload-image') return { imageUrl: `local://images/${data?.name || 'upload'}` }
    if (method === 'PUT' && clean.startsWith('products/categories/')) return w.categories.update(clean.split('/')[2], data)
    if (method === 'POST' && clean === 'products/categories') return w.categories.create(data)
    if (method === 'DELETE' && clean.startsWith('products/categories/')) return w.categories.delete(clean.split('/')[2])
    if (method === 'PUT' && clean.startsWith('products/')) return w.products.update(clean.split('/')[1], data)

    if (method === 'GET' && clean === 'orders') return w.orders.list()
    if (method === 'GET' && clean.startsWith('orders/')) return w.orders.get(clean.split('/')[1])
    if (method === 'POST' && clean === 'orders') return w.orders.create(data)
    if (method === 'PATCH' && clean.match(/^orders\/[^/]+\/status$/)) return w.orders.updateStatus(clean.split('/')[1], data.status)

    if (method === 'GET' && clean === 'dashboard/summary') return w.dashboard.summary()

    if (method === 'GET' && clean === 'store') return w.store.get()
    if (method === 'PUT' && clean === 'store') return w.store.update(data)
    if (method === 'POST' && clean === 'store/logo') return { logoUrl: '' }
    if (method === 'GET' && clean.match(/^store\/pix\//)) return { qrCode: null }

    if (method === 'GET' && clean === 'tables') return w.tables.list()
    if (method === 'POST' && clean === 'tables') return w.tables.create(data.number)
    if (method === 'DELETE' && clean.startsWith('tables/')) return w.tables.delete(clean.split('/')[1])

    if (method === 'GET' && clean === 'cash-register') return w.cashRegister.get()
    if (method === 'POST' && clean === 'cash-register') return w.cashRegister.addEntry(data)

    if (method === 'GET' && clean === 'inventory') return w.inventory.list()
    if (method === 'POST' && clean === 'inventory/product') return w.inventory.upsert(data)
    if (method === 'POST' && clean === 'inventory/adjust') return w.inventory.adjust(data.productId, data.type, data.quantity, data.description || '')

    if (method === 'GET' && clean === 'fiado') return w.fiado.list()
    if (method === 'POST' && clean === 'fiado') return w.fiado.create(data)
    if (method === 'PATCH' && clean.match(/^fiado\/[^/]+\/pay$/)) return w.fiado.pay(clean.split('/')[1])

    if (method === 'GET' && clean === 'coupons') return w.coupons.list()
    if (method === 'POST' && clean === 'coupons') return w.coupons.create(data)
    if (method === 'POST' && clean === 'coupons/validate') return { valid: false, message: 'Cupom indisponível offline' }
    if (method === 'PATCH' && clean.match(/^coupons\/[^/]+\/use$/)) return null
    if (method === 'DELETE' && clean.startsWith('coupons/')) return w.coupons.delete(clean.split('/')[1])

    if (method === 'GET' && clean === 'loyalty/rewards') return w.loyalty.rewards()
    if (method === 'POST' && clean === 'loyalty/rewards') return w.loyalty.createReward(data)
    if (method === 'DELETE' && clean.startsWith('loyalty/rewards/')) return w.loyalty.deleteReward(clean.split('/')[2])
    if (method === 'GET' && clean.startsWith('loyalty/points/')) return { balance: 0 }

    if (method === 'GET' && clean === 'complements/groups') return w.complements.listGroups()
    if (method === 'GET' && clean.startsWith('complements/groups/')) return w.complements.listGroups(clean.split('/')[2])
    if (method === 'POST' && clean === 'complements/groups') return w.complements.createGroup(data)
    if (method === 'DELETE' && clean.startsWith('complements/groups/')) return w.complements.deleteGroup(clean.split('/')[2])
    if (method === 'POST' && clean === 'complements') return w.complements.createItem(data)
    if (method === 'POST' && clean === 'complements/price') return { price: 0 }
    if (method === 'PUT' && clean.startsWith('complements/')) return w.complements.createItem({ ...data, id: clean.split('/')[1] })
    if (method === 'DELETE' && clean.startsWith('complements/')) return w.complements.deleteItem(clean.split('/')[1])

    if (method === 'GET' && clean === 'customers') return w.customers.list()
    if (method === 'GET' && clean.startsWith('customers/')) {
      const parts = clean.split('/')
      if (parts[1] === 'public') return []
      return w.customers.get(parts[1])
    }
    if (method === 'PATCH' && clean.startsWith('customers/')) return w.customers.upsert({ id: clean.split('/')[1], ...data })

    if (method === 'GET' && clean === 'reviews/product/' + (params?.productId || '')) return { reviews: [], averageRating: 0 }
    if (method === 'POST' && clean === 'reviews') return { id: 'local-' + Date.now(), ...data }

    if (method === 'GET' && clean.match(/^finance\//)) return []
    if (method === 'POST' && clean.match(/^finance\//)) return { id: 'local-' + Date.now(), ...data }
    if (method === 'DELETE' && clean.match(/^finance\//)) return null
    if (method === 'PATCH' && clean.match(/^finance\//)) return null

    if (method === 'GET' && clean === 'drivers') return []
    if (method === 'GET' && clean === 'drivers/available') return []
    if (method === 'POST' && clean === 'drivers') return { id: 'local-' + Date.now(), ...data, is_active: true }
    if (method === 'PUT' && clean.startsWith('drivers/')) return data
    if (method === 'DELETE' && clean.startsWith('drivers/')) return null
    if (method === 'PATCH' && clean.startsWith('drivers/')) return data

    if (method === 'GET' && clean === 'stores') return []
    if (method === 'POST' && clean === 'stores') return { id: 'local-' + Date.now(), ...data }
    if (method === 'PUT' && clean.startsWith('stores/')) return data
    if (method === 'DELETE' && clean.startsWith('stores/')) return null

    if (method === 'GET' && clean.startsWith('supplies/')) return []
    if (method === 'POST' && clean.startsWith('supplies/')) return { id: 'local-' + Date.now(), ...data }
    if (method === 'PUT' && clean.startsWith('supplies/')) return data
    if (method === 'DELETE' && clean.startsWith('supplies/')) return null

    if (method === 'GET' && clean.startsWith('delivery')) return []
    if (method === 'POST' && clean.startsWith('delivery')) return { id: 'local-' + Date.now(), ...data }
    if (method === 'PUT' && clean.startsWith('delivery')) return data
    if (method === 'DELETE' && clean.startsWith('delivery')) return null
    if (method === 'PATCH' && clean.startsWith('delivery')) return data

    if (method === 'GET' && clean === 'printers') return []
    if (method === 'POST' && clean === 'printers') return { id: 'local-' + Date.now(), ...data }
    if (method === 'DELETE' && clean.startsWith('printers/')) return null

    if (method === 'GET' && clean === 'campaigns') return []
    if (method === 'POST' && clean === 'campaigns') return { id: 'local-' + Date.now(), ...data }
    if (method === 'DELETE' && clean.startsWith('campaigns/')) return null

    if (method === 'GET' && clean.startsWith('cashback/')) return { balance: 0 }
    if (method === 'POST' && clean === 'cashback/settings') return null

    if (method === 'GET' && clean === 'abandoned') return []
    if (method === 'POST' && clean === 'abandoned') return { id: 'local-' + Date.now(), ...data }
    if (method === 'PATCH' && clean.startsWith('abandoned/')) return data

    if (method === 'GET' && clean === 'integrations') return {}
    if (method === 'POST' && clean === 'integrations') return null

    if (method === 'GET' && clean === 'invoices') return []
    if (method === 'POST' && clean === 'invoices') return { id: 'local-' + Date.now(), ...data }

    if (method === 'GET' && clean === 'blog') return []
    if (method === 'GET' && clean === 'blog/all') return []
    if (method === 'GET' && clean.startsWith('blog/')) return null
    if (method === 'POST' && clean === 'blog') return { id: 'local-' + Date.now(), ...data }
    if (method === 'PATCH' && clean.startsWith('blog/')) return data
    if (method === 'DELETE' && clean.startsWith('blog/')) return null

    if (method === 'GET' && clean === 'partners') return []
    if (method === 'POST' && clean === 'partners') return { id: 'local-' + Date.now(), ...data }

    if (method === 'GET' && clean === 'leads') return []
    if (method === 'POST' && clean === 'leads') return { id: 'local-' + Date.now(), ...data }

    if (method === 'GET' && clean === 'saas/stats') return { stores: { total: 0 }, users: { total: 0 }, orders: { total: 0, recent: [] }, subscriptions: { active: 0, trialing: 0, canceled: 0 }, revenue: { total: 0 } }
    if (method === 'GET' && clean === 'saas/stores') return []
    if (method === 'GET' && clean.startsWith('saas/stores/')) return null
    if (method === 'PUT' && clean.startsWith('saas/stores/')) return data
    if (method === 'DELETE' && clean.startsWith('saas/stores/')) return null
    if (method === 'GET' && clean === 'saas/subscriptions') return []
    if (method === 'GET' && clean === 'saas/analytics') return { revenueByDay: [], ordersByStatus: [], topStores: [], deliveryVsPickup: [], monthlyRevenue: [], storeLimits: [] }

    if (method === 'GET' && clean.startsWith('viacep/')) return null

    if (method === 'POST' && clean === 'auth/login') return w.auth.login(data.email, data.password)
    if (method === 'POST' && clean === 'auth/register') return w.auth.register(data)
    if (method === 'GET' && clean === 'auth/me') return w.auth.me(params?.token || localStorage.getItem('token') || '')
    if (method === 'POST' && clean === 'auth/change-password') return w.auth.changePassword(data.currentPassword, data.newPassword)

    if (method === 'POST' && clean === 'chat') return { reply: 'Chatbot indisponível no modo offline.' }

    return null
  }

  const origGet = api.get.bind(api)
  const origPost = api.post.bind(api)
  const origPut = api.put.bind(api)
  const origDelete = api.delete.bind(api)
  const origPatch = api.patch.bind(api)

  api.get = async (url: string, config?: any) => {
    const result = await matchRoute('GET', url, undefined, config?.params)
    if (result !== null && result !== undefined) return { data: result }
    return origGet(url, config)
  }
  api.post = async (url: string, data?: any, config?: any) => {
    const result = await matchRoute('POST', url, data, config?.params)
    if (result !== null && result !== undefined) return { data: result }
    return origPost(url, data, config)
  }
  api.put = async (url: string, data?: any, config?: any) => {
    const result = await matchRoute('PUT', url, data, config?.params)
    if (result !== null && result !== undefined) return { data: result }
    return origPut(url, data, config)
  }
  api.delete = async (url: string, config?: any) => {
    const result = await matchRoute('DELETE', url, undefined, config?.params)
    if (result !== null && result !== undefined) return { data: result }
    return origDelete(url, config)
  }
  api.patch = async (url: string, data?: any, config?: any) => {
    const result = await matchRoute('PATCH', url, data, config?.params)
    if (result !== null && result !== undefined) return { data: result }
    return origPatch(url, data, config)
  }
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  pricePromotional?: number
  image: string
  categoryId: string
  categoryName: string
  categoryIcon: string
  isHighlighted: boolean
  isAvailable: boolean
  ingredients: string[]
}

export interface Category {
  id: string
  name: string
  icon: string
  order: number
  isActive: boolean
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  complements?: { groupId: string; groupName: string; items: { complementId: string; name: string; price: number }[] }[]
  complementPrice?: number
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  payment_method: string
  payment_status: string
  status: string
  delivery_type: string
  delivery_address?: string
  table_number?: number
  notes?: string
  scheduled_at?: string
  printed: boolean
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  totalOrders: number
  totalRevenue: number
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  ordersByStatus: { status: string; count: number }[]
  ordersByDay: { day: string; count: number; revenue: number }[]
  topProducts: { name: string; total: number }[]
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
  tags?: string[]
  total_orders: number
  total_spent: number
  last_order_at?: string
  created_at: string
}

export interface Review {
  id: string
  product_id: string
  product_name?: string
  customer_name: string
  rating: number
  comment: string
  created_at: string
}

// Products
export async function getProducts(): Promise<Product[]> {
  if (isDesktop) return electronApi.products.list()
  const { data } = await api.get('/products')
  return data
}
export async function getAllProducts(): Promise<Product[]> {
  if (isDesktop) return electronApi.products.listAll()
  const { data } = await api.get('/products/all')
  return data
}
export async function createProduct(product: { name: string; price: number; description?: string; pricePromotional?: number; image?: string; categoryId?: string; isHighlighted?: boolean; isAvailable?: boolean; ingredients?: string[] }): Promise<Product> {
  if (isDesktop) return electronApi.products.create(product)
  const { data } = await api.post('/products', product)
  return data
}
export async function updateProduct(id: string, updates: Partial<Product>) {
  if (isDesktop) return electronApi.products.update(id, updates)
  const { data } = await api.put(`/products/${id}`, updates)
  return data
}
export async function getCategories(): Promise<Category[]> {
  if (isDesktop) return electronApi.categories.list()
  const { data } = await api.get('/products/categories')
  return data
}
export async function createCategory(cat: { name: string; icon?: string }): Promise<Category> {
  if (isDesktop) return electronApi.categories.create(cat)
  const { data } = await api.post('/products/categories', cat)
  return data
}
export async function updateCategory(id: string, cat: { name?: string; icon?: string; order?: number; isActive?: boolean }): Promise<Category> {
  if (isDesktop) return electronApi.categories.update(id, cat)
  const { data } = await api.put(`/products/categories/${id}`, cat)
  return data
}
export async function deleteCategory(id: string) {
  if (isDesktop) return electronApi.categories.delete(id)
  const { data } = await api.delete(`/products/categories/${id}`)
  return data
}
export async function getHighlightedProducts(): Promise<Product[]> {
  if (isDesktop) {
    const all = await electronApi.products.listAll()
    return all.filter(p => p.isHighlighted)
  }
  const { data } = await api.get('/products/highlighted')
  return data
}
export async function uploadProductImage(file: File): Promise<{ imageUrl: string }> {
  if (isDesktop) {
    const path = window.electronAPI!.getPath('userData')
    return { imageUrl: `local://images/${file.name}` }
  }
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await api.post('/products/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data
}

// Orders
export async function createOrder(order: {
  customerName: string
  customerPhone: string
  items: OrderItem[]
  paymentMethod: string
  paymentStatus?: string
  deliveryType?: string
  deliveryAddress?: string
  deliveryFee?: number
  tableNumber?: number
  notes?: string
  scheduledAt?: string
  couponCode?: string
  couponDiscount?: number
}): Promise<Order> {
  if (isDesktop) return electronApi.orders.create(order)
  const { data } = await api.post('/orders', order)
  return data
}
export async function getOrders(): Promise<Order[]> {
  if (isDesktop) return electronApi.orders.list()
  const { data } = await api.get('/orders')
  return data
}
export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  if (isDesktop) return electronApi.orders.updateStatus(id, status)
  const { data } = await api.patch(`/orders/${id}/status`, { status })
  return data
}

// Dashboard
export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (isDesktop) return electronApi.dashboard.summary()
  const { data } = await api.get('/dashboard/summary')
  return data
}

// Customers (CRM)
export async function getCustomers(search?: string, tag?: string, minOrders?: number): Promise<Customer[]> {
  if (isDesktop) return electronApi.customers.list()
  const { data } = await api.get('/customers', { params: { search, tag, minOrders } })
  return data
}
export async function getCustomer(id: string): Promise<Customer & { orders: Order[]; cashback: any[]; loyaltyBalance: number }> {
  if (isDesktop) {
    const customer = await electronApi.customers.get(id)
    return { ...customer, orders: [], cashback: [], loyaltyBalance: 0 }
  }
  const { data } = await api.get(`/customers/${id}`)
  return data
}
export async function updateCustomer(id: string, updates: { notes?: string; tags?: string[] }) {
  if (isDesktop) return electronApi.customers.upsert({ id, ...updates })
  const { data } = await api.patch(`/customers/${id}`, updates)
  return data
}
export async function getCustomerSegmentation() {
  const { data } = await api.get('/customers/stats/segmentation')
  return data
}

// Reviews
export async function getProductReviews(productId: string): Promise<{ reviews: Review[]; averageRating: number }> {
  const { data } = await api.get(`/reviews/product/${productId}`)
  return data
}
export async function createReview(review: { productId: string; customerName: string; rating: number; comment?: string }): Promise<Review> {
  const { data } = await api.post('/reviews', review)
  return data
}

// Chat
export async function sendChatMessage(message: string): Promise<string> {
  const { data } = await api.post('/chat', { message })
  return data.reply
}

// Auth
export async function loginAuth(email: string, password: string) {
  if (isDesktop) return electronApi.auth.login(email, password)
  const { data } = await api.post('/auth/login', { email, password })
  return data
}
export async function getMe() {
  const token = localStorage.getItem('token')
  if (!token) return null
  if (isDesktop) return electronApi.auth.me(token)
  const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
  return data
}

// Loyalty
export async function getLoyaltyPoints(customerId: string) {
  const { data } = await api.get(`/loyalty/points/${customerId}`)
  return data
}
export async function getLoyaltyRewards() {
  if (isDesktop) return electronApi.loyalty.rewards()
  const { data } = await api.get('/loyalty/rewards')
  return data
}
export async function createLoyaltyReward(reward: { name: string; description?: string; pointsRequired: number }) {
  if (isDesktop) return electronApi.loyalty.createReward(reward)
  const { data } = await api.post('/loyalty/rewards', reward)
  return data
}
export async function deleteLoyaltyReward(id: string) {
  if (isDesktop) return electronApi.loyalty.deleteReward(id)
  const { data } = await api.delete(`/loyalty/rewards/${id}`)
  return data
}

// Campaigns (WhatsApp)
export async function getCampaigns() {
  const { data } = await api.get('/campaigns')
  return data
}
export async function createCampaign(campaign: { name: string; message: string; filters?: any }) {
  const { data } = await api.post('/campaigns', campaign)
  return data
}
export async function deleteCampaign(id: string) {
  const { data } = await api.delete(`/campaigns/${id}`)
  return data
}

// Cashback
export async function getCashbackBalance(customerId: string) {
  const { data } = await api.get(`/cashback/balance/${customerId}`)
  return data
}
export async function getCashbackSettings() {
  const { data } = await api.get('/cashback/settings')
  return data
}
export async function setCashbackSettings(percentage: number) {
  const { data } = await api.post('/cashback/settings', { percentage })
  return data
}

// Abandoned Carts
export async function getAbandonedCarts() {
  const { data } = await api.get('/abandoned')
  return data
}
export async function saveAbandonedCart(cart: { customerName?: string; customerPhone?: string; items: any[]; subtotal: number }) {
  const { data } = await api.post('/abandoned', cart)
  return data
}
export async function recoverCart(id: string) {
  const { data } = await api.patch(`/abandoned/${id}/recover`)
  return data
}

// Integrations
export async function getIntegrations() {
  const { data } = await api.get('/integrations')
  return data
}
export async function setIntegration(key: string, value: string) {
  const { data } = await api.post('/integrations', { key, value })
  return data
}

// Cash Register
export async function getCashRegister() {
  if (isDesktop) return electronApi.cashRegister.get()
  const { data } = await api.get('/cash-register')
  return data
}
export async function addCashEntry(entry: { type: string; description: string; amount: number; paymentMethod?: string }) {
  if (isDesktop) return electronApi.cashRegister.addEntry(entry)
  const { data } = await api.post('/cash-register', entry)
  return data
}

// Inventory
export async function getInventory() {
  if (isDesktop) return electronApi.inventory.list()
  const { data } = await api.get('/inventory')
  return data
}
export async function upsertInventoryProduct(item: { productId?: string; productName: string; quantity?: number; unit?: string; minQuantity?: number }) {
  if (isDesktop) return electronApi.inventory.upsert(item)
  const { data } = await api.post('/inventory/product', item)
  return data
}
export async function adjustInventory(productId: string, type: 'in' | 'out', quantity: number, description?: string) {
  if (isDesktop) return electronApi.inventory.adjust(productId, type, quantity, description || '')
  const { data } = await api.post('/inventory/adjust', { productId, type, quantity, description })
  return data
}

// Invoices
export async function getInvoices() {
  const { data } = await api.get('/invoices')
  return data
}
export async function issueInvoice(orderId: string) {
  const { data } = await api.post('/invoices', { orderId })
  return data
}

// Delivery Routes
export async function getDeliveryRoutes() {
  const { data } = await api.get('/delivery')
  return data
}
export async function createDeliveryRoute(route: { orderId?: string; address: string; customerName?: string; customerPhone?: string; driver?: string }) {
  const { data } = await api.post('/delivery', route)
  return data
}
export async function updateDeliveryStatus(id: string, status: string) {
  const { data } = await api.patch(`/delivery/${id}/status`, { status })
  return data
}

// Printers
export async function getPrinters() {
  const { data } = await api.get('/printers')
  return data
}
export async function createPrinter(printer: { name: string; sector?: string }) {
  const { data } = await api.post('/printers', printer)
  return data
}
export async function deletePrinter(id: string) {
  const { data } = await api.delete(`/printers/${id}`)
  return data
}

// Fiado
export async function getFiado() {
  if (isDesktop) return electronApi.fiado.list()
  const { data } = await api.get('/fiado')
  return data
}
export async function createFiado(debt: { customerId?: string; customerName: string; customerPhone?: string; orderId?: string; amount: number; dueDate?: string; notes?: string }) {
  if (isDesktop) return electronApi.fiado.create(debt)
  const { data } = await api.post('/fiado', debt)
  return data
}
export async function payFiado(id: string, amount?: number) {
  if (isDesktop) return electronApi.fiado.pay(id)
  const { data } = await api.patch(`/fiado/${id}/pay`, { amount })
  return data
}

// Blog
export async function getBlogPosts(all?: boolean) {
  const { data } = await api.get(all ? '/blog/all' : '/blog')
  return data
}
export async function getBlogPost(slug: string) {
  const { data } = await api.get(`/blog/${slug}`)
  return data
}
export async function createBlogPost(post: { title: string; slug: string; content?: string; excerpt?: string; image?: string; author?: string }) {
  const { data } = await api.post('/blog', post)
  return data
}
export async function updateBlogPost(id: string, updates: any) {
  const { data } = await api.patch(`/blog/${id}`, updates)
  return data
}
export async function deleteBlogPost(id: string) {
  const { data } = await api.delete(`/blog/${id}`)
  return data
}

// Partners
export async function getPartners() {
  const { data } = await api.get('/partners')
  return data
}
export async function registerPartner(info: { name: string; company?: string; email?: string; phone?: string; city?: string }) {
  const { data } = await api.post('/partners', info)
  return data
}

// Leads
export async function getLeads() {
  const { data } = await api.get('/leads')
  return data
}
export async function submitLead(lead: { name: string; company?: string; email: string; phone?: string; segment?: string; monthlyRevenue?: string }) {
  const { data } = await api.post('/leads', lead)
  return data
}

// Store Settings
export interface StoreSettings {
  storeName: string
  storeIcon: string
  primaryColor: string
  primaryDark: string
  paymentPixKey: string
  paymentPixName: string
  paymentCardInfo: string
  paymentCashInfo: string
  footerText: string
  schedulingEnabled: boolean
  logoUrl: string
  whatsapp: string
  openingHours: Record<string, { open: string; close: string; closed: boolean }>
  deliveryFee: number
  freeDeliveryFrom: number
  avisos?: { id: string; title: string; description: string; imageUrl: string; active: boolean }[]
}
export async function getStoreSettings(): Promise<StoreSettings> {
  if (isDesktop) return electronApi.store.get()
  const { data } = await api.get('/store')
  return data
}
export async function updateStoreSettings(settings: Partial<StoreSettings>) {
  if (isDesktop) return electronApi.store.update(settings)
  const { data } = await api.put('/store', settings)
  return data
}
export async function getPixQrCode(amount: number, orderId: string) {
  const { data } = await api.get(`/store/pix/${amount}/${orderId}`)
  return data
}

// Coupons
export async function getCoupons() {
  if (isDesktop) return electronApi.coupons.list()
  const { data } = await api.get('/coupons')
  return data
}
export async function createCoupon(coupon: {
  code: string; title: string; description?: string
  discountType: string; discountValue: number
  minOrderValue?: number; maxUses?: number
  startsAt?: string; expiresAt?: string
}) {
  if (isDesktop) return electronApi.coupons.create(coupon)
  const { data } = await api.post('/coupons', coupon)
  return data
}
export async function validateCoupon(code: string, orderValue?: number) {
  const { data } = await api.post('/coupons/validate', { code, orderValue })
  return data
}
export async function applyCoupon(id: string) {
  const { data } = await api.patch(`/coupons/${id}/use`)
  return data
}
export async function deleteCoupon(id: string) {
  if (isDesktop) return electronApi.coupons.delete(id)
  const { data } = await api.delete(`/coupons/${id}`)
  return data
}

// Tables (admin)
export async function getTables() {
  if (isDesktop) return electronApi.tables.list()
  const token = localStorage.getItem('token')
  const { data } = await api.get('/tables', { headers: { Authorization: `Bearer ${token}` } })
  return data
}
export async function createTable(number: number) {
  if (isDesktop) return electronApi.tables.create(number)
  const token = localStorage.getItem('token')
  const { data } = await api.post('/tables', { number }, { headers: { Authorization: `Bearer ${token}` } })
  return data
}
export async function deleteTable(id: string) {
  if (isDesktop) return electronApi.tables.delete(id)
  const token = localStorage.getItem('token')
  const { data } = await api.delete(`/tables/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  return data
}

// Complements
export interface ComplementGroup {
  id: string
  name: string
  type: 'radio' | 'checkbox'
  min: number
  max: number
  productId: string
  productName?: string
  isRequired: boolean
  createdAt: string
  items: Complement[]
}
export interface Complement {
  id: string
  groupId: string
  name: string
  price: number
  maxExtra: number
  isAvailable: boolean
  createdAt: string
}
export async function getComplementGroups(productId?: string): Promise<ComplementGroup[]> {
  if (isDesktop) return electronApi.complements.listGroups(productId)
  const url = productId ? `/complements/groups/${productId}` : '/complements/groups'
  const { data } = await api.get(url)
  return data
}
export async function createComplementGroup(data: { name: string; type?: string; min?: number; max?: number; productId: string; isRequired?: boolean }) {
  if (isDesktop) return electronApi.complements.createGroup(data)
  const { data: res } = await api.post('/complements/groups', data)
  return res
}
export async function updateComplementGroup(id: string, data: { name?: string; type?: string; min?: number; max?: number; isRequired?: boolean }) {
  const { data: res } = await api.put(`/complements/groups/${id}`, data)
  return res
}
export async function deleteComplementGroup(id: string) {
  if (isDesktop) return electronApi.complements.deleteGroup(id)
  const { data } = await api.delete(`/complements/groups/${id}`)
  return data
}
export async function createComplement(data: { groupId: string; name: string; price?: number; maxExtra?: number }) {
  if (isDesktop) return electronApi.complements.createItem(data)
  const { data: res } = await api.post('/complements', data)
  return res
}
export async function updateComplement(id: string, data: { name?: string; price?: number; maxExtra?: number; isAvailable?: boolean }) {
  const { data: res } = await api.put(`/complements/${id}`, data)
  return res
}
export async function deleteComplement(id: string) {
  if (isDesktop) return electronApi.complements.deleteItem(id)
  const { data } = await api.delete(`/complements/${id}`)
  return data
}
export async function calculateComplementPrice(complementIds: string[], groupId: string) {
  const { data } = await api.post('/complements/price', { complementIds, groupId })
  return data
}

// Finance
export interface FinancialAccount { id: string; name: string; type: string; bank: string; balance: number; isActive: boolean }
export interface FinancialCategory { id: string; name: string; type: string; icon: string; color: string }
export interface FinancialTransaction {
  id: string; account_id: string; account_name?: string; category_id?: string; category_name?: string
  category_icon?: string; category_color?: string; type: string; description: string; amount: number
  date: string; due_date?: string; paid_date?: string; status: string; payment_method?: string
  notes?: string; order_id?: string; created_at: string
}
export interface FinancialRecurring { id: string; description: string; amount: number; type: string; category_id?: string; category_name?: string; account_id?: string; account_name?: string; frequency: string; interval_days: number; next_due?: string; is_active: boolean }

export async function getFinanceAccounts(): Promise<FinancialAccount[]> {
  const { data } = await api.get('/finance/accounts'); return data
}
export async function createFinanceAccount(acc: { name: string; type?: string; bank?: string }): Promise<FinancialAccount> {
  const { data } = await api.post('/finance/accounts', acc); return data
}
export async function deleteFinanceAccount(id: string) {
  const { data } = await api.delete(`/finance/accounts/${id}`); return data
}
export async function getFinanceCategories(): Promise<FinancialCategory[]> {
  const { data } = await api.get('/finance/categories'); return data
}
export async function createFinanceCategory(cat: { name: string; type?: string; icon?: string; color?: string }): Promise<FinancialCategory> {
  const { data } = await api.post('/finance/categories', cat); return data
}
export async function deleteFinanceCategory(id: string) {
  const { data } = await api.delete(`/finance/categories/${id}`); return data
}
export async function getFinanceTransactions(params?: { startDate?: string; endDate?: string; accountId?: string; categoryId?: string; type?: string; status?: string }): Promise<FinancialTransaction[]> {
  const { data } = await api.get('/finance/transactions', { params }); return data
}
export async function createFinanceTransaction(tx: { accountId: string; categoryId?: string; type?: string; description: string; amount: number; date?: string; dueDate?: string; paidDate?: string; status?: string; paymentMethod?: string; notes?: string; orderId?: string }): Promise<FinancialTransaction> {
  const { data } = await api.post('/finance/transactions', tx); return data
}
export async function deleteFinanceTransaction(id: string) {
  const { data } = await api.delete(`/finance/transactions/${id}`); return data
}
export async function payFinanceTransaction(id: string, paidDate?: string, paymentMethod?: string) {
  const { data } = await api.patch(`/finance/transactions/${id}/pay`, { paidDate, paymentMethod }); return data
}
export async function getFinanceRecurring(): Promise<FinancialRecurring[]> {
  const { data } = await api.get('/finance/recurring'); return data
}
export async function createFinanceRecurring(rec: { description: string; amount: number; type?: string; categoryId?: string; accountId?: string; frequency?: string; intervalDays?: number; nextDue?: string }) {
  const { data } = await api.post('/finance/recurring', rec); return data
}
export async function deleteFinanceRecurring(id: string) {
  const { data } = await api.delete(`/finance/recurring/${id}`); return data
}
export async function getFinanceSummary() {
  const { data } = await api.get('/finance/summary'); return data
}

// Drivers
export interface Driver { id: string; name: string; phone: string; email?: string; vehicle?: string; plate?: string; document?: string; pix_key?: string; status: string; rating: number; total_deliveries: number; notes?: string; is_active: boolean }
export async function getDrivers(): Promise<Driver[]> { const { data } = await api.get('/drivers'); return data }
export async function getAvailableDrivers(): Promise<Driver[]> { const { data } = await api.get('/drivers/available'); return data }
export async function createDriver(d: { name: string; phone: string; email?: string; vehicle?: string; plate?: string; document?: string; pixKey?: string; notes?: string }): Promise<Driver> { const { data } = await api.post('/drivers', d); return data }
export async function updateDriver(id: string, d: any) { const { data } = await api.put(`/drivers/${id}`, d); return data }
export async function deleteDriver(id: string) { const { data } = await api.delete(`/drivers/${id}`); return data }
export async function getDriverDeliveries(driverId?: string, status?: string) { const { data } = await api.get('/drivers/deliveries', { params: { driverId, status } }); return data }
export async function updateDriverDeliveryStatus(id: string, status: string, driver?: string) { const { data } = await api.patch(`/drivers/deliveries/${id}/status`, { status, driver }); return data }
export async function getDriverPerformance() { const { data } = await api.get('/drivers/performance'); return data }

// Stores (Multi-lojas)
export interface Store { id: string; name: string; slug: string; phone: string; address: string; primary_color: string; isActive: boolean }
export async function getStores(): Promise<Store[]> { const { data } = await api.get('/stores'); return data }
export async function createStore(s: { name: string; slug: string; phone?: string; address?: string }): Promise<Store> { const { data } = await api.post('/stores', s); return data }
export async function updateStore(id: string, s: any) { const { data } = await api.put(`/stores/${id}`, s); return data }
export async function deleteStore(id: string) { const { data } = await api.delete(`/stores/${id}`); return data }
export async function getStoreStats(id: string) { const { data } = await api.get(`/stores/${id}/stats`); return data }
export async function getAllStoresSummary() { const { data } = await api.get('/stores/summary/all'); return data }

// Supplies (Estoque Avançado)
export interface Supply { id: string; name: string; unit: string; cost: number; quantity: number; min_quantity: number; notes: string }
export interface RecipeItem { id: string; product_id: string; product_name: string; supply_id: string; supply_name: string; supply_unit: string; supply_cost: number; quantity: number }
export async function getSupplies(): Promise<Supply[]> { const { data } = await api.get('/supplies/supplies'); return data }
export async function createSupply(s: { name: string; unit?: string; cost?: number; quantity?: number; minQuantity?: number; notes?: string }): Promise<Supply> { const { data } = await api.post('/supplies/supplies', s); return data }
export async function updateSupply(id: string, s: any) { const { data } = await api.put(`/supplies/supplies/${id}`, s); return data }
export async function deleteSupply(id: string) { const { data } = await api.delete(`/supplies/supplies/${id}`); return data }
export async function supplyMovement(id: string, type: 'in' | 'out', quantity: number, description?: string) { const { data } = await api.post(`/supplies/supplies/${id}/movement`, { type, quantity, description }); return data }
export async function getRecipe(productId: string) { const { data } = await api.get(`/supplies/recipes/${productId}`); return data }
export async function getRecipes() { const { data } = await api.get('/supplies/recipes'); return data }
export async function createRecipeItem(r: { productId: string; supplyId: string; quantity: number }) { const { data } = await api.post('/supplies/recipes', r); return data }
export async function deleteRecipeItem(id: string) { const { data } = await api.delete(`/supplies/recipes/${id}`); return data }
export async function getCostAnalysis() { const { data } = await api.get('/supplies/cost-analysis'); return data }

// Auth (Register, Password Recovery)
export interface RegisterPayload {
  storeName: string
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  token: string
  user: { id: string; name: string; email: string; role: string }
  store: { id: string; name: string; slug: string }
}

export async function registerStore(payload: RegisterPayload): Promise<RegisterResponse> {
  if (isDesktop) return electronApi.auth.register(payload)
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', { token, newPassword })
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  if (isDesktop) return electronApi.auth.changePassword(currentPassword, newPassword)
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
  return data
}

// ─── SaaS Admin ───
export interface SaaSStats {
  stores: { total: number }
  users: { total: number }
  orders: { total: number; recent: any[] }
  subscriptions: { active: number; trialing: number; canceled: number }
  revenue: { total: number }
}

export interface SaaSStore {
  id: string; name: string; slug: string; phone: string; address: string; primary_color: string; is_active: number; created_at: string
  user_count?: number; order_count?: number; sub_status?: string; sub_plan?: string
}

export interface SAASSubscription {
  id: string; store_id: string; plan: string; status: string; trial_ends_at: string; current_period_end: string; created_at: string
  store_name?: string; store_slug?: string
}

export async function getSAASStats(): Promise<SaaSStats> { const { data } = await api.get('/saas/stats'); return data }
export async function getSaaSStores(): Promise<SaaSStore[]> { const { data } = await api.get('/saas/stores'); return data }
export async function getSaaSStore(id: string): Promise<any> { const { data } = await api.get(`/saas/stores/${id}`); return data }
export async function updateSaaSStore(id: string, store: Partial<SaaSStore>): Promise<any> { const { data } = await api.put(`/saas/stores/${id}`, store); return data }
export async function deleteSaaSStore(id: string): Promise<any> { const { data } = await api.delete(`/saas/stores/${id}`); return data }
export async function getSAASSubscriptions(): Promise<SAASSubscription[]> { const { data } = await api.get('/saas/subscriptions'); return data }

export interface SaaSAnalytics {
  revenueByDay: { date: string; revenue: number; orders: number }[]
  ordersByStatus: { status: string; count: number }[]
  topStores: { name: string; slug: string; revenue: number; orders: number }[]
  deliveryVsPickup: { type: string; count: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
  storeLimits: { name: string; slug: string; plan: string; product_count: number; month_orders: number; user_count: number }[]
}

export async function getSaaSAnalytics(): Promise<SaaSAnalytics> { const { data } = await api.get('/saas/analytics'); return data }

// CEP autocomplete via ViaCEP
export async function fetchCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) return null
  try {
    const { data } = await api.get(`/viacep/${cleanCep}`)
    return data
  } catch {
    return null
  }
}
