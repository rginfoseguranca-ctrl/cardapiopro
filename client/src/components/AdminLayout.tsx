import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout({ children, activeTab, onTabChange }: {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuth(s => s.user)
  const logout = useAuth(s => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="dashboard-layout">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        badges={{}}
      />
      <main className="dashboard-main">
        <header className="dashboard-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', borderBottom: '1px solid var(--border, #e2e8f0)',
          background: '#fff', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-icon mobile-only" onClick={() => setMobileOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', padding: 4 }}>
              ☰
            </button>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a2e' }}>
              {activeTab === 'overview' && '📊 Visão Geral'}
              {activeTab === 'stores' && '🏪 Gestão de Lojas'}
              {activeTab === 'subscriptions' && '💳 Assinaturas'}
              {activeTab === 'users' && '👥 Usuários'}
              {activeTab === 'revenue' && '💰 Receita'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '.82rem', color: '#666' }}>
              {user?.name || user?.email}
            </span>
            <span style={{
              fontSize: '.65rem', fontWeight: 700, background: '#6c5ce7', color: '#fff',
              padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
            }}>Admin</span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ fontSize: '.78rem' }}>
              Sair
            </button>
          </div>
        </header>
        <div className="dashboard-content" style={{ padding: 24 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
