import { useAuth } from '../hooks/useAuth'

const tabLabels: Record<string, string> = {
  dashboard: 'Painel', orders: 'Pedidos', produtos: 'Cardápio', crm: 'Clientes',
  caixa: 'Caixa', fiado: 'Fiado', notas: 'NF-e',
  estoque: 'Estoque', impressoras: 'Impressoras', pdv: 'PDV', rotas: 'Rotas',
  coupons: 'Cupons', loyalty: 'Fidelidade', cashback: 'Cashback',
  campaigns: 'Campanhas', abandoned: 'Carrinhos',
  store: 'Config. Loja', tables: 'Mesas', integrations: 'Integrações',
  blog: 'Blog', partners: 'Parceiros', leads: 'Leads',
}

const sectionParents: Record<string, string> = {
  caixa: 'Financeiro', fiado: 'Financeiro', notas: 'Financeiro',
  coupons: 'Marketing', loyalty: 'Marketing', cashback: 'Marketing',
  campaigns: 'Marketing', abandoned: 'Marketing',
}

export default function DashboardHeader({
  activeTab, onMenuClick, storeIcon, storeName, pendingCount = 0,
}: {
  activeTab: string
  onMenuClick: () => void
  storeIcon: string
  storeName: string
  pendingCount?: number
}) {
  const user = useAuth(s => s.user)
  const logout = useAuth(s => s.logout)

  const label = tabLabels[activeTab] || activeTab
  const parent = sectionParents[activeTab]

  return (
    <div className="dashboard-header">
      <div>
        <button onClick={onMenuClick} className="mobile-menu-btn" style={{ marginRight: 12 }}>
          ☰
        </button>
        {parent && <div className="dashboard-breadcrumb">{parent} <span>/</span> {label}</div>}
        <h1 className="dashboard-title">{label === 'Painel' ? `${storeIcon} ${storeName}` : label}</h1>
      </div>
      <div className="dashboard-header-actions">
        <a href="/kds" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">👨‍🍳 KDS</a>
        <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">🔗 Site</a>
        <button className="btn btn-sm btn-outline" style={{ position: 'relative', fontSize: '1.1rem', padding: '6px 10px' }}>
          🔔
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: '#fff',
              fontSize: '.65rem', fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            }}>{pendingCount}</span>
          )}
        </button>
        {user && (
          <span style={{ fontSize: '.8rem', color: 'var(--text-light)', marginRight: 8 }}>
            {user.name || user.email}
          </span>
        )}
        <button onClick={logout} className="btn btn-sm btn-outline" style={{ color: 'var(--danger)' }}>Sair</button>
      </div>
    </div>
  )
}
