import { create } from 'zustand'
import type { Product } from '../api/client'

export interface PdvCartItem {
  id: string
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  totalPrice: number
  complements?: { groupId: string; groupName: string; items: { complementId: string; name: string; price: number }[] }[]
  notes?: string
}

export interface HeldOrder {
  id: string
  items: PdvCartItem[]
  customer: { name: string; phone: string } | null
  tableNumber: number | null
  notes: string
  heldAt: string
  subtotal: number
  total: number
}

interface PdvCartState {
  items: PdvCartItem[]
  customer: { id?: string; name: string; phone: string } | null
  orderType: 'balcao' | 'mesa' | 'delivery'
  tableNumber: number | null
  discount: { type: 'percent' | 'fixed'; value: number } | null
  coupon: { code: string; discount: number; couponId?: string } | null
  notes: string
  heldOrders: HeldOrder[]
  _counter: number

  addItem: (product: Product, complements?: { groupId: string; groupName: string; items: { complementId: string; name: string; price: number }[] }[], qty?: number) => void
  removeItem: (index: number) => void
  updateQty: (index: number, qty: number) => void
  updateNotes: (index: number, notes: string) => void
  setCustomer: (c: PdvCartState['customer']) => void
  setOrderType: (t: PdvCartState['orderType']) => void
  setTable: (n: number | null) => void
  setDiscount: (d: PdvCartState['discount']) => void
  setCoupon: (c: PdvCartState['coupon']) => void
  setNotes: (n: string) => void
  holdOrder: () => void
  recallOrder: (id: string) => void
  discardHeld: (id: string) => void
  clear: () => void
}

const complementPrice = (complements: PdvCartItem['complements']): number =>
  (complements || []).reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.price, 0), 0)

export const usePdvCart = create<PdvCartState>((set, _get) => ({
  items: [],
  customer: null,
  orderType: 'balcao',
  tableNumber: null,
  discount: null,
  coupon: null,
  notes: '',
  heldOrders: [],
  _counter: 0,

  addItem: (product, complements, qty = 1) => set(state => {
    const cp = complementPrice(complements)
    const existingIdx = state.items.findIndex(
      i => i.productId === product.id && JSON.stringify(i.complements) === JSON.stringify(complements)
    )
    if (existingIdx >= 0) {
      const items = [...state.items]
      const item = { ...items[existingIdx] }
      item.quantity += qty
      item.totalPrice = item.unitPrice * item.quantity
      items[existingIdx] = item
      return { items, _counter: state._counter + 1 }
    }
    const newItem: PdvCartItem = {
      id: `pdv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price + cp,
      quantity: qty,
      totalPrice: (product.price + cp) * qty,
      complements,
    }
    return { items: [...state.items, newItem], _counter: state._counter + 1 }
  }),

  removeItem: (index) => set(state => {
    const items = state.items.filter((_, i) => i !== index)
    return { items, _counter: state._counter + 1 }
  }),

  updateQty: (index, qty) => set(state => {
    const items = [...state.items]
    if (qty <= 0) return { items: items.filter((_, i) => i !== index), _counter: state._counter + 1 }
    const item = { ...items[index] }
    item.quantity = qty
    item.totalPrice = item.unitPrice * qty
    items[index] = item
    return { items, _counter: state._counter + 1 }
  }),

  updateNotes: (index, notes) => set(state => {
    const items = [...state.items]
    items[index] = { ...items[index], notes }
    return { items, _counter: state._counter + 1 }
  }),

  setCustomer: (customer) => set({ customer }),
  setOrderType: (orderType) => set({ orderType }),
  setTable: (tableNumber) => set({ tableNumber }),
  setDiscount: (discount) => set({ discount, _counter: Date.now() }),
  setCoupon: (coupon) => set({ coupon, _counter: Date.now() }),
  setNotes: (notes) => set({ notes }),
  clear: () => set({ items: [], customer: null, tableNumber: null, discount: null, coupon: null, notes: '' }),

  holdOrder: () => set(state => {
    if (state.items.length === 0) return state
    const subtotal = state.items.reduce((s, i) => s + i.totalPrice, 0)
    const held: HeldOrder = {
      id: `hold_${Date.now()}`,
      items: [...state.items],
      customer: state.customer,
      tableNumber: state.tableNumber,
      notes: state.notes,
      heldAt: new Date().toISOString(),
      subtotal,
      total: subtotal - (state.discount?.value || 0) - (state.coupon?.discount || 0),
    }
    return { heldOrders: [...state.heldOrders, held], items: [], customer: null, tableNumber: null, discount: null, coupon: null, notes: '' }
  }),

  recallOrder: (id) => set(state => {
    const held = state.heldOrders.find(h => h.id === id)
    if (!held) return state
    return {
      items: held.items,
      customer: held.customer,
      tableNumber: held.tableNumber,
      notes: held.notes,
      heldOrders: state.heldOrders.filter(h => h.id !== id),
    }
  }),

  discardHeld: (id) => set(state => ({
    heldOrders: state.heldOrders.filter(h => h.id !== id),
  })),
}))
