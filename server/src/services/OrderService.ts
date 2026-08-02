import { v4 as uuid } from 'uuid'
import { ordersRepository, listOrders as repoListOrders, countOrdersInMonth, findOrderById, parseItems } from '../repositories/orders'
import { Order } from '../repositories/types'
import { findCatalogProductById } from '../repositories/products'
import { complementsRepository } from '../repositories/complements'
import { customersRepository, findCustomerByPhone } from '../repositories/customers'
import { findSubscriptionByStore } from '../repositories/global'
import { getStoreSetting, companySettingsRepository } from '../repositories/fixtures'
import { PLANS } from '../routes/billing'
import { generateKitchenReceipt } from '../routes/printers'
import { notifyAll, notifyOrder } from '../routes/notifications'
import { cashRegisterRepository } from '../repositories/cash-register'
import {
  financialAccountsRepository, financialCategoriesRepository, financialTransactionsRepository,
  findAccountByName, findCategoryByName, findTransactionByOrder,
} from '../repositories/finance'
import { suppliesRepository, supplyMovementsRepository, findRecipeByProduct } from '../repositories/supplies'
import { loyaltyPointsRepository, cashbackTransactionsRepository } from '../repositories/loyalty'
import { findActiveKitchenPrinter } from '../repositories/printers'
import {
  deliveryRoutesRepository, driversRepository, nextRouteSequence,
  findPendingRouteByOrder, findRouteByOrder, findAvailableDriver, findDriverByName,
} from '../repositories/delivery'
import { httpError } from './http'

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']

export function parseOrder(order: Order): Record<string, any> {
  return { ...order, items: parseItems(order), printed: !!order.printed }
}

export function publicOrder(order: Order | null): Record<string, any> | null {
  if (!order) return null
  return {
    id: order.id,
    status: order.status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    delivery_type: order.delivery_type,
    table_number: order.table_number,
    subtotal: order.subtotal,
    discount: order.discount,
    delivery_fee: order.delivery_fee,
    total: order.total,
    scheduled_at: order.scheduled_at,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: parseItems(order),
    printed: !!order.printed,
  }
}

// ───── Cash Register / Finance Helper ─────
function registerOrderFinancials(storeId: string, order: Order): void {
  const { id: orderId, total, payment_method, customer_name, payment_status } = order

  // Ensure default financial account exists
  let caixaAccount: { id: string } | null = findAccountByName(storeId, 'Caixa PDV')
  if (!caixaAccount) {
    const accId = 'acc_' + uuid()
    financialAccountsRepository.insert(storeId, { id: accId, name: 'Caixa PDV', type: 'checking', balance: 0, is_active: 1 })
    caixaAccount = { id: accId }
  }

  // Ensure default income category exists
  let vendaCategory: { id: string } | null = findCategoryByName(storeId, 'Vendas', 'income')
  if (!vendaCategory) {
    const catId = 'cat_' + uuid()
    financialCategoriesRepository.insert(storeId, { id: catId, name: 'Vendas', type: 'income', icon: '💵', color: '#27ae60' })
    vendaCategory = { id: catId }
  }

  // Cash register entry (idempotent)
  const existingCash = cashRegisterRepository.findOne(storeId, 'order_id = ?', [orderId])
  if (!existingCash && payment_status === 'paid') {
    cashRegisterRepository.insert(storeId, {
      id: 'cr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: 'income',
      description: `Pedido #${orderId.slice(0, 8).toUpperCase()} - ${customer_name}`,
      amount: total,
      payment_method,
      order_id: orderId,
    })
  }

  // Financial transaction (idempotent)
  const existingTxn = findTransactionByOrder(storeId, orderId)
  if (!existingTxn && payment_status === 'paid' && caixaAccount && vendaCategory) {
    financialTransactionsRepository.insert(storeId, {
      id: 'txn_' + uuid(),
      account_id: caixaAccount.id,
      category_id: vendaCategory.id,
      type: 'income',
      description: `Pedido #${orderId.slice(0, 8).toUpperCase()} - ${customer_name}`,
      amount: total,
      status: 'paid',
      payment_method,
      order_id: orderId,
    })
  }
}

