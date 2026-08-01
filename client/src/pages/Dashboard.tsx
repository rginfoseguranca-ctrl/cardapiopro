import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getDashboardSummary, getOrders, getTables, createTable, deleteTable, getCoupons, createCoupon, deleteCoupon, getLoyaltyRewards, createLoyaltyReward, deleteLoyaltyReward, getCampaigns, getIntegrations, setIntegration, getAllProducts, createProduct, updateProduct, getCashRegister, addCashEntry, getInventory, upsertInventoryProduct, adjustInventory, getDeliveryRoutes, createDeliveryRoute, updateDeliveryStatus, getFiado, createFiado, payFiado, getStoreSettings, getCategories, updateOrderStatus, uploadProductImage, getComplementGroups, createComplementGroup, createComplement, deleteComplement, getCustomerSegmentation, isDesktop } from '../api/client'
import { exportToCSV, ordersToCSV } from '../utils/export'
import React, { useState, useRef, useEffect } from 'react'
import DashboardSidebar from '../components/DashboardSidebar'
import DashboardHeader from '../components/DashboardHeader'
import DashboardCard from '../components/DashboardCard'
import ComplementsPanel from '../components/ComplementsPanel'
import FinancePanel from '../components/FinancePanel'
import DriversPanel from '../components/DriversPanel'
import OnboardingChecklist from '../components/OnboardingChecklist'
import HistoricoPedidos from './HistoricoPedidos'
import MinhaEmpresa from './MinhaEmpresa'
import Avaliacoes from './Avaliacoes'

import PersonalizarSite from './PersonalizarSite'
import AgendamentoPage from './Agendamento'
import AreasEntrega from './AreasEntrega'
import ConfigGeral from './ConfigGeral'
import UsuariosPage from './Usuarios'

import ImpressoraConfig from './ImpressoraConfig'
import AvisosPanel from './AvisosPanel'
import OpcoesPanel from './OpcoesPanel'
import FiltrosAvancadosPanel from './FiltrosAvancadosPanel'
import CombosPanel from './CombosPanel'
import PDV from './PDV'

