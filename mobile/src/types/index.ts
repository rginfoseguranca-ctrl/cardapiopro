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

export interface ComplementGroup {
  id: string
  name: string
  type: 'radio' | 'checkbox'
  min: number
  max: number
  productId: string
  isRequired: boolean
  items: Complement[]
}

export interface Complement {
  id: string
  groupId: string
  name: string
  price: number
  maxExtra: number
  isAvailable: boolean
}

export interface Order {
  id: string
  status: string
  total: number
  items: OrderItem[]
  paymentMethod: string
  deliveryType: string
  deliveryAddress?: string
  tableNumber?: number
  notes?: string
  createdAt: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  complements?: { groupId: string; groupName: string; items: { complementId: string; name: string; price: number }[] }[]
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  storeId: string
}
