import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  mustChangePassword: boolean
  login: (token: string, user: User, mustChangePassword?: boolean) => void
  logout: () => void
  setMustChangePassword: (val: boolean) => void
  isAuthenticated: () => boolean
}

function safeJson(val: string | null) {
  try { return val ? JSON.parse(val) : null } catch { return null }
}

export const useAuth = create<AuthState>((set, get) => ({
  user: safeJson(localStorage.getItem('user')),
  token: localStorage.getItem('token'),
  mustChangePassword: localStorage.getItem('mustChangePassword') === 'true',
  login: (token, user, mustChangePassword = false) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('mustChangePassword', String(mustChangePassword))
    set({ token, user, mustChangePassword })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('mustChangePassword')
    set({ token: null, user: null, mustChangePassword: false })
  },
  setMustChangePassword: (val) => {
    localStorage.setItem('mustChangePassword', String(val))
    set({ mustChangePassword: val })
  },
  isAuthenticated: () => !!get().token,
}))