function SalesChart({ data }: { data: { day: string; count: number; revenue: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data?.length) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const pad = { top: 20, bottom: 30, left: 40, right: 20 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom

    ctx.clearRect(0, 0, w, h)

    const max = Math.max(...data.map(d => d.count), 1)
    const barW = Math.min(chartW / data.length * 0.6, 40)
    const gap = chartW / data.length

    data.forEach((d, i) => {
      const x = pad.left + i * gap + (gap - barW) / 2
      const barH = (d.count / max) * chartH
      const y = pad.top + chartH - barH

      const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH)
      grad.addColorStop(0, '#e74c3c')
      grad.addColorStop(1, '#f5b7b1')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0])
      ctx.fill()

      ctx.fillStyle = '#7f8c8d'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(d.count.toString(), x + barW / 2, y - 6)
      ctx.fillText(d.day.slice(0, 3), x + barW / 2, pad.top + chartH + 18)
    })
  }, [data])

  if (!data?.length) return <p className="text-muted text-sm">Sem dados esta semana</p>

  return <canvas ref={canvasRef} style={{ width: '100%', height: 200 }} />
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState<string>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: summary } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardSummary, refetchInterval: 10000 })
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: getOrders, refetchInterval: 5000, enabled: tab === 'orders' })
  const { data: tables } = useQuery({ queryKey: ['tables'], queryFn: getTables, enabled: tab === 'tables' })
  const { data: coupons } = useQuery({ queryKey: ['coupons'], queryFn: getCoupons, enabled: tab === 'coupons' })
  const { data: rewards } = useQuery({ queryKey: ['rewards'], queryFn: getLoyaltyRewards, enabled: tab === 'loyalty' })
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: getCampaigns, enabled: tab === 'campaigns' })
  const { data: segmentation } = useQuery({ queryKey: ['segmentation'], queryFn: getCustomerSegmentation, enabled: tab === 'crm' })
  const { data: integrations } = useQuery({ queryKey: ['integrations'], queryFn: getIntegrations, enabled: tab === 'integrations' })
  const { data: storeSettings } = useQuery({ queryKey: ['storeSettings'], queryFn: getStoreSettings })

  const createTableMut = useMutation({ mutationFn: createTable, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tables'] }); setNewTableNum('') } })
  const [newTableNum, setNewTableNum] = useState('')
  const deleteTableMut = useMutation({ mutationFn: deleteTable, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }) })
  const deleteCouponMut = useMutation({ mutationFn: deleteCoupon, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }) })
  const filteredOrders = filter === 'all' ? orders : orders?.filter((o: any) => o.status === filter)
  const scheduledOrders = orders?.filter((o: any) => o.scheduled_at) || []

  const storeName = storeSettings?.storeName || 'Dashboard'
  const storeIcon = storeSettings?.storeIcon || '📊'
  const pendingCount = orders?.filter((o: any) => o.status === 'pending').length || 0

  const badges: Record<string, number> = {
    orders: pendingCount,
    impressoras: 0,
  }

  return (
    <div className="dashboard-layout">
      <DashboardSidebar
        activeTab={tab}
        onTabChange={setTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        badges={badges}
        storeIcon={storeIcon}
        storeName={storeName}
      />
      <main className="dashboard-main">
        <DashboardHeader
          activeTab={tab}
          onMenuClick={() => setMobileOpen(true)}
          storeIcon={storeIcon}
          storeName={storeName}
          pendingCount={pendingCount}
        />

        {/* ─── Dashboard Overview ─── */}
        {tab === 'dashboard' && (
          <div className="panel-fadeIn">
            <OnboardingChecklist />
            {summary && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
                  <DashboardCard icon="📋" value={summary.todayOrders} label="Pedidos Hoje" bg="#fef9e7" />
                  <DashboardCard icon="💰" value={`R$ ${summary.todayRevenue.toFixed(2)}`} label="Faturamento Hoje" bg="#d5f5e3" />
                  <DashboardCard icon="⏳" value={summary.pendingOrders} label="Pendentes" bg="#fadbd8" />
                  <DashboardCard icon="📅" value={scheduledOrders.length} label="Agendados" bg="#d6eaf8" />
                  <DashboardCard icon="📈" value={`R$ ${summary.totalRevenue.toFixed(2)}`} label="Faturamento Total" />
                  <DashboardCard icon="📊" value={summary.totalOrders} label="Total Pedidos" />
                </div>

                <div className="chart-container" style={{ marginBottom: 20 }}>
                  <h3 className="chart-title">📈 Vendas nos Últimos Dias</h3>
                  <SalesChart data={summary.ordersByDay || []} />
                </div>
              </>
            )}
            {!summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="card" style={{ padding: 20, animationDelay: `${i * 0.05}s` }}>
                    <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: '40%', height: 24 }} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <DashboardCard>
                <h3 className="font-semibold mb-sm" style={{ fontSize: '.9rem' }}>📋 Acesso Rápido</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { tab: 'orders', icon: '📋', label: 'Pedidos' },
                    { tab: 'produtos', icon: '🍔', label: 'Cardápio' },
                    { tab: 'caixa', icon: '💰', label: 'Caixa' },
                    { tab: 'crm', icon: '👥', label: 'Clientes' },
                    { tab: 'impressoras', icon: '🖨️', label: 'Impressoras' },
                    { tab: 'config-geral', icon: '⚙️', label: 'Configurações' },
                  ].map(item => (
                    <button key={item.tab} className="btn btn-outline btn-sm" onClick={() => setTab(item.tab)}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard>
                <h3 className="font-semibold mb-sm" style={{ fontSize: '.9rem' }}>🆕 Atalhos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to="/kds" className="btn btn-outline btn-sm">👨‍🍳 Abrir KDS Cozinha</Link>
                  <Link to="/cardapio" className="btn btn-outline btn-sm">🔗 Ver Cardápio</Link>
                </div>
              </DashboardCard>
            </div>
          </div>
        )}

        {/* ─── Orders ─── */}
        {tab === 'orders' && (
          <div className="panel-fadeIn">
            <div className="dashboard-filter-bar">
              {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(s => (
                <button key={s} className={`dashboard-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                  {filterLabels[s] || s}
                </button>
              ))}
              <button className="dashboard-filter-btn" onClick={() => { if (filteredOrders?.length) exportToCSV(ordersToCSV(filteredOrders), 'pedidos') }}
                style={{ marginLeft: 'auto', fontSize: '.75rem' }}>
                📥 Exportar CSV
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredOrders?.map((order: any) => <OrderCard key={order.id} order={order} />)}
              {filteredOrders?.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40 }}>Nenhum pedido encontrado</p>}
            </div>
          </div>
        )}

        {tab === 'tables' && <TablesPanel tables={tables} createTableMut={createTableMut} deleteTableMut={deleteTableMut} newTableNum={newTableNum} setNewTableNum={setNewTableNum} />}
        {tab === 'coupons' && <CouponsPanel coupons={coupons} deleteCouponMut={deleteCouponMut} />}
        {tab === 'loyalty' && <LoyaltyPanel rewards={rewards} />}
        {tab === 'campaigns' && <CampaignsPanel campaigns={campaigns} />}
        {tab === 'crm' && <CRMPanel segmentation={segmentation} />}
        {tab === 'integrations' && <IntegrationsPanel integrations={integrations} />}
        {tab === 'financeiro-dashboard' && <FinancePanel initialTab="dashboard" />}
        {tab === 'financeiro-lancamentos' && <FinancePanel initialTab="transactions" />}
        {tab === 'financeiro-fluxo' && <FinancePanel initialTab="dashboard" />}
        {tab === 'entregadores' && <DriversPanel />}
        {tab === 'produtos' && <ProdutosPanel />}
        {tab === 'complements' && <ComplementsPanel />}
        {tab === 'opcoes' && <OpcoesPanel />}
        {tab === 'filtros-avancados' && <FiltrosAvancadosPanel />}
        {tab === 'combos' && <CombosPanel />}
        {tab === 'caixa' && <CaixaPanel />}
        {tab === 'estoque' && <EstoquePanel />}
        {tab === 'pdv' && <PDV />}
        {tab === 'rotas' && <RotasPanel />}
        {tab === 'impressoras' || tab === 'impressoras-vincular' || tab === 'impressoras-setores' || tab === 'impressoras-config' || tab === 'config-impressao' ? <ImpressoraConfig /> : null}
        {tab === 'fiado' || tab === 'fiado-dividas' || tab === 'fiado-visao-geral' ? <FiadoPanel subTab={tab === 'fiado-visao-geral' ? 'visao-geral' : 'dividas'} /> : null}
        {tab === 'avaliacoes' && <Avaliacoes />}
        {tab === 'kds' && <iframe src={isDesktop ? '#/kds' : '/kds'} style={{ width: '100%', height: 'calc(100vh - 80px)', border: 'none', borderRadius: 12 }} title="KDS" />}
        {tab === 'historico' && <HistoricoPedidos />}
        {tab === 'empresa-perfil' || tab === 'empresa-horarios' || tab === 'empresa-pagamentos' || tab === 'empresa-campos' ? <MinhaEmpresa /> : null}
        {tab === 'empresa-avisos' && <AvisosPanel />}

        {tab === 'personalizar-site' && <PersonalizarSite />}
        {tab === 'agendamento' && <AgendamentoPage />}
        {tab === 'areas-entrega' && <AreasEntrega />}
        {tab === 'config-geral' && <ConfigGeral />}
        {tab === 'usuarios' && <UsuariosPage />}

      </main>
    </div>
  )
}

/* ─── Order Card ─── */
const statusColors: Record<string, string> = {
  pending: '#e74c3c', confirmed: '#f39c12', preparing: '#3498db',
  ready: '#27ae60', delivered: '#95a5a6', cancelled: '#bdc3c7',
}

const statusLabels: Record<string, string> = {
  pending: '⏳ Pendente', confirmed: '✅ Confirmado',
  preparing: '👨‍🍳 Preparando', ready: '🎉 Pronto',
  delivered: '📦 Entregue', cancelled: '❌ Cancelado',
}

const filterLabels: Record<string, string> = {
  all: '📋 Todos', ...statusLabels,
}

function OrderCard({ order }: { order: any }) {
  const queryClient = useQueryClient()
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })

  const nextStatus: Record<string, { label: string; status: string }[]> = {
    pending: [
      { label: '✅ Confirmar', status: 'confirmed' },
      { label: '❌ Cancelar', status: 'cancelled' },
    ],
    confirmed: [
      { label: '👨‍🍳 Preparar', status: 'preparing' },
      { label: '❌ Cancelar', status: 'cancelled' },
    ],
    preparing: [
      { label: '🎉 Pronto!', status: 'ready' },
    ],
    ready: [
      { label: '📦 Saiu p/ Entrega', status: 'delivered' },
      { label: '✅ Concluir', status: 'delivered' },
    ],
  }

  const actions = nextStatus[order.status] || []

  return (
    <div className="dashboard-card" style={{ padding: 14 }}>
      <div className="flex justify-between items-center mb-sm">
        <div>
          <span style={{ fontWeight: 700, fontSize: '.9rem' }}>#{order.id.slice(0, 8)}</span>
          {order.table_number && <span className="badge badge-primary ml-sm">Mesa {order.table_number}</span>}
          {order.delivery_type === 'delivery' && <span className="badge badge-info ml-sm">Entrega</span>}
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.75rem', fontWeight: 600, background: statusColors[order.status] || 'var(--text-light)', color: '#fff' }}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>
      <p className="text-sm"><strong>{order.customer_name}</strong> • {order.customer_phone}</p>
      {(order.items && typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []).map((item: any, i: number) => (
        <p key={i} className="text-xs text-muted" style={{ padding: '1px 0' }}>{item.quantity}x {item.productName}</p>
      ))}
      <div className="flex justify-between mt-sm">
        <span className="text-xs text-muted">{order.payment_method} • R$ {order.total.toFixed(2)}</span>
        <div className="flex gap-xs">
          <button className="btn btn-xs btn-ghost" style={{ padding: '2px 6px', fontSize: '.7rem' }}
            onClick={() => window.open(isDesktop ? `#/orders/${order.id}/receipt` : `/api/orders/${order.id}/receipt`, '_blank')}>
            🖨️
          </button>
          <span className="text-xs text-muted">{new Date(order.created_at).toLocaleString('pt-BR')}</span>
        </div>
      </div>
      {actions.length > 0 && (
        <div className="flex gap-xs mt-sm" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          {actions.map(a => (
            <button key={a.status}
              className={`btn btn-xs ${a.status === 'cancelled' ? 'btn-outline' : 'btn-primary'} flex-1`}
              style={{ fontSize: '.7rem', padding: '6px 8px' }}
              onClick={() => statusMut.mutate({ id: order.id, status: a.status })}
              disabled={statusMut.isPending}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── All existing panels follow ─── */
function TablesPanel({ tables, createTableMut, deleteTableMut, newTableNum, setNewTableNum }: any) {
  return (
    <div className="panel-fadeIn">
      <div className="flex gap-sm mb-md">
        <input className="input" type="number" placeholder="Número da mesa" style={{ width: 140 }} value={newTableNum} onChange={e => setNewTableNum(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => newTableNum && createTableMut.mutate(Number(newTableNum))} disabled={createTableMut.isPending}>Adicionar Mesa</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {tables?.map((t: any) => (
          <div key={t.id} className="dashboard-card" style={{ padding: 14, minWidth: 120, textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>🪑 {t.number}</p>
            <p className="text-sm text-muted">{t.is_occupied ? '🟡 Ocupada' : '🟢 Livre'}</p>
            <button className="btn btn-sm btn-outline mt-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteTableMut.mutate(t.id)}>Excluir</button>
          </div>
        ))}
        {(!tables || tables.length === 0) && <p className="text-muted text-sm">Nenhuma mesa cadastrada</p>}
      </div>
    </div>
  )
}

function CouponsPanel({ coupons, deleteCouponMut }: any) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ code: '', title: '', description: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxUses: 0 })
  const createMut = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupons'] }); setForm({ code: '', title: '', description: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxUses: 0 }) }
  })

  return (
    <div className="panel-fadeIn">
      <div className="dashboard-card mb-md">
        <h4 className="font-semibold mb-sm">🏷️ Novo Cupom</h4>
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Código *" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
          <input style={inputStyle} placeholder="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <input style={inputStyle} placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <select style={inputStyle} value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
            <option value="percentage">%</option><option value="fixed">R$</option>
          </select>
          <input style={{ ...inputStyle, width: 80 }} type="number" placeholder="Valor" value={form.discountValue || ''} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} />
          <input style={{ ...inputStyle, width: 80 }} type="number" placeholder="Mínimo" value={form.minOrderValue || ''} onChange={e => setForm(f => ({ ...f, minOrderValue: Number(e.target.value) }))} />
          <input style={{ ...inputStyle, width: 80 }} type="number" placeholder="Usos máx" value={form.maxUses || ''} onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={createMut.isPending}>Criar</button>
        </form>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {coupons?.map((c: any) => (
          <div key={c.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <div>
              <span className="font-semibold">{c.code}</span> - {c.title}
              <span className="text-sm text-muted ml-sm">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `R$ ${c.discount_value}`} • {c.used_count || 0}/{c.max_uses || '∞'} usos</span>
            </div>
            <button className="btn btn-sm btn-outline" style={{ color: 'var(--danger)' }} onClick={() => deleteCouponMut.mutate(c.id)}>🗑️</button>
          </div>
        ))}
        {(!coupons || coupons.length === 0) && <p className="text-muted text-sm">Nenhum cupom</p>}
      </div>
    </div>
  )
}

function LoyaltyPanel({ rewards }: any) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', pointsRequired: 0, description: '' })
  const createMut = useMutation({
    mutationFn: createLoyaltyReward,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rewards'] }); setForm({ name: '', pointsRequired: 0, description: '' }) }
  })
  const deleteMut = useMutation({ mutationFn: deleteLoyaltyReward, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards'] }) })

  return (
    <div className="panel-fadeIn">
      <div className="dashboard-card mb-md">
        <h4 className="font-semibold mb-sm">⭐ Nova Recompensa</h4>
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Nome *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input style={{ ...inputStyle, width: 120 }} type="number" placeholder="Pontos" value={form.pointsRequired || ''} onChange={e => setForm(f => ({ ...f, pointsRequired: Number(e.target.value) }))} required />
          <input style={inputStyle} placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rewards?.map((r: any) => (
          <div key={r.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <div><span className="font-semibold">{r.name}</span> <span className="text-sm text-muted">⭐ {r.points_required} pts • {r.description}</span></div>
            <button className="btn btn-sm btn-outline" style={{ color: 'var(--danger)' }} onClick={() => deleteMut.mutate(r.id)}>🗑️</button>
          </div>
        ))}
        {(!rewards || rewards.length === 0) && <p className="text-muted text-sm">Nenhuma recompensa</p>}
      </div>
    </div>
  )
}

function CampaignsPanel({ campaigns }: any) {
  return (
    <div className="panel-fadeIn">
      <p className="text-sm text-muted mb-md">📢 Campanhas de marketing automatizadas</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {campaigns?.map((c: any) => (
          <div key={c.id} className="dashboard-card" style={{ padding: 14 }}>
            <p className="font-semibold">{c.name} <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span></p>
            <p className="text-sm text-muted">{c.message?.slice(0, 100)}{c.message?.length > 100 ? '...' : ''}</p>
            <p className="text-xs text-muted">Enviada: {c.sent_count || 0} • Criada: {new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
        ))}
        {(!campaigns || campaigns.length === 0) && <p className="text-muted text-sm">Nenhuma campanha</p>}
      </div>
    </div>
  )
}

function CRMPanel({ segmentation }: any) {
  return (
    <div className="panel-fadeIn">
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link to="/dashboard/customers" className="btn btn-primary">👥 Ver Todos os Clientes</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {segmentation && [
          { label: '🔄 Ativos (últimos 30 dias)', value: (segmentation as any).active30days || 0 },
          { label: '📊 Total de Clientes', value: (segmentation as any).total || 0 },
          { label: '💎 Alta fidelidade', value: (segmentation as any).highValue || 0 },
          { label: '⚠️ Risco de perda', value: (segmentation as any).atRisk || 0 },
        ].map(s => (
          <div key={s.label} className="dashboard-card" style={{ textAlign: 'center', padding: 20 }}>
            <p className="text-sm text-muted">{s.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function IntegrationsPanel({ integrations }: any) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)
  const saveMut = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => setIntegration(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] })
  })
  const [localValues, setLocalValues] = useState<Record<string, string>>({})

  const handleSave = (integration: any) => {
    for (const field of integration.fields) {
      const val = localValues[field.key]
      if (val !== undefined) {
        saveMut.mutate({ key: field.key, value: val })
      }
    }
  }

  return (
    <div className="panel-fadeIn">
      <p className="text-sm text-muted mb-md">🔌 Conecte seu sistema com outras plataformas</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        {integrations?.map((int: any) => {
          const isExpanded = expanded === int.key
          return (
            <div key={int.key} className="dashboard-card" style={{ padding: 16 }}>
              <div className="flex justify-between items-center mb-sm" style={{ cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : int.key)}>
                <div>
                  <span className="font-semibold">{int.icon} {int.label}</span>
                  {int.enabled && <span className="badge badge-success ml-sm">✓ Conectado</span>}
                </div>
                <span className="text-muted">{isExpanded ? '▲' : '▼'}</span>
              </div>
              <p className="text-xs text-muted mb-sm">{int.desc}</p>
              {isExpanded && (
                <div>
                  {int.fields.map((field: any) => (
                    <div key={field.key} className="mb-xs">
                      <label className="text-xs text-muted">{field.label}</label>
                      <input className="input"
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        defaultValue={field.value || ''}
                        onChange={e => setLocalValues(v => ({ ...v, [field.key]: e.target.value }))}
                        style={{ fontSize: '.82rem', padding: '6px 8px' }}
                      />
                    </div>
                  ))}
                  <button className="btn btn-primary btn-sm btn-block mt-sm"
                    onClick={() => handleSave(int)}
                    disabled={saveMut.isPending}>
                    {int.enabled ? 'Atualizar' : 'Conectar'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


function ProdutosPanel() {
  const queryClient = useQueryClient()
  const { data: products, isLoading } = useQuery({ queryKey: ['allProducts'], queryFn: getAllProducts })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: allCompGroups } = useQuery({ queryKey: ['allCompGroups'], queryFn: () => getComplementGroups() })
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', price: '', description: '', pricePromotional: '', image: '', barcode: '', categoryId: '', ingredients: '', isHighlighted: false })
  const [newExtras, setNewExtras] = useState<{ name: string; price: number }[]>([])
  const [newExtraName, setNewExtraName] = useState('')
  const [newExtraPrice, setNewExtraPrice] = useState('')
  const [showNewExtras, setShowNewExtras] = useState(false)
  const [newImagePreview, setNewImagePreview] = useState('')
  const [uploadingNew, setUploadingNew] = useState(false)
  const newFileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', price: 0, pricePromotional: '' as string | number, image: '', barcode: '', ingredients: '', isHighlighted: false, isAvailable: true })
  const [editImagePreview, setEditImagePreview] = useState('')
  const [uploadingEdit, setUploadingEdit] = useState(false)
  const editFileRef = useRef<HTMLInputElement>(null)
  const [editExtras, setEditExtras] = useState<{ groupId: string; groupName: string; items: { id: string; name: string; price: number }[] }[]>([])
  const [editNewExtraName, setEditNewExtraName] = useState('')
  const [editNewExtraPrice, setEditNewExtraPrice] = useState('')
  const [showEditExtras, setShowEditExtras] = useState(false)

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: async (product) => {
      if (newExtras.length > 0) {
        const group = await createComplementGroup({ name: 'Adicionais', type: 'checkbox', min: 0, max: newExtras.length, productId: product.id, isRequired: false })
        for (const extra of newExtras) {
          await createComplement({ groupId: group.id, name: extra.name, price: extra.price })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['allProducts'] })
      queryClient.invalidateQueries({ queryKey: ['allCompGroups'] })
      setShowNew(false)
      setNewForm({ name: '', price: '', description: '', pricePromotional: '', image: '', barcode: '', categoryId: '', ingredients: '', isHighlighted: false })
      setNewExtras([])
      setNewImagePreview('')
    }
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProduct(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allProducts'] }); queryClient.invalidateQueries({ queryKey: ['allCompGroups'] }); setEditing(null) }
  })

  const deleteExtraMut = useMutation({
    mutationFn: deleteComplement,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allCompGroups'] }) }
  })

  const addEditExtraMut = useMutation({
    mutationFn: createComplement,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allCompGroups'] }); setEditNewExtraName(''); setEditNewExtraPrice('') }
  })

  const startEdit = (p: any) => {
    setEditing(p.id)
    setEditForm({ name: p.name, price: p.price, pricePromotional: p.pricePromotional || '', image: p.image, barcode: p.barcode || '', ingredients: (p.ingredients || []).join(', '), isHighlighted: p.isHighlighted, isAvailable: p.isAvailable })
    setEditImagePreview(p.image || '')
    const productGroups = allCompGroups?.filter((g: any) => g.productId === p.id) || []
    setEditExtras(productGroups.map((g: any) => ({ groupId: g.id, groupName: g.name, items: g.items || [] })))
    setShowEditExtras(productGroups.length > 0)
  }

  const handleNewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingNew(true)
    try {
      const { imageUrl } = await uploadProductImage(file)
      setNewForm(f => ({ ...f, image: imageUrl }))
      setNewImagePreview(imageUrl)
    } catch { alert('Erro ao enviar imagem') }
    setUploadingNew(false)
    if (newFileRef.current) newFileRef.current.value = ''
  }

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingEdit(true)
    try {
      const { imageUrl } = await uploadProductImage(file)
      setEditForm(f => ({ ...f, image: imageUrl }))
      setEditImagePreview(imageUrl)
    } catch { alert('Erro ao enviar imagem') }
    setUploadingEdit(false)
    if (editFileRef.current) editFileRef.current.value = ''
  }

  const addNewExtra = () => {
    if (!newExtraName.trim()) return
    setNewExtras(prev => [...prev, { name: newExtraName.trim(), price: Number(newExtraPrice) || 0 }])
    setNewExtraName('')
    setNewExtraPrice('')
  }

  const removeNewExtra = (idx: number) => setNewExtras(prev => prev.filter((_, i) => i !== idx))

  const extraInputStyle: React.CSSProperties = {
    padding: '5px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: '.8rem', outline: 'none', background: '#fff',
  }

  const [dragOver, setDragOver] = useState(false)

  const handleDrop = async (e: React.DragEvent, target: 'new' | 'edit') => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (target === 'new') {
      setUploadingNew(true)
      try {
        const { imageUrl } = await uploadProductImage(file)
        setNewForm(f => ({ ...f, image: imageUrl }))
        setNewImagePreview(imageUrl)
      } catch { alert('Erro ao enviar imagem') }
      setUploadingNew(false)
    } else {
      setUploadingEdit(true)
      try {
        const { imageUrl } = await uploadProductImage(file)
        setEditForm(f => ({ ...f, image: imageUrl }))
        setEditImagePreview(imageUrl)
      } catch { alert('Erro ao enviar imagem') }
      setUploadingEdit(false)
    }
  }

  const dropZoneStyle: React.CSSProperties = {
    width: 120, height: 120, borderRadius: 12, border: `2px dashed ${dragOver ? 'var(--primary)' : '#ddd'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '.2s', background: dragOver ? '#fef5f5' : '#fafafa', flexShrink: 0,
  }

  const imagePreviewContainer: React.CSSProperties = {
    width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: '2px solid #eee', flexShrink: 0, position: 'relative' as const,
  }

  const imagePreviewImg: React.CSSProperties = {
    width: '100%', height: '100%', objectFit: 'cover',
  }

  return (
    <div className="panel-fadeIn">
      <div className="flex justify-between items-center mb-md">
        <p className="text-sm text-muted">🍔 Gerencie os produtos do cardápio</p>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(!showNew)}>
          {showNew ? 'Fechar' : '+ Novo Produto'}
        </button>
      </div>

      {showNew && (
        <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg)', borderRadius: 10 }}>
          <form onSubmit={e => { e.preventDefault(); if (newForm.name && newForm.price) createMut.mutate({ name: newForm.name, price: Number(newForm.price), description: newForm.description, pricePromotional: newForm.pricePromotional ? Number(newForm.pricePromotional) : undefined, image: newForm.image, barcode: newForm.barcode, categoryId: newForm.categoryId || undefined, isHighlighted: newForm.isHighlighted, ingredients: newForm.ingredients.split(',').map((s: string) => s.trim()) }) }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <input className="input" style={inputStyle} placeholder="Nome *" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} required />
            <input className="input" style={{ ...inputStyle, width: 90 }} type="number" step=".1" placeholder="Preço *" value={newForm.price} onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))} required />
            <input className="input" style={{ ...inputStyle, width: 90 }} type="number" step=".1" placeholder="Preço Promo" value={newForm.pricePromotional} onChange={e => setNewForm(f => ({ ...f, pricePromotional: e.target.value }))} />
            <input className="input" style={{ ...inputStyle, width: 140 }} placeholder="Código de barras (EAN)" value={newForm.barcode} onChange={e => setNewForm(f => ({ ...f, barcode: e.target.value }))} />
            <input className="input" style={inputStyle} placeholder="Descrição" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                {newImagePreview ? (
                  <div style={imagePreviewContainer} onClick={() => newFileRef.current?.click()}>
                    <img src={newImagePreview} style={imagePreviewImg} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.6)', color: '#fff', textAlign: 'center', fontSize: '.65rem', padding: '2px 0' }}>Trocar</div>
                  </div>
                ) : (
                  <div style={dropZoneStyle} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={e => handleDrop(e, 'new')} onClick={() => newFileRef.current?.click()}>
                    {uploadingNew ? <span style={{ fontSize: '1.5rem', animation: 'spin 1s linear infinite' }}>⏳</span> : <span style={{ fontSize: '1.5rem' }}>📷</span>}
                    <span style={{ fontSize: '.65rem', color: '#999', marginTop: 4 }}>{uploadingNew ? 'Enviando...' : 'Arraste ou clique'}</span>
                  </div>
                )}
                <input ref={newFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleNewImageUpload} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 120 }}>
                <input className="input" style={{ ...inputStyle, width: '100%' }} placeholder="ou cole a URL da imagem" value={newForm.image} onChange={e => { setNewForm(f => ({ ...f, image: e.target.value })); setNewImagePreview(e.target.value) }} />
                <input className="input" style={{ ...inputStyle, width: '100%' }} placeholder="Ingredientes (vírgula)" value={newForm.ingredients} onChange={e => setNewForm(f => ({ ...f, ingredients: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select className="input" style={{ ...inputStyle, flex: 1 }} value={newForm.categoryId} onChange={e => setNewForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">Sem categoria</option>
                    {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                  <label style={{ fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={newForm.isHighlighted} onChange={e => setNewForm(f => ({ ...f, isHighlighted: e.target.checked }))} /> Destaque</label>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={createMut.isPending}>Criar Produto</button>
          </form>

          <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 10 }}>
            <button type="button" className="btn-ghost" style={{ fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: 6, color: '#555' }} onClick={() => setShowNewExtras(!showNewExtras)}>
              🧩 Adicionais {newExtras.length > 0 ? `(${newExtras.length})` : ''} <span style={{ fontSize: '.7rem' }}>{showNewExtras ? '▲' : '▼'}</span>
            </button>
            {showNewExtras && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input style={extraInputStyle} placeholder="Nome do adicional" value={newExtraName} onChange={e => setNewExtraName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewExtra() } }} />
                  <input style={{ ...extraInputStyle, width: 80 }} type="number" step=".1" placeholder="Preço R$" value={newExtraPrice} onChange={e => setNewExtraPrice(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewExtra() } }} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={addNewExtra}>＋ Adicionar</button>
                </div>
                {newExtras.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {newExtras.map((extra, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem', background: '#f8f9fa', borderRadius: 6, padding: '4px 10px' }}>
                        <span>{extra.name}</span>
                        {extra.price > 0 && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>+R$ {extra.price.toFixed(2)}</span>}
                        <button type="button" className="btn-ghost" style={{ color: 'var(--danger)', fontSize: '.75rem', padding: 0, marginLeft: 'auto' }} onClick={() => removeNewExtra(idx)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '.72rem', color: '#999', marginTop: 6 }}>Os adicionais serão salvos automaticamente após criar o produto.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading ? <p>Carregando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {products?.map((p: any) => (
            <div key={p.id} className="dashboard-card" style={{ padding: 14 }}>
              {editing === p.id ? (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
                    <div>
                      {editImagePreview ? (
                        <div style={imagePreviewContainer} onClick={() => editFileRef.current?.click()}>
                          <img src={editImagePreview} style={imagePreviewImg} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.6)', color: '#fff', textAlign: 'center', fontSize: '.65rem', padding: '2px 0' }}>Trocar</div>
                        </div>
                      ) : (
                        <div style={dropZoneStyle} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={e => handleDrop(e, 'edit')} onClick={() => editFileRef.current?.click()}>
                          {uploadingEdit ? <span style={{ fontSize: '1.5rem' }}>⏳</span> : <span style={{ fontSize: '1.5rem' }}>📷</span>}
                          <span style={{ fontSize: '.65rem', color: '#999', marginTop: 4 }}>{uploadingEdit ? 'Enviando...' : 'Arraste ou clique'}</span>
                        </div>
                      )}
                      <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditImageUpload} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <input style={inputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome" />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input style={{ ...inputStyle, width: 80 }} type="number" step=".1" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="Preço" />
                        <input style={{ ...inputStyle, width: 80 }} type="number" step=".1" placeholder="Promo" value={editForm.pricePromotional} onChange={e => setEditForm(f => ({ ...f, pricePromotional: e.target.value }))} />
                        <input style={{ ...inputStyle, width: 140 }} value={editForm.barcode} onChange={e => setEditForm(f => ({ ...f, barcode: e.target.value }))} placeholder="Código de barras" />
                      </div>
                      <input style={{ ...inputStyle, width: '100%' }} value={editForm.ingredients} onChange={e => setEditForm(f => ({ ...f, ingredients: e.target.value }))} placeholder="Ingredientes (vírgula)" />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label style={{ fontSize: '.8rem' }}><input type="checkbox" checked={editForm.isHighlighted} onChange={e => setEditForm(f => ({ ...f, isHighlighted: e.target.checked }))} /> Destaque</label>
                        <label style={{ fontSize: '.8rem' }}><input type="checkbox" checked={editForm.isAvailable} onChange={e => setEditForm(f => ({ ...f, isAvailable: e.target.checked }))} /> Disponível</label>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => updateMut.mutate({ id: p.id, data: { ...editForm, ingredients: editForm.ingredients.split(',').map((s: string) => s.trim()), pricePromotional: editForm.pricePromotional || null } })}>Salvar</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancelar</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 8 }}>
                    <button type="button" className="btn-ghost" style={{ fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: 6, color: '#555' }} onClick={() => setShowEditExtras(!showEditExtras)}>
                      🧩 Adicionais {editExtras.length > 0 ? `(${editExtras.reduce((s, g) => s + g.items.length, 0)} itens)` : ''} <span style={{ fontSize: '.7rem' }}>{showEditExtras ? '▲' : '▼'}</span>
                    </button>
                    {showEditExtras && (
                      <div style={{ marginTop: 8 }}>
                        {editExtras.map((group) => (
                          <div key={group.groupId} style={{ marginBottom: 8 }}>
                            <p style={{ fontSize: '.78rem', fontWeight: 600, color: '#666', marginBottom: 4 }}>{group.groupName}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {group.items.map((item) => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem', background: '#f8f9fa', borderRadius: 6, padding: '4px 10px' }}>
                                  <span>{item.name}</span>
                                  {item.price > 0 && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>+R$ {item.price.toFixed(2)}</span>}
                                  <button className="btn-ghost" style={{ color: 'var(--danger)', fontSize: '.75rem', padding: 0, marginLeft: 'auto' }} onClick={() => { deleteExtraMut.mutate(item.id); setEditExtras(prev => prev.map(g => g.groupId === group.groupId ? { ...g, items: g.items.filter(i => i.id !== item.id) } : g)) }}>✕</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {editExtras.length === 0 && <p style={{ fontSize: '.78rem', color: '#999' }}>Nenhum adicional</p>}

                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                          <input style={extraInputStyle} placeholder="Novo adicional" value={editNewExtraName} onChange={e => setEditNewExtraName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (editNewExtraName.trim() && editExtras.length > 0) addEditExtraMut.mutate({ groupId: editExtras[0].groupId, name: editNewExtraName.trim(), price: Number(editNewExtraPrice) || 0 }) } }} />
                          <input style={{ ...extraInputStyle, width: 80 }} type="number" step=".1" placeholder="Preço R$" value={editNewExtraPrice} onChange={e => setEditNewExtraPrice(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (editNewExtraName.trim() && editExtras.length > 0) addEditExtraMut.mutate({ groupId: editExtras[0].groupId, name: editNewExtraName.trim(), price: Number(editNewExtraPrice) || 0 }) } }} />
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => { if (editNewExtraName.trim() && editExtras.length > 0) addEditExtraMut.mutate({ groupId: editExtras[0].groupId, name: editNewExtraName.trim(), price: Number(editNewExtraPrice) || 0 }) }}>＋</button>
                        </div>
                        <p style={{ fontSize: '.72rem', color: '#999', marginTop: 4 }}>Itens são adicionados ao primeiro grupo de complementos do produto.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-sm">
                    {p.image && <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />}
                    <div>
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-sm text-muted ml-sm">R$ {p.price.toFixed(2)}</span>
                      {p.pricePromotional && <span className="text-sm text-success ml-sm">R$ {p.pricePromotional.toFixed(2)}</span>}
                      {p.isHighlighted && <span className="badge badge-primary ml-sm">Destaque</span>}
                      {!p.isAvailable && <span className="badge badge-danger ml-sm">Indisponível</span>}
                      {(allCompGroups?.filter((g: any) => g.productId === p.id).length || 0) > 0 && <span className="badge ml-sm" style={{ background: '#f0f0f0', color: '#666' }}>🧩 {(allCompGroups || []).filter((g: any) => g.productId === p.id).reduce((s: number, g: any) => s + (g.items?.length || 0), 0)} extras</span>}
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>✏️ Editar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CaixaPanel() {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['cashRegister'], queryFn: getCashRegister })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'income', description: '', amount: '', paymentMethod: 'cash' })
  const createMut = useMutation({
    mutationFn: addCashEntry,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cashRegister'] }); setShowForm(false); setForm({ type: 'income', description: '', amount: '', paymentMethod: 'cash' }) }
  })

  const entries = data?.entries || []
  const total = entries.reduce((s: number, e: any) => s + (e.type === 'income' ? Number(e.amount) : -Number(e.amount)), 0)
  const todayIncome = data?.todayIn || 0
  const todayExpense = data?.todayOut || 0
  const todayOrders = data?.todayOrders || 0

  return (
    <div className="panel-fadeIn">
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="dashboard-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: '.75rem', color: 'var(--text-light)', marginBottom: 4 }}>Saldo Total</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: total >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            R$ {total.toFixed(2)}
          </div>
        </div>
        <div className="dashboard-card" style={{ padding: 14, textAlign: 'center', background: '#e8f5e9' }}>
          <div style={{ fontSize: '.75rem', color: '#555', marginBottom: 4 }}>Entradas Hoje</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>
            R$ {todayIncome.toFixed(2)}
          </div>
        </div>
        <div className="dashboard-card" style={{ padding: 14, textAlign: 'center', background: '#fef5f5' }}>
          <div style={{ fontSize: '.75rem', color: '#555', marginBottom: 4 }}>Saídas Hoje</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--danger)' }}>
            R$ {todayExpense.toFixed(2)}
          </div>
        </div>
        <div className="dashboard-card" style={{ padding: 14, textAlign: 'center', background: '#e3f2fd' }}>
          <div style={{ fontSize: '.75rem', color: '#555', marginBottom: 4 }}>Pedidos Hoje</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1565c0' }}>
            {todayOrders}
          </div>
        </div>
      </div>

      {/* Balance + New Entry button */}
      <div className="flex justify-between items-center mb-md">
        <p className="font-semibold">📋 Movimentações</p>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Nova Movimentação'}</button>
      </div>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate({ type: form.type, description: form.description, amount: Number(form.amount), paymentMethod: form.paymentMethod }) }}
          style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="income">Entrada</option><option value="expense">Saída</option>
          </select>
          <input style={inputStyle} placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          <input style={{ ...inputStyle, width: 100 }} type="number" step=".01" placeholder="Valor" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
          <select style={inputStyle} value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
            <option value="cash">Dinheiro</option><option value="pix">PIX</option><option value="credit">Crédito</option><option value="debit">Débito</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm">Adicionar</button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map((e: any) => (
          <div key={e.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', padding: 10, fontSize: '.85rem' }}>
            <span>
              {e.description}
              {e.order_id && <span className="badge badge-primary" style={{ marginLeft: 6, fontSize: '.65rem', padding: '1px 6px', background: '#3498db', color: '#fff', borderRadius: 4 }}>PDV</span>}
              <span className="text-muted text-xs" style={{ marginLeft: 6 }}>• {e.payment_method || e.paymentMethod} • {new Date(e.created_at).toLocaleString('pt-BR')}</span>
            </span>
            <span style={{ color: e.type === 'income' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
              {e.type === 'income' ? '+' : '-'} R$ {Number(e.amount).toFixed(2)}
            </span>
          </div>
        ))}
        {entries.length === 0 && <p className="text-muted text-sm">Nenhuma movimentação</p>}
      </div>
    </div>
  )
}

function EstoquePanel() {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['inventory'], queryFn: getInventory })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ productName: '', quantity: 0, unit: 'un', minQuantity: 0 })
  const [adjForm, setAdjForm] = useState({ productId: '', quantity: 0, type: 'add', reason: '' })
  const items = data?.items || data || []

  const createMut = useMutation({
    mutationFn: upsertInventoryProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); setShowForm(false); setForm({ productName: '', quantity: 0, unit: 'un', minQuantity: 0 }) }
  })
  const adjustMut = useMutation({
    mutationFn: (args: { productId: string; quantity: number; type: string; reason: string }) => adjustInventory(args.productId, args.type as 'in' | 'out', args.quantity, args.reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); setAdjForm({ productId: '', quantity: 0, type: 'add', reason: '' }) }
  })

  return (
    <div className="panel-fadeIn">
      <button className="btn btn-primary btn-sm mb-md" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Novo Produto'}</button>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Nome" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} required />
          <input style={{ ...inputStyle, width: 80 }} type="number" placeholder="Qtd" value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
          <select style={inputStyle} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            <option value="un">un</option><option value="kg">kg</option><option value="l">L</option><option value="pac">pac</option>
          </select>
          <input style={{ ...inputStyle, width: 80 }} type="number" placeholder="Mín" value={form.minQuantity || ''} onChange={e => setForm(f => ({ ...f, minQuantity: Number(e.target.value) }))} />
          <button type="submit" className="btn btn-primary btn-sm">Adicionar</button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(Array.isArray(items) ? items : []).map((p: any) => (
          <div key={p.id} className="dashboard-card" style={{ padding: 14 }}>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">{p.product_name}</span>
                <span className="text-sm text-muted ml-sm">{p.quantity} {p.unit}</span>
                {p.quantity <= (p.min_quantity || Infinity) && <span className="badge badge-danger ml-sm">Estoque baixo</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inputStyle, width: 70 }} type="number" placeholder="Qtd" value={adjForm.productId === p.id ? adjForm.quantity : ''} onChange={e => setAdjForm({ productId: p.id, quantity: Number(e.target.value), type: adjForm.type, reason: adjForm.reason })} />
                <select style={inputStyle} value={adjForm.productId === p.id ? adjForm.type : 'add'} onChange={e => setAdjForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="add">+</option><option value="remove">-</option>
                </select>
                <button className="btn btn-outline btn-sm" onClick={() => adjForm.quantity > 0 && adjustMut.mutate({ productId: p.id, quantity: adjForm.quantity, type: adjForm.type, reason: adjForm.reason })}>Ajustar</button>
              </div>
            </div>
          </div>
        ))}
        {(!items || items.length === 0) && <p className="text-muted text-sm">Nenhum produto no estoque</p>}
      </div>
    </div>
  )
}

function RotasPanel() {
  const queryClient = useQueryClient()
  const { data: routes } = useQuery({ queryKey: ['routes'], queryFn: getDeliveryRoutes })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ address: '', customerName: '', customerPhone: '', driver: '' })
  const createMut = useMutation({
    mutationFn: createDeliveryRoute,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['routes'] }); setShowForm(false); setForm({ address: '', customerName: '', customerPhone: '', driver: '' }) }
  })
  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateDeliveryStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] })
  })

  return (
    <div className="panel-fadeIn">
      <button className="btn btn-primary btn-sm mb-md" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Nova Rota'}</button>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Endereço" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
          <input style={inputStyle} placeholder="Cliente" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
          <input style={inputStyle} placeholder="WhatsApp" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
          <input style={inputStyle} placeholder="Entregador" value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} />
          <button type="submit" className="btn btn-primary btn-sm">Adicionar</button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {routes?.map((r: any) => (
          <div key={r.id} className="dashboard-card" style={{ padding: 14 }}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{r.address}</p>
                <p className="text-xs text-muted">{r.customer_name} • {r.customer_phone} • 🚚 {r.driver || 'sem entregador'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'in_progress' ? 'badge-info' : 'badge-success'}`}>{r.status}</span>
                {r.status !== 'delivered' && (
                  <button className="btn btn-outline btn-sm" onClick={() => updateMut.mutate({ id: r.id, status: r.status === 'pending' ? 'in_progress' : 'delivered' })}>
                    {r.status === 'pending' ? 'Iniciar' : 'Entregue'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {(!routes || routes.length === 0) && <p className="text-muted text-sm">Nenhuma rota cadastrada</p>}
      </div>
    </div>
  )
}


function FiadoPanel({ subTab = 'dividas' }: { subTab?: string }) {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['fiado'], queryFn: getFiado })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customerName: '', customerPhone: '', amount: '', dueDate: '', notes: '' })
  const createMut = useMutation({
    mutationFn: createFiado,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fiado'] }); setShowForm(false); setForm({ customerName: '', customerPhone: '', amount: '', dueDate: '', notes: '' }) }
  })
  const payMut = useMutation({ mutationFn: (id: string) => payFiado(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fiado'] }) })
  const debts = data?.debts || []
  const totalFiado = debts.reduce((s: number, f: any) => s + (f.status === 'pending' ? Number(f.amount) - Number(f.paid_amount || 0) : 0), 0)
  const pendingDebts = debts.filter((f: any) => f.status === 'pending')
  const paidDebts = debts.filter((f: any) => f.status === 'paid')

  if (subTab === 'visao-geral') {
    return (
      <div className="panel-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>📊 Visão Geral - Fiado</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div className="dashboard-card" style={{ padding: 16, textAlign: 'center' }}>
            <p className="text-xs text-muted">Total em Aberto</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)' }}>R$ {totalFiado.toFixed(2)}</p>
          </div>
          <div className="dashboard-card" style={{ padding: 16, textAlign: 'center' }}>
            <p className="text-xs text-muted">Pendentes</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{pendingDebts.length}</p>
          </div>
          <div className="dashboard-card" style={{ padding: 16, textAlign: 'center' }}>
            <p className="text-xs text-muted">Pagos</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{paidDebts.length}</p>
          </div>
        </div>
        <div className="dashboard-card" style={{ padding: 16 }}>
          <h3 className="font-semibold mb-sm">Últimas transações</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {debts.slice(0, 10).map((f: any) => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <span className="font-semibold text-sm">{f.customer_name}</span>
                  <span className="text-xs text-muted ml-sm">R$ {Number(f.amount).toFixed(2)}</span>
                </div>
                <span className={`badge ${f.status === 'pending' ? 'badge-danger' : 'badge-success'}`}>{f.status === 'paid' ? 'Pago' : 'Pendente'}</span>
              </div>
            ))}
            {debts.length === 0 && <p className="text-muted text-sm">Nenhum registro</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel-fadeIn">
      <div className="flex justify-between items-center mb-md">
        <p className="font-semibold">📒 Total em aberto: <span style={{ color: 'var(--danger)' }}>R$ {totalFiado.toFixed(2)}</span></p>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Novo Fiado'}</button>
      </div>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate({ customerName: form.customerName, customerPhone: form.customerPhone, amount: Number(form.amount), dueDate: form.dueDate || undefined, notes: form.notes }) }}
          style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Nome do cliente *" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} required />
          <input style={{ ...inputStyle, width: 120 }} type="number" placeholder="Valor" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
          <input style={inputStyle} placeholder="WhatsApp" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
          <input style={inputStyle} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {debts.map((f: any) => (
          <div key={f.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <div>
              <span className="font-semibold">{f.customer_name}</span>
              <span className="text-sm text-muted ml-sm">R$ {Number(f.amount).toFixed(2)}</span>
              <span className={`badge ml-sm ${f.status === 'pending' ? 'badge-danger' : 'badge-success'}`}>{f.status === 'paid' ? 'Pago' : 'Pendente'}</span>
              {f.due_date && <span className="text-xs text-muted ml-sm">Vence: {new Date(f.due_date).toLocaleDateString('pt-BR')}</span>}
            </div>
            {f.status === 'pending' && (
              <button className="btn btn-success btn-sm" onClick={() => payMut.mutate(f.id)}>💰 Receber</button>
            )}
          </div>
        ))}
        {debts.length === 0 && <p className="text-muted text-sm">Nenhum fiado</p>}
      </div>
    </div>
  )
}




const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '1rem', outline: 'none',
  boxSizing: 'border-box',
}
