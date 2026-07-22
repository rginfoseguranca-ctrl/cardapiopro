import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'

export default function Header({ onCartClick, storeIcon, storeName, whatsapp }: { onCartClick: () => void; storeIcon: string; storeName: string; whatsapp?: string }) {
  const location = useLocation()
  const items = useCart(s => s.items)
  const user = useAuth(s => s.user)
  const logout = useAuth(s => s.logout)
  const total = items.reduce((s, i) => s + i.quantity, 0)


  if (location.pathname.startsWith('/mesa/') || location.pathname === '/login') return null

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#fff', borderBottom: '1px solid var(--border)',
      padding: '12px 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
          {storeIcon} {storeName}
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/balcao" style={{ fontSize: '.875rem', color: 'var(--text-light)' }}>Balcão</Link>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '.875rem', color: '#25D366', fontWeight: 600 }}>
              📱 WhatsApp
            </a>
          )}
          {user ? (
            <Link to="/dashboard" style={{ fontSize: '.875rem', color: 'var(--text-light)' }}>Admin</Link>
          ) : (
            <Link to="/login" style={{ fontSize: '.875rem', color: 'var(--text-light)' }}>Entrar</Link>
          )}
          {user && (
            <button onClick={logout} style={{ background: 'none', fontSize: '.8rem', color: 'var(--text-light)' }}>
              Sair
            </button>
          )}
          <button onClick={onCartClick} style={{ position: 'relative', background: 'none', fontSize: '1.5rem' }}>
            🛒
            {total > 0 && <span className="cart-badge">{total}</span>}
          </button>
        </div>
      </div>
    </header>
  )
}
