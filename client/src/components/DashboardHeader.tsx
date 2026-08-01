import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const tabLabels: Record<string, string> = {
  dashboard: 'Painel', orders: 'Gestão de Pedidos', produtos: 'Produtos', crm: 'Clientes',
  caixa: 'Caixa', fiado: 'Fiado',
  estoque: 'Estoque', impressoras: 'Impressoras', rotas: 'Rotas',
  coupons: 'Cupons', loyalty: 'Fidelidade',
  campaigns: 'Campanhas WhatsApp',
  tables: 'Mesas e Comandas', integrations: 'Integrações',
  'empresa-avisos': 'Avisos', 'empresa-perfil': 'Perfil da Empresa', 'empresa-horarios': 'Horários',
  'empresa-pagamentos': 'Formas de Pagamento',
  'opcoes': 'Opções', 'filtros-avancados': 'Filtros Avançados',
  'combos': 'Combos', 'fiado-dividas': 'Controle de Dívidas', 'fiado-visao-geral': 'Visão Geral',
  'config-geral': 'Geral', 'personalizar-site': 'Personalizar Site',
  'config-impressao': 'Impressão', 'agendamento': 'Agendamento',
  'usuarios': 'Usuários',
  'historico': 'Histórico de Pedidos', 'avaliacoes': 'Avaliações',
  'areas-entrega': 'Área de Entrega', 'entregadores': 'Entregadores',
  'financeiro-dashboard': 'Dashboard Financeiro', 'financeiro-lancamentos': 'Lançamentos',
  'financeiro-fluxo': 'Fluxo de Caixa',
}

const sectionParents: Record<string, string> = {
  'fiado-dividas': 'Fiado', 'fiado-visao-geral': 'Fiado',
  'config-geral': 'Configurações', 'personalizar-site': 'Configurações',
  'config-impressao': 'Configurações', 'agendamento': 'Configurações',
  'integrations': 'Configurações', 'usuarios': 'Configurações', 'historico': 'Configurações',
  'empresa-avisos': 'Empresa', 'empresa-perfil': 'Empresa', 'empresa-horarios': 'Empresa',
  'empresa-pagamentos': 'Empresa', 'impressoras': 'Empresa',
  'produtos': 'Catálogo', 'complements': 'Catálogo', 'opcoes': 'Catálogo',
  'filtros-avancados': 'Catálogo', 'combos': 'Catálogo', 'estoque': 'Catálogo',
  'areas-entrega': 'Delivery', 'entregadores': 'Delivery', 'rotas': 'Delivery',
  'campaigns': 'Marketing', 'coupons': 'Marketing', 'loyalty': 'Marketing',
  'financeiro-dashboard': 'Financeiro', 'financeiro-lancamentos': 'Financeiro', 'financeiro-fluxo': 'Financeiro',
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
        <Link to="/cardapio" className="btn btn-sm btn-outline">🔗 Ver Cardápio</Link>
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
