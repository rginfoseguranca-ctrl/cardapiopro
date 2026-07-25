import { useQuery } from '@tanstack/react-query'
import { getSaaSAnalytics, type SaaSAnalytics } from '../../api/client'

const statusColors: Record<string, string> = {
  pending: '#fdcb6e', preparing: '#e17055', ready: '#00b894',
  delivered: '#0984e3', canceled: '#d63031', 'em preparo': '#e17055',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente', preparing: 'Em preparo', ready: 'Pronto',
  delivered: 'Entregue', canceled: 'Cancelado',
}

const planLimits: Record<string, { products: number; orders: number; users: number }> = {
  start: { products: 100, orders: 2000, users: 2 },
  profissional: { products: 500, orders: 5000, users: 5 },
  premium: { products: Infinity, orders: Infinity, users: Infinity },
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8, width: '100%' }}>
      <div style={{ background: color, borderRadius: 4, height: 8, width: `${pct}%`, transition: 'width .3s' }} />
    </div>
  )
}

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery<SaaSAnalytics>({
    queryKey: ['saas-analytics'],
    queryFn: getSaaSAnalytics,
  })

  if (isLoading) return <p style={{ color: '#999', textAlign: 'center', padding: 60 }}>Carregando analytics...</p>
  if (!data) return null

  const maxMonthly = Math.max(...data.monthlyRevenue.map(d => d.revenue), 1)
  const totalOrdersByStatus = data.ordersByStatus.reduce((s, o) => s + o.count, 0)

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Orders by Status */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>Pedidos por Status</h3>
        {data.ordersByStatus.length === 0 && <p style={{ color: '#999' }}>Sem dados</p>}
        {data.ordersByStatus.map(s => (
          <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ width: 90, fontSize: '.8rem', color: '#666' }}>{statusLabels[s.status] || s.status}</span>
            <div style={{ flex: 1 }}><Bar value={s.count} max={totalOrdersByStatus} color={statusColors[s.status] || '#999'} /></div>
            <span style={{ width: 30, textAlign: 'right', fontSize: '.8rem', fontWeight: 600 }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Delivery vs Pickup */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>Entrega vs Balcão</h3>
        <div style={{ display: 'flex', gap: 16 }}>
          {data.deliveryVsPickup.map(d => (
            <div key={d.type} style={{ flex: 1, background: '#f8f9fa', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{d.count}</p>
              <p style={{ color: '#666', fontSize: '.8rem', margin: '4px 0 0' }}>{d.type === 'delivery' ? 'Delivery' : d.type === 'balcao' ? 'Balcão' : d.type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Stores */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>Top Lojas (Receita)</h3>
        {data.topStores.length === 0 && <p style={{ color: '#999' }}>Sem dados</p>}
        {data.topStores.map((st, i) => (
          <div key={st.slug} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < data.topStores.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
            <span style={{ width: 20, fontSize: '.8rem', color: '#999', fontWeight: 700 }}>#{i + 1}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '.85rem' }}>{st.name}</p>
              <p style={{ margin: 0, color: '#999', fontSize: '.75rem' }}>{st.orders} pedidos</p>
            </div>
            <span style={{ fontWeight: 700, fontSize: '.85rem' }}>R$ {(st.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>

      {/* Monthly Revenue */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>Receita Mensal</h3>
        {data.monthlyRevenue.length === 0 && <p style={{ color: '#999' }}>Sem dados</p>}
        {data.monthlyRevenue.map(m => (
          <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ width: 60, fontSize: '.8rem', color: '#666' }}>{m.month}</span>
            <div style={{ flex: 1 }}><Bar value={m.revenue} max={maxMonthly} color="#0984e3" /></div>
            <span style={{ width: 90, textAlign: 'right', fontSize: '.8rem', fontWeight: 600 }}>R$ {(m.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>

      {/* Plan Usage / Limits */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>Uso por Plano</h3>
        {data.storeLimits.length === 0 && <p style={{ color: '#999' }}>Nenhuma loja ativa</p>}
        <div style={{ display: 'grid', gap: 12 }}>
          {data.storeLimits.map(st => {
            const plan = st.plan || 'start'
            const limits = planLimits[plan] || planLimits.start
            const isOver = st.product_count > limits.products || st.month_orders > limits.orders || st.user_count > limits.users
            return (
              <div key={st.slug} style={{ padding: 12, borderRadius: 8, background: isOver ? '#fff5f5' : '#f8f9fa', border: isOver ? '1px solid #fed7d7' : '1px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{st.name}</span>
                  <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 12, background: isOver ? '#feb2b2' : '#c6f6d5', fontWeight: 600 }}>{plan}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '.75rem', color: '#666' }}>
                  <div>
                    <p style={{ margin: 0 }}>Produtos</p>
                    <p style={{ margin: 0, fontWeight: 600, color: st.product_count > limits.products ? '#e53e3e' : '#333' }}>{st.product_count}/{limits.products === Infinity ? '∞' : limits.products}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0 }}>Pedidos/mês</p>
                    <p style={{ margin: 0, fontWeight: 600, color: st.month_orders > limits.orders ? '#e53e3e' : '#333' }}>{st.month_orders}/{limits.orders === Infinity ? '∞' : limits.orders}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0 }}>Usuários</p>
                    <p style={{ margin: 0, fontWeight: 600, color: st.user_count > limits.users ? '#e53e3e' : '#333' }}>{st.user_count}/{limits.users === Infinity ? '∞' : limits.users}</p>
                  </div>
                </div>
                {isOver && <p style={{ margin: '8px 0 0', fontSize: '.7rem', color: '#e53e3e', fontWeight: 600 }}>⚠ Acima do limite do plano</p>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
