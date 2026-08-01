// Tipos das entidades espelhando os schemas de server/src/database.ts.
// Colunas que existem por convenção (store_id, created_at, updated_at) são
// tipadas aqui; migrar para packages/types no futuro.

export interface Store {
  id: string
  name: string
  slug: string
  phone: string
  address: string
  is_active: number
  created_at: string
}

export interface StoreSetting {
  key: string
  value: string
  store_id: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: string
  must_change_password: number
  created_at: string
  store_id: string
}

export interface CompanySettings {
  id: string
  store_name: string
  store_icon: string
  primary_color: string
  primary_dark: string
  payment_pix_key: string
  payment_pix_name: string
  payment_card_info: string
  payment_cash_info: string
  footer_text: string
  scheduling_enabled: number
  logo_url: string
  whatsapp: string
  opening_hours: string
  delivery_fee: number
  free_delivery_from: number
  avisos: string
  is_open: number
}

export interface Subscription {
  id: string
  store_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: string
  status: string
  trial_ends_at: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  order: number
  is_active: number
  store_id: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  price_promotional: number | null
  image: string
  category_id: string
  is_highlighted: number
  is_available: number
  ingredients: string
  ncm: string
  cest: string
  cst: string
  cfop: string
  barcode: string
  created_at: string
  updated_at: string
  store_id: string
}

export interface OrderItemComplement {
  complementId?: string
  name?: string
  price?: number
}

export interface OrderItemComplementGroup {
  groupId?: string
  name?: string
  items?: OrderItemComplement[]
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice?: number
  complements?: OrderItemComplementGroup[]
  [key: string]: any
}

export interface Order {
  id: string
  customer_id: string | null
  customer_name: string
  customer_phone: string
  items: string
  subtotal: number
  discount: number
  delivery_fee: number
  total: number
  payment_method: string
  payment_status: string
  status: string
  delivery_type: string
  delivery_address: string | null
  table_number: number | null
  notes: string | null
  scheduled_at: string | null
  printed: number
  created_at: string
  updated_at: string
  store_id: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  notes: string
  tags: string
  total_orders: number
  total_spent: number
  last_order_at: string | null
  created_at: string
  updated_at: string
  store_id: string
}

export interface Coupon {
  id: string
  code: string
  title: string
  description: string
  discount_type: string
  discount_value: number
  min_order_value: number
  max_uses: number
  used_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: number
  created_at: string
  store_id: string
}

export interface Promotion {
  id: string
  title: string
  description: string
  discount_type: string
  discount_value: number
  product_ids: string
  starts_at: string | null
  ends_at: string | null
  is_active: number
  store_id: string
}

export interface Combo {
  id: string
  name: string
  description: string
  image: string
  items: string
  original_price: number
  combo_price: number
  is_active: number
  store_id: string
}

export interface ComplementGroup {
  id: string
  name: string
  type: string
  min: number
  max: number
  product_id: string
  is_required: number
  created_at: string
  store_id: string
}

export interface Complement {
  id: string
  group_id: string
  name: string
  price: number
  max_extra: number
  is_available: number
  created_at: string
  store_id: string
}

export interface Table {
  id: string
  number: number
  is_active: number
  is_occupied: number
  customer_name: string | null
  customer_phone: string | null
  created_at: string
  updated_at: string
  store_id: string
}

export interface CashRegisterEntry {
  id: string
  type: string
  description: string
  amount: number
  payment_method: string
  order_id: string | null
  created_at: string
  store_id: string
}

export interface FinancialAccount {
  id: string
  name: string
  type: string
  bank: string
  balance: number
  is_active: number
  created_at: string
  store_id: string
}

export interface FinancialCategory {
  id: string
  name: string
  type: string
  icon: string
  color: string
  created_at: string
  store_id: string
}

export interface FinancialTransaction {
  id: string
  account_id: string
  category_id: string | null
  type: string
  description: string
  amount: number
  date: string
  due_date: string | null
  paid_date: string | null
  status: string
  payment_method: string
  notes: string
  recurring_id: string | null
  order_id: string | null
  attachment: string
  created_at: string
  store_id: string
}

export interface FinancialRecurring {
  id: string
  description: string
  amount: number
  type: string
  category_id: string | null
  account_id: string | null
  frequency: string
  interval_days: number
  next_due: string | null
  is_active: number
  created_at: string
  store_id: string
}

export interface InventoryItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit: string
  min_quantity: number
  updated_at: string
  store_id: string
}

export interface InventoryMovement {
  id: string
  product_id: string
  type: string
  quantity: number
  description: string
  created_at: string
  store_id: string
}

export interface Supply {
  id: string
  name: string
  unit: string
  cost: number
  quantity: number
  min_quantity: number
  notes: string
  created_at: string
  store_id: string
}

export interface RecipeItem {
  id: string
  product_id: string
  supply_id: string
  quantity: number
  created_at: string
  store_id: string
}

export interface SupplyMovement {
  id: string
  supply_id: string
  type: string
  quantity: number
  description: string
  created_at: string
  store_id: string
}

export interface LoyaltyPoint {
  id: string
  customer_id: string
  points: number
  order_id: string | null
  description: string
  created_at: string
  store_id: string
}

export interface LoyaltyReward {
  id: string
  name: string
  description: string
  points_required: number
  is_active: number
  created_at: string
  store_id: string
}

export interface CashbackTransaction {
  id: string
  customer_id: string
  order_id: string | null
  amount: number
  status: string
  created_at: string
  store_id: string
}
