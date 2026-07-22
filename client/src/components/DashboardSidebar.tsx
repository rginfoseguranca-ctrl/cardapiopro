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
      { key: 'dashboard', icon: '📊', label: 'Painel' },
      { key: 'orders', icon: '📋', label: 'Pedidos', badge: 0 },
      { key: 'produtos', icon: '🍔', label: 'Cardápio' },
      { key: 'complements', icon: '🧩', label: 'Complementos' },
      { key: 'crm', icon: '👥', label: 'Clientes' },
    ]
  },
  {
    title: 'Financeiro',
    items: [
      {
        key: 'financeiro', icon: '💰', label: 'Financeiro',
        children: [
          { key: 'financeiro', label: 'Dashboard Financeiro' },
          { key: 'caixa', label: 'Caixa' },
          { key: 'fiado', label: 'Fiado' },
          { key: 'notas', label: 'NF-e' },
        ]
      },
    ]
  },
  {
    title: 'Operacional',
    items: [
      { key: 'estoque', icon: '📦', label: 'Estoque' },
      { key: 'estoque-avancado', icon: '📊', label: 'Estoque Avançado' },
      { key: 'impressoras', icon: '🖨️', label: 'Impressoras' },
      { key: 'rotas', icon: '🚚', label: 'Rotas' },
      { key: 'entregadores', icon: '🏍️', label: 'Entregadores' },
      { key: 'pdv', icon: '💻', label: 'PDV' },
    ]
  },
  {
    title: 'Marketing',
    items: [
      {
        key: 'marketing', icon: '📢', label: 'Marketing',
        children: [
          { key: 'coupons', label: 'Cupons' },
          { key: 'loyalty', label: 'Fidelidade' },
          { key: 'cashback', label: 'Cashback' },
          { key: 'campaigns', label: 'Campanhas' },
          { key: 'abandoned', label: 'Carrinhos' },
        ]
      },
    ]
  },
  {
    title: 'Configurações',
    items: [
      { key: 'store', icon: '⚙️', label: 'Loja' },
      { key: 'multiloja', icon: '🏪', label: 'Multi-Lojas' },
      { key: 'tables', icon: '🪑', label: 'Mesas' },
      { key: 'integrations', icon: '🔌', label: 'Integrações' },
    ]
  },
  {
    title: 'Conteúdo',
    items: [
      { key: 'blog', icon: '📝', label: 'Blog' },
      { key: 'partners', icon: '🤝', label: 'Parceiros' },
      { key: 'leads', icon: '📋', label: 'Leads' },
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
    financeiro: true,
    marketing: true,
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