// Check if store is open based on opening_hours setting
function isStoreOpen(storeId: string = 'main'): boolean {
  const store = companySettingsRepository.findById(null, storeId)
  if (!store || !store.opening_hours) return true // If not configured, assume open

  try {
    const hours = JSON.parse(store.opening_hours)
    if (Object.keys(hours).length === 0) return true

    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = dayNames[now.getDay()]
    const todayHours = hours[today]

    if (!todayHours || todayHours.closed) return false

    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [openH, openM] = todayHours.open.split(':').map(Number)
    const [closeH, closeM] = todayHours.close.split(':').map(Number)
    const openTime = openH * 60 + openM
    const closeTime = closeH * 60 + closeM

    return currentTime >= openTime && currentTime < closeTime
  } catch {
    return true
  }
}

// Helper function to decrement inventory based on order items
function decrementInventory(storeId: string, items: any[]): void {
  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0))
    if (!qty) continue
    const recipeItems = findRecipeByProduct(storeId, item.productId)
    for (const recipeItem of recipeItems) {
      if (!recipeItem.supply_id) continue
      const quantityNeeded = (Number(recipeItem.quantity) || 0) * qty
      const supply = suppliesRepository.findById(storeId, recipeItem.supply_id)
      if (supply) {
        suppliesRepository.update(storeId, recipeItem.supply_id, {
          quantity: (Number(supply.quantity) || 0) - quantityNeeded,
        })
      }
      supplyMovementsRepository.insert(storeId, {
        id: 'mov_' + uuid(),
        supply_id: recipeItem.supply_id,
        type: 'out',
        quantity: quantityNeeded,
        description: `Pedido ${item.productName} x${qty}`,
      })
    }
  }
}

// Revalidates order items against the catalog (price integrity)
function validateItems(storeId: string, items: any[]): any[] {
  const validated: any[] = []
  for (const raw of items || []) {
    if (!raw || !raw.productId) continue
    const product = findCatalogProductById(storeId, raw.productId)
    if (!product || !product.is_available) {
      throw httpError(400, `Produto indisponível: ${raw.productName || raw.productId}`)
    }
    const qty = Math.max(1, Math.floor(Number(raw.quantity) || 1))
    const basePrice = product.price_promotional != null &&
      Number(product.price_promotional) >= 0 && Number(product.price_promotional) < Number(product.price)
      ? Number(product.price_promotional)
      : Number(product.price)

    let complementSum = 0
    for (const group of Array.isArray(raw.complements) ? raw.complements : []) {
      for (const ci of Array.isArray(group.items) ? group.items : []) {
        const comp = ci && ci.complementId ? complementsRepository.findById(storeId, ci.complementId) : null
        complementSum += comp ? Number(comp.price) || 0 : 0
      }
    }

    const unitPrice = Number((basePrice + complementSum).toFixed(2))
    validated.push({
      ...raw,
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: qty,
      totalPrice: Number((unitPrice * qty).toFixed(2)),
    })
  }
  return validated
}

export function listOrders(storeId: string | null, since?: string): Record<string, any>[] {
  return repoListOrders(storeId, since).map(parseOrder)
}

export function getOrderById(storeId: string | null, id: string): Order | null {
  return findOrderById(storeId, id)
}

export interface CreateOrderInput {
  customerName: string
  customerPhone: string
  items: any[]
  paymentMethod: string
  paymentStatus?: string
  deliveryType?: string
  deliveryAddress?: string
  deliveryFee?: number
  tableNumber?: number | null
  notes?: string
  scheduledAt?: string
  couponCode?: string
  couponDiscount?: number
  discount?: number
}

