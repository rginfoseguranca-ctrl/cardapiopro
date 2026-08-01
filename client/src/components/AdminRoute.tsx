import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth(s => s.token)
  const user = useAuth(s => s.user)
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
