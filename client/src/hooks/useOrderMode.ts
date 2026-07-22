import { create } from 'zustand'

type OrderMode = 'delivery' | 'mesa' | 'balcao'

interface OrderModeState {
  mode: OrderMode
  tableNumber?: number
  setMode: (mode: OrderMode, tableNumber?: number) => void
  reset: () => void
}

export const useOrderMode = create<OrderModeState>(set => ({
  mode: 'delivery',
  tableNumber: undefined,
  setMode: (mode, tableNumber) => set({ mode, tableNumber }),
  reset: () => set({ mode: 'delivery', tableNumber: undefined }),
}))