export function createOrder(storeId: string, input: CreateOrderInput): Record<string, any> {
  const {
    customerName, customerPhone, items, paymentMethod, paymentStatus, deliveryType,
    deliveryAddress, deliveryFee, tableNumber, notes, scheduledAt, couponDiscount, discount: manualDiscount,
  } = input

  if (!customerName || !customerPhone || !items?.length || !paymentMethod) {
    throw httpError(400, 'Dados obrigatórios faltando')
  }

  const sub = findSubscriptionByStore(storeId)
  const planKey = sub?.plan || 'start'
  const plan = PLANS[planKey] || PLANS.start
  if (plan.maxOrdersMonth > 0) {
    const monthCount = countOrdersInMonth(storeId)
    if (monthCount >= plan.maxOrdersMonth) {
      const err = httpError(403, `Limite de ${plan.maxOrdersMonth} pedidos/mês atingido. Atualize seu plano.`)
      ;(err as any).limitType = 'orders'
      throw err
    }
  }

  // Check if store is open (except for scheduled orders)
  if (!scheduledAt && !isStoreOpen(storeId)) {
    throw httpError(400, 'Loja fechada no momento. Pedidos só podem ser feitos no horário de funcionamento.')
  }

  const validatedItems = validateItems(storeId, items)
  if (!validatedItems.length) {
    throw httpError(400, 'Nenhum produto válido no pedido')
  }

  const subtotal = validatedItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0)
  const discount = Math.min((Number(manualDiscount) || 0) + (Number(couponDiscount) || 0), subtotal)
  const fee = Math.max(0, Number(deliveryFee) || 0)
  const total = Number((Math.max(0, subtotal + fee - discount)).toFixed(2))

  // Get or create customer first
  let customer = findCustomerByPhone(storeId, customerPhone)
  let customerId: string
  if (customer) {
    customerId = customer.id
    customersRepository.update(storeId, customerId, {
      total_orders: (Number(customer.total_orders) || 0) + 1,
      total_spent: (Number(customer.total_spent) || 0) + total,
      last_order_at: new Date().toISOString(),
    })
  } else {
    customerId = uuid()
    customersRepository.insert(storeId, {
      id: customerId,
      name: customerName,
      phone: customerPhone,
      total_orders: 1,
      total_spent: total,
      last_order_at: new Date().toISOString(),
    })
  }

  const id = uuid()
  const now = new Date().toISOString()

  ordersRepository.insert(storeId, {
    id,
    customer_id: customerId,
    customer_name: customerName,
    customer_phone: customerPhone,
    items: JSON.stringify(validatedItems),
    subtotal,
    discount,
    delivery_fee: fee,
    total,
    payment_method: paymentMethod,
    payment_status: paymentStatus || 'pending',
    status: 'pending',
    delivery_type: deliveryType || 'pickup',
    delivery_address: deliveryAddress || '',
    table_number: tableNumber || null,
    notes: notes || '',
    scheduled_at: scheduledAt || null,
    created_at: now,
    updated_at: now,
  })

  const order = findOrderById(storeId, id)
  if (!order) throw httpError(500, 'Erro ao criar pedido')

  // Decrement inventory
  try {
    decrementInventory(storeId, validatedItems)
  } catch (err) {
    console.error('Error decrementing inventory:', err)
  }

  notifyAll({ type: 'new_order', order: { id, total, deliveryType } }, storeId)

  // Award loyalty points on order creation
  try {
    const loyaltySetting = getStoreSetting(storeId, 'loyalty_points_per_real')
    const pointsPerReal = loyaltySetting ? parseFloat(loyaltySetting) : 1
    const pointsEarned = Math.floor(total * pointsPerReal)

    if (pointsEarned > 0 && customerId) {
      loyaltyPointsRepository.insert(storeId, {
        id: 'lp_' + uuid(),
        customer_id: customerId,
        order_id: id,
        points: pointsEarned,
        description: `Pedido #${id.slice(0, 8)}`,
      })
    }
  } catch (err) {
    console.error('Loyalty points error:', err)
  }

  // Award cashback on order creation (configurable)
  try {
    const cashbackSetting = getStoreSetting(storeId, 'cashback_on_create')
    const cashbackOnCreate = cashbackSetting ? parseInt(cashbackSetting) === 1 : false

    if (cashbackOnCreate && customerId) {
      const cashbackPctRow = getStoreSetting(storeId, 'cashback_percentage')
      const pct = cashbackPctRow ? parseFloat(cashbackPctRow) : 5
      const cashbackAmount = total * (pct / 100)

      cashbackTransactionsRepository.insert(storeId, {
        id: 'cb_' + uuid(),
        customer_id: customerId,
        order_id: id,
        amount: cashbackAmount,
        status: 'available',
      })
    }
  } catch (err) {
    console.error('Cashback error:', err)
  }

  // Auto-print to kitchen printer
  try {
    const kitchenPrinter = findActiveKitchenPrinter(storeId)
    if (kitchenPrinter) {
      const store = companySettingsRepository.findById(null, storeId)
      generateKitchenReceipt(order, store, kitchenPrinter.name)
      ordersRepository.update(storeId, id, { printed: 1 })
    }
  } catch (err) {
    console.error('Auto-print error:', err)
  }

  // Register cash register & financial transaction
  try {
    registerOrderFinancials(storeId, order)
  } catch (err) {
    console.error('Cash register/finance error:', err)
  }

  return parseOrder(order)
}

