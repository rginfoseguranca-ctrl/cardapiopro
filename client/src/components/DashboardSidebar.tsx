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
    ]
  },
  {
    title: 'Desempenho',
    items: [
      {
        key: 'desempenho', icon: '📈', label: 'Desempenho',
        children: [
          { key: 'desempenho-vendas', label: 'Vendas' },
          { key: 'desempenho-clientes', label: 'Clientes' },
          { key: 'desempenho-rfv', label: 'Base de Clientes (RFV)' },
          { key: 'desempenho-catalogo', label: 'Catálogo' },
          { key: 'desempenho-entregas', label: 'Entregas' },
          { key: 'desempenho-descontos', label: 'Descontos' },
          { key: 'desempenho-cancelamentos', label: 'Cancelamentos' },
          { key: 'desempenho-visao-geral', label: 'Visão Geral' },
        ]
      },
      { key: 'historico', icon: '📜', label: 'Histórico de Pedidos' },
    ]
  },
  {
    title: 'Empresa',
    items: [
      {
        key: 'minha-empresa', icon: '🏢', label: 'Minha Empresa',
        children: [
          { key: 'empresa-perfil', label: 'Perfil' },
          { key: 'empresa-horarios', label: 'Horários' },
          { key: 'empresa-pagamentos', label: 'Formas de Pagamento' },
          { key: 'empresa-avisos', label: 'Avisos' },
          { key: 'empresa-campos', label: 'Campos Personalizados' },
        ]
      },
      {
        key: 'catalogo', icon: '🍔', label: 'Catálogo',
        children: [
          { key: 'produtos', label: 'Produtos' },
          { key: 'complements', label: 'Complementos' },
          { key: 'opcoes', label: 'Opções' },
          { key: 'filtros-avancados', label: 'Filtros Avançados' },
          { key: 'estoque-simples', label: 'Estoque Simples' },
          { key: 'combos', label: 'Combos' },
        ]
      },
      {
        key: 'delivery', icon: '🚚', label: 'Delivery',
        children: [
          { key: 'areas-entrega', label: 'Área de Entrega' },
          { key: 'entregadores', label: 'Entregadores' },
        ]
      },
    ]
  },
  {
    title: 'Clientes e Relacionamento',
    items: [
      { key: 'crm', icon: '👥', label: 'Clientes' },
      { key: 'avaliacoes', icon: '⭐', label: 'Avaliações' },
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
    title: 'Administrativo',
    items: [
      {
        key: 'admin', icon: '👥', label: 'Administrativo',
        children: [
          { key: 'usuarios', label: 'Usuários' },
          { key: 'assinaturas', label: 'Assinaturas' },
          { key: 'multiloja', label: 'Link de Multilojas' },
        ]
      },
      {
        key: 'config', icon: '⚙️', label: 'Configurações',
        children: [
          { key: 'config-geral', label: 'Configurações Gerais' },
          { key: 'personalizar-site', label: 'Personalizar Site' },
          { key: 'config-impressao', label: 'Impressão' },
          { key: 'agendamento', label: 'Agendamento' },
          { key: 'config-mesas', label: 'Mesas/Comandas' },
          { key: 'integrations', label: 'Integrações' },
        ]
      },
    ]
  },
  {
    title: 'Marketing e Vendas',
    items: [
      {
        key: 'marketing', icon: '📢', label: 'Food Marketing',
        children: [
          { key: 'campaigns', label: 'Campanhas WhatsApp' },
          { key: 'segmentacao', label: 'Segmentação de Clientes' },
          { key: 'site-analytics', label: 'Site Analytics' },
        ]
      },
      { key: 'chatbot', icon: '🤖', label: 'Chatbot' },
      { key: 'coupons', icon: '🎫', label: 'Cupons de Desconto' },
      {
        key: 'fidelidade', icon: '🎯', label: 'Fidelidade',
        children: [
          { key: 'loyalty', label: 'Programa de Fidelidade' },
          { key: 'cashback', label: 'Cashback' },
        ]
      },
    ]
  },
  {
    title: 'Módulos do Sistema',
    items: [
      { key: 'estoque-avancado', icon: '📦', label: 'Estoque Avançado' },
      {
        key: 'financeiro', icon: '📊', label: 'Módulo Financeiro',
        children: [
          { key: 'financeiro-dashboard', label: 'Dashboard Financeiro' },
          { key: 'financeiro-lancamentos', label: 'Lançamentos' },
          { key: 'financeiro-fluxo', label: 'Fluxo de Caixa' },
        ]
      },
      { key: 'notas', icon: '📄', label: 'Módulo Fiscal (NF-e)' },
    ]
  },
  {
    title: 'Conteúdo',
    items: [
      { key: 'blog', icon: '📝', label: 'Blog' },
      { key: 'partners', icon: '🤝', label: 'Parceiros' },
      { key: 'leads', icon: '📋', label: 'Leads' },
      { key: 'ver-links', icon: '🔗', label: 'Ver Meus Links' },
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
