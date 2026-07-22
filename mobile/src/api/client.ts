import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.1:3001/api'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface Product {
  id: string; name: string; description: string; price: number
  pricePromotional?: number; image: string; categoryId: string
  categoryName: string; categoryIcon: string; isHighlighted: boolean
  isAvailable: boolean; ingredients: string[]
}

export interface Category {
  id: string; name: string; icon: string; order: number; isActive: boolean
}

export interface ComplementGroup {
  id: string; name: string; type: 'radio' | 'checkbox'; min: number; max: number
  productId: string; isRequired: boolean; items: Complement[]
}
export interface Complement {
  id: string; groupId: string; name: string; price: number; maxExtra: number; isAvailable: boolean
}

export interface Order { id: string; status: string; total: number; created_at: string }

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get('/products'); return data
}
export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get('/products/categories'); return data
}
export async function getComplementGroups(productId: string): Promise<ComplementGroup[]> {
  const { data } = await api.get(`/complements/groups/${productId}`); return data
}
export async function createOrder(order: {
  customerName: string; customerPhone: string; items: any[]
  paymentMethod: string; deliveryType?: string; deliveryAddress?: string; notes?: string
}): Promise<Order> {
  const { data } = await api.post('/orders', order); return data
}
export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get(`/orders/${id}`); return data
}
export async function getStoreSettings() {
  const { data } = await api.get('/store'); return data
}
export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password }); return data
}
export async function getCustomerOrders(phone: string) {
  const { data } = await api.get(`/customers/phone/${phone}/orders`); return data
}