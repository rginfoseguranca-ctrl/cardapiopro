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
      { key: 'overview', icon: '📊', label: 'Visão Geral' },
    ]
  },
  {
    title: 'Gestão',
    items: [
      { key: 'stores', icon: '🏪', label: 'Lojas' },
      { key: 'subscriptions', icon: '💳', label: 'Assinaturas' },
      { key: 'users', icon: '👥', label: 'Usuários' },
    ]
  },
  {
    title: 'Financeiro',
    items: [
      { key: 'analytics', icon: '📈', label: 'Analytics' },
      { key: 'revenue', icon: '💰', label: 'Receita' },
    ]
  },
]

export default function AdminSidebar({
  activeTab, onTabChange, collapsed, onToggle, mobileOpen, onMobileClose, badges,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  badges: Record<string, number>
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    gestao: true,
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
      <aside className={`dashboard-sidebar admin-sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon" style={{ fontSize: '1.4rem' }}>⚡</span>
          <span className="sidebar-label" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>CardapioPro</span>
          <button onClick={onToggle} style={{ marginLeft: 'auto', background: 'none', color: '#a0a4b0', fontSize: '1.1rem', padding: 4 }}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        <div style={{ padding: '4px 14px', marginBottom: 8 }}>
          <span style={{
            fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
            color: '#6c5ce7', background: 'rgba(108,92,231,.12)', padding: '3px 8px', borderRadius: 4,
          }}>Admin SaaS</span>
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
          <span className="sidebar-label">v1.0.0 Admin</span>
        </div>
      </aside>
    </>
  )
}
