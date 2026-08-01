import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'

export default function Header({ onCartClick, storeIcon, storeName, whatsapp }: { onCartClick: () => void; storeIcon: string; storeName: string; whatsapp?: string }) {
  const location = useLocation()
  const items = useCart(s => s.items)
  const user = useAuth(s => s.user)
  const logout = useAuth(s => s.logout)
  const total = items.reduce((s, i) => s + i.quantity, 0)
  const [drawerOpen, setDrawerOpen] = useState(false)


  if (location.pathname.startsWith('/mesa/') || location.pathname === '/login') return null

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid var(--border)',
        padding: '12px 0'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">☰</button>
            <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              {storeIcon} {storeName}
            </Link>
          </div>
          <div className="header-desktop-nav" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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

      {drawerOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="mobile-drawer">
            <div className="mobile-drawer-header">
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{storeIcon} {storeName}</span>
              <button onClick={() => setDrawerOpen(false)} style={{ fontSize: '1.2rem', background: 'none', color: 'var(--text-light)' }}>✕</button>
            </div>
            <Link className="mobile-drawer-item" to="/cardapio" onClick={() => setDrawerOpen(false)}>📋 Cardápio</Link>
            <Link className="mobile-drawer-item" to="/balcao" onClick={() => setDrawerOpen(false)}>🏪 Balcão</Link>
            {whatsapp && (
              <a className="mobile-drawer-item" href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={() => setDrawerOpen(false)}>
                📱 WhatsApp
              </a>
            )}
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            {user ? (
              <>
                <Link className="mobile-drawer-item" to="/dashboard" onClick={() => setDrawerOpen(false)}>⚙️ Admin</Link>
                <Link className="mobile-drawer-item" to="/assinaturas" onClick={() => setDrawerOpen(false)}>💳 Assinatura</Link>
                <button className="mobile-drawer-item" style={{ width: '100%', textAlign: 'left' }} onClick={() => { logout(); setDrawerOpen(false); }}>🚪 Sair</button>
              </>
            ) : (
              <Link className="mobile-drawer-item" to="/login" onClick={() => setDrawerOpen(false)}>🔑 Entrar</Link>
            )}
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .header-desktop-nav > a, .header-desktop-nav > button { display: none; }
          .header-desktop-nav > button:last-child { display: inline-flex; }
        }
      `}</style>
    </>
  )
}
