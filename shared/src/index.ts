// ==================== Product ====================
export interface Product {
  id: string
  name: string
  description: string
  price: number
  pricePromotional?: number
  image: string
  categoryId: string
  highlights?: string[]
  isHighlighted: boolean
  isAvailable: boolean
  ingredients: string[]
  createdAt: string
  updatedAt: string
}

// ==================== Category ====================
export interface Category {
  id: string
  name: string
  icon: string
  order: number
  isActive: boolean
}

// ==================== Order ====================
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash' | 'meal_ticket'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

export interface Order {
  id: string
  customerId?: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  deliveryType: 'pickup' | 'delivery' | 'mesa' | 'balcao'
  deliveryAddress?: string
  tableNumber?: number
  notes?: string
  scheduledAt?: string
  printed: boolean
  createdAt: string
  updatedAt: string
}

// ==================== Customer ====================
export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  totalOrders: number
  totalSpent: number
  createdAt: string
}

// ==================== Promotion ====================
export interface Promotion {
  id: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  productIds: string[]
  startsAt: string
  endsAt: string
  isActive: boolean
}

// ==================== Combo ====================
export interface Combo {
  id: string
  name: string
  description: string
  image: string
  items: { productId: string; quantity: number }[]
  originalPrice: number
  comboPrice: number
  isActive: boolean
}

// ==================== Review ====================
export interface Review {
  id: string
  productId: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
}

// ==================== Store Settings ====================
export interface StoreSettings {
  storeName: string
  logo: string
  primaryColor: string
  phone: string
  whatsapp: string
  instagram: string
  address: string
  openingHours: string
  deliveryFee: number
  freeDeliveryFrom: number
  pixKey?: string
  aboutUs: string
}

export interface Coupon {
  id: string
  code: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderValue: number
  maxUses: number
  usedCount: number
  startsAt: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  createdAt: string
}

export interface Table {
  id: string
  number: number
  isActive: boolean
  createdAt: string
}

export interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsRequired: number
  isActive: boolean
}

export interface CashbackSettings {
  percentage: number
  minOrderValue: number
}

// ==================== Complement Groups & Complements ====================
export type ComplementType = 'radio' | 'checkbox'

export interface ComplementGroup {
  id: string
  name: string
  type: ComplementType
  min: number
  max: number
  productId: string
  isRequired: boolean
  createdAt: string
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

export interface CartItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  complements?: { groupId: string; groupName: string; items: { complementId: string; name: string; price: number }[] }[]
  complementPrice?: number
}
