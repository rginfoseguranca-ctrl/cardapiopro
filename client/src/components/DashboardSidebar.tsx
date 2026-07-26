import { useState } from 'react'

interface MenuItem {
  key: string
  icon: string
  label: string
  badge?: number
  children?: { key: string; label: string }[]
}

const menuSections: { title?: string; items: MenuItem[] }[] = [
  {
    items: [
      { key: 'orders', icon: '📋', label: 'Gestão de Pedidos', badge: 0 },
      { key: 'tables', icon: '🪑', label: 'Mesas e Comandas' },
      { key: 'kds', icon: '🍳', label: 'KDS' },
      { key: 'caixa', icon: '💰', label: 'Caixa' },
      {
        key: 'fiado', icon: '💸', label: 'Fiado',
        children: [
          { key: 'fiado-dividas', label: 'Controle de Dívidas' },
          { key: 'fiado-visao-geral', label: 'Visão Geral' },
        ]
      },
    ]
  },
  {
    title: 'Catálogo',
    items: [
      { key: 'produtos', icon: '🍔', label: 'Produtos' },
      { key: 'complements', icon: '🧩', label: 'Complementos' },
      { key: 'opcoes', icon: '⚙️', label: 'Opções' },
      { key: 'combos', icon: '📦', label: 'Combos' },
      { key: 'estoque', icon: '📊', label: 'Estoque' },
      { key: 'filtros-avancados', icon: '🔍', label: 'Filtros Avançados' },
    ]
  },
  {
    title: 'Delivery',
    items: [
      { key: 'areas-entrega', icon: '🗺️', label: 'Área de Entrega' },
      { key: 'entregadores', icon: '🚚', label: 'Entregadores' },
      { key: 'rotas', icon: '📍', label: 'Rotas de Entrega' },
    ]
  },
  {
    title: 'Clientes',
    items: [
      { key: 'crm', icon: '👥', label: 'Clientes' },
      { key: 'avaliacoes', icon: '⭐', label: 'Avaliações' },
    ]
  },
  {
    title: 'Marketing',
    items: [
      { key: 'campaigns', icon: '📢', label: 'Campanhas WhatsApp' },
      { key: 'coupons', icon: '🎫', label: 'Cupons de Desconto' },
      { key: 'loyalty', icon: '🎯', label: 'Programa de Fidelidade' },
    ]
  },
  {
    title: 'Financeiro',
    items: [
      { key: 'financeiro-dashboard', icon: '📊', label: 'Dashboard Financeiro' },
      { key: 'financeiro-lancamentos', icon: '💰', label: 'Lançamentos' },
      { key: 'financeiro-fluxo', icon: '📈', label: 'Fluxo de Caixa' },
    ]
  },
  {
    title: 'Empresa',
    items: [
      { key: 'empresa-perfil', icon: '🏢', label: 'Perfil da Empresa' },
      { key: 'empresa-horarios', icon: '🕐', label: 'Horários' },
      { key: 'empresa-pagamentos', icon: '💳', label: 'Formas de Pagamento' },
      { key: 'empresa-avisos', icon: '📢', label: 'Avisos' },
      { key: 'impressoras', icon: '🖨️', label: 'Impressoras' },
    ]
  },
  {
    title: 'Configurações',
    items: [
      { key: 'config-geral', icon: '⚙️', label: 'Geral' },
      { key: 'personalizar-site', icon: '🎨', label: 'Personalizar Site' },
      { key: 'config-impressao', icon: '🖨️', label: 'Impressão' },
      { key: 'agendamento', icon: '📅', label: 'Agendamento' },
      { key: 'integrations', icon: '🔌', label: 'Integrações' },
      { key: 'historico', icon: '📜', label: 'Histórico de Pedidos' },
      { key: 'usuarios', icon: '👤', label: 'Usuários' },
    ]
  },
]

export default function DashboardSidebar({
  activeTab, onTabChange, collapsed, onToggle, mobileOpen, onMobileClose, badges,
  storeIcon, storeName,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  badges: Record<string, number>
  storeIcon: string
  storeName: string
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    desempenho: true,
    marketing: true,
    financeiro: true,
  })

  const toggleGroup = (key: string) => {
    setOpenGroups(g => ({ ...g, [key]: !g[key] }))
  }

  const isActive = (key: string) => {
    if (activeTab === key) return true
    for (const section of menuSections) {
      for (const item of section.items) {
        if (item.key === key && item.children) {
          if (item.children.some(c => c.key === activeTab)) return true
        }
      }
    }
    return false
  }

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      toggleGroup(item.key)
      if (!openGroups[item.key]) {
        onTabChange(item.children[0].key)
      }
    } else {
      onTabChange(item.key)
    }
    if (mobileOpen) onMobileClose()
  }

  const handleChildClick = (key: string) => {
    onTabChange(key)
    if (mobileOpen) onMobileClose()
  }

  return (
    <>
      {mobileOpen && <div className="dashboard-sidebar-overlay open" onClick={onMobileClose} />}
      <aside className={`dashboard-sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">{storeIcon}</span>
          <span className="sidebar-label">{storeName}</span>
          <button onClick={onToggle} style={{ marginLeft: 'auto', background: 'none', color: '#a0a4b0', fontSize: '1.1rem', padding: 4 }}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section, i) => (
            <div key={i}>
              {section.title && <div className="sidebar-section-title">{section.title}</div>}
              {section.items.map(item => {
                const hasChildren = !!item.children
                const groupOpen = openGroups[item.key]
                const active = isActive(item.key)
                const badge = badges[item.key] || (item.children ? item.children.reduce((s, c) => s + (badges[c.key] || 0), 0) : 0)

                return (
                  <div key={item.key}>
                    <div className={`sidebar-item${active ? ' active' : ''}`} onClick={() => handleItemClick(item)}>
                      <span className="sidebar-item-icon">{item.icon}</span>
                      <span className="sidebar-label">{item.label}</span>
                      {badge > 0 && <span className="sidebar-badge">{badge}</span>}
                      {hasChildren && <span className={`sidebar-chevron${groupOpen ? ' open' : ''}`}>▶</span>}
                    </div>
                    {hasChildren && item.children && (
                      <div className={`sidebar-submenu${groupOpen ? ' open' : ''}`}>
                        {item.children.map(child => (
                          <div key={child.key}
                            className={`sidebar-item${activeTab === child.key ? ' active' : ''}`}
                            onClick={() => handleChildClick(child.key)}>
                            <span className="sidebar-item-icon" style={{ fontSize: '.85rem', opacity: .6 }}>●</span>
                            <span className="sidebar-label">{child.label}</span>
                            {(badges[child.key] || 0) > 0 && <span className="sidebar-badge">{badges[child.key]}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-item-icon">🔒</span>
          <span className="sidebar-label">v1.0.0</span>
        </div>
      </aside>
    </>
  )
}