function handleDeliveryStatus(storeId: string, prevOrder: Order, status: string): void {
  // When confirmed → auto-create delivery route
  if (status === 'confirmed' && prevOrder.delivery_type === 'delivery' && prevOrder.delivery_address) {
    try {
      const seq = nextRouteSequence(storeId)
      const routeId = 'dr_' + Date.now()
      deliveryRoutesRepository.insert(storeId, {
        id: routeId,
        order_id: prevOrder.id,
        address: prevOrder.delivery_address,
        customer_name: prevOrder.customer_name,
        customer_phone: prevOrder.customer_phone,
        sequence: seq,
        status: 'pending',
      })
    } catch (err) {
      console.error('Delivery route creation error:', err)
    }
  }

  // When ready → auto-assign available driver
  if (status === 'ready' && prevOrder.delivery_type === 'delivery') {
    try {
      const availDriver = findAvailableDriver(storeId)
      if (availDriver) {
        const route = findPendingRouteByOrder(storeId, prevOrder.id)
        if (route) {
          deliveryRoutesRepository.update(storeId, route.id, { driver: availDriver.name, status: 'in_progress' })
          driversRepository.update(storeId, availDriver.id, { status: 'busy' })
        }
      }
    } catch (err) {
      console.error('Driver auto-assign error:', err)
    }
  }

  // When delivered → update route + driver metrics
  if (status === 'delivered' && prevOrder.delivery_type === 'delivery') {
    try {
      const route = findRouteByOrder(storeId, prevOrder.id)
      if (route) {
        deliveryRoutesRepository.update(storeId, route.id, {
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        if (route.driver) {
          const driver = findDriverByName(storeId, route.driver)
          if (driver) {
            driversRepository.update(storeId, driver.id, {
              status: 'available',
              total_deliveries: (Number(driver.total_deliveries) || 0) + 1,
            })
          }
        }
      }
    } catch (err) {
      console.error('Delivery completion error:', err)
    }
  }
}

export function updateOrderStatus(storeId: string, id: string, status: string): Record<string, any> {
  if (!VALID_STATUSES.includes(status)) {
    throw httpError(400, 'Status inválido')
  }
  const prevOrder = findOrderById(storeId, id)
  if (!prevOrder) {
    throw httpError(404, 'Pedido não encontrado')
  }

  ordersRepository.update(storeId, id, { status, updated_at: new Date().toISOString() })

  // Award cashback when delivered
  if (status === 'delivered') {
    const row = getStoreSetting(storeId, 'cashback_percentage')
    const pct = row ? Number(row) : 5
    if (prevOrder) {
      const customer = findCustomerByPhone(storeId, prevOrder.customer_phone)
      if (customer) {
        const cashbackAmount = prevOrder.total * (pct / 100)
        cashbackTransactionsRepository.insert(storeId, {
          id: 'cb_' + uuid(),
          customer_id: customer.id,
          order_id: id,
          amount: cashbackAmount,
          status: 'available',
        })
      }
    }
  }

  // ───── Delivery Flow ─────
  handleDeliveryStatus(storeId, prevOrder, status)

  const order = findOrderById(storeId, id)

  // Notify real-time clients
  if (order) {
    notifyOrder(id, { type: 'status_update', order: publicOrder(order) })
  }

  return parseOrder(order!)
}

export function markPrinted(storeId: string, id: string): void {
  ordersRepository.update(storeId, id, { printed: 1 })
}

export function confirmScheduledOrders(): void {
  const now = new Date().toISOString()
  const rows = ordersRepository.raw(
    null,
    'SELECT * FROM orders WHERE scheduled_at IS NOT NULL AND scheduled_at <= ? AND status = ?',
    [now, 'pending']
  )
  for (const order of rows) {
    const storeId = order.store_id || 'main'
    ordersRepository.update(storeId, order.id, {
      status: 'confirmed',
      scheduled_at: null,
      updated_at: new Date().toISOString(),
    })
    notifyAll(
      { type: 'new_order', order: { id: order.id, total: order.total, deliveryType: order.delivery_type } },
      storeId
    )
  }
}

export function updatePaymentStatus(storeId: string, id: string, paymentStatus: string): Record<string, any> {
  ordersRepository.update(storeId, id, { payment_status: paymentStatus, updated_at: new Date().toISOString() })
  const order = findOrderById(storeId, id)
  if (!order) {
    throw httpError(404, 'Pedido não encontrado')
  }

  try {
    registerOrderFinancials(storeId, order)
  } catch (err) {
    console.error('Cash register/finance error:', err)
  }

  return parseOrder(order)
}

export function getOrderReceipt(storeId: string, id: string): { order: Order; store: any } | null {
  const order = findOrderById(storeId, id)
  if (!order) return null
  const store = companySettingsRepository.findById(null, storeId)
  return { order, store }
}
