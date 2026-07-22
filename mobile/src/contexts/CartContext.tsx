import React, { createContext, useContext, useReducer, ReactNode } from 'react'

export interface CartComplementGroup {
  groupId: string; groupName: string
  items: { complementId: string; name: string; price: number }[]
}

export interface CartItem {
  productId: string; productName: string; quantity: number; unitPrice: number
  totalPrice: number; complements?: CartComplementGroup[]; complementPrice?: number
}

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM'; item: Omit<CartItem, 'quantity' | 'totalPrice'> }
  | { type: 'REMOVE_ITEM'; key: string }
  | { type: 'UPDATE_QTY'; key: string; quantity: number }
  | { type: 'CLEAR' }

const CartContext = createContext<{
  items: CartItem[]; addItem: (item: Omit<CartItem, 'quantity' | 'totalPrice'>) => void
  removeItem: (key: string) => void; updateQuantity: (key: string, qty: number) => void
  clearCart: () => void; subtotal: () => number; totalItems: () => number
}>(null!)

function itemKey(item: { productId: string; complements?: CartComplementGroup[] }): string {
  const compKey = item.complements
    ? item.complements.map(g => g.items.map(i => i.complementId).sort().join(',')).join('|') : ''
  return `${item.productId}_${compKey}`
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = itemKey(action.item)
      const existing = state.items.find(i => itemKey(i) === key)
      const unitPrice = action.item.unitPrice + (action.item.complementPrice || 0)
      if (existing) {
        return {
          items: state.items.map(i =>
            itemKey(i) === key ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * unitPrice } : i
          )
        }
      }
      return { items: [...state.items, { ...action.item, quantity: 1, totalPrice: unitPrice, unitPrice }] }
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter(i => itemKey(i) !== action.key) }
    case 'UPDATE_QTY':
      return {
        items: state.items.map(i =>
          itemKey(i) === action.key ? { ...i, quantity: action.quantity, totalPrice: action.quantity * i.unitPrice } : i
        )
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  const addItem = (item: Omit<CartItem, 'quantity' | 'totalPrice'>) => dispatch({ type: 'ADD_ITEM', item })
  const removeItem = (key: string) => dispatch({ type: 'REMOVE_ITEM', key })
  const updateQuantity = (key: string, quantity: number) => dispatch({ type: 'UPDATE_QTY', key, quantity })
  const clearCart = () => dispatch({ type: 'CLEAR' })
  const subtotal = () => state.items.reduce((s, i) => s + i.totalPrice, 0)
  const totalItems = () => state.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items: state.items, addItem, removeItem, updateQuantity, clearCart, subtotal, totalItems }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)