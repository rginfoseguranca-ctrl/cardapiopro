import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartComplementGroup {
  groupId: string
  groupName: string
  items: { complementId: string; name: string; price: number }[]
}

export interface CartItem {
  productId: string
  productName: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  complements?: CartComplementGroup[]
  complementPrice?: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity' | 'totalPrice'>) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
}

function itemKey(item: { productId: string; complements?: CartComplementGroup[] }): string {
  const compKey = item.complements
    ? item.complements.map(g => g.items.map(i => i.complementId).sort().join(',')).join('|')
    : ''
  return `${item.productId}_${compKey}`
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items
        const key = itemKey(item)
        const existing = items.find(i => itemKey(i) === key)
        const unitPrice = item.unitPrice + (item.complementPrice || 0)
        if (existing) {
          set({
            items: items.map(i =>
              itemKey(i) === key
                ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * unitPrice }
                : i
            )
          })
        } else {
          set({ items: [...items, { ...item, quantity: 1, totalPrice: unitPrice, unitPrice }] })
        }
      },
      removeItem: (key) => {
        set({ items: get().items.filter(i => key !== itemKey(i)) })
      },
      updateQuantity: (key, quantity) => {
        set({
          items: get().items.map(i =>
            itemKey(i) === key
              ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
              : i
          )
        })
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.totalPrice, 0),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)