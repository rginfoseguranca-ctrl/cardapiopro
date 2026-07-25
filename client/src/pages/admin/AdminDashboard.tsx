import { useQuery } from '@tanstack/react-query'
import { getSAASStats, type SaaSStats } from '../../api/client'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<SaaSStats>({
    queryKey: ['saasStats'],
    queryFn: getSAASStats,
  })

  if (isLoading) return <p style={{ color: '#666' }}>Carregando...</p>

  const s = stats || { stores: { total: 0 }, users: { total: 0 }, orders: { total: 0, recent: [] }, subscriptions: { active: 0, trialing: 0, canceled: 0 }, revenue: { total: 0 } }

  const cards = [
    { icon: '🏪', label: 'Lojas Ativas', value: s.stores.total, color: '#6c5ce7', bg: 'rgba(108,92,231,.08)' },
    { icon: '💰', label: 'Receita Total', value: `R$ ${(s.revenue.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: '#00b894', bg: 'rgba(0,184,148,.08)' },
    { icon: '📋', label: 'Total de Pedidos', value: s.orders.total.toLocaleString(), color: '#0984e3', bg: 'rgba(9,132,227,.08)' },
    { icon: '👥', label: 'Usuários', value: s.users.total, color: '#e17055', bg: 'rgba(225,112,85,.08)' },
  ]

  const subCards = [
    { icon: '✅', label: 'Ativas', value: s.subscriptions.active, color: '#00b894' },
    { icon: '🧪', label: 'Trial', value: s.subscriptions.trialing, color: '#fdcb6e' },
    { icon: '❌', label: 'Canceladas', value: s.subscriptions.canceled, color: '#d63031' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: '#fff', borderRadius: 12, padding: '20px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', background: c.bg, flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <p style={{ fontSize: '.78rem', color: '#888', margin: 0 }}>{c.label}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>Assinaturas</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            {subCards.map(c => (
              <div key={c.label} style={{
                flex: 1, textAlign: 'center', padding: 16, borderRadius: 10,
                background: `${c.color}10`, border: `1px solid ${c.color}20`,
              }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color, margin: 0 }}>{c.value}</p>
                <p style={{ fontSize: '.78rem', color: '#666', margin: '4px 0 0' }}>{c.icon} {c.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: 16, color: '#1a1a2e' }}>Pedidos Recentes</h3>
          {s.orders.recent.length === 0 ? (
            <p style={{ color: '#999', fontSize: '.85rem', textAlign: 'center', padding: 20 }}>Nenhum pedido ainda</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.orders.recent.slice(0, 5).map((o: any) => (
                <div key={o.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 8, background: '#f8f9fa', fontSize: '.82rem',
                }}>
                  <span style={{ color: '#333', fontWeight: 600 }}>{o.customer_name || 'Cliente'}</span>
                  <span style={{ color: '#666' }}>R$ {(o.total || 0).toFixed(2)}</span>
                  <span style={{
                    fontSize: '.7rem', padding: '2px 8px', borderRadius: 4,
                    background: o.status === 'delivered' ? '#00b89420' : o.status === 'cancelled' ? '#d6303120' : '#fdcb6e20',
                    color: o.status === 'delivered' ? '#00b894' : o.status === 'cancelled' ? '#d63031' : '#e17055',
                    fontWeight: 600,
                  }}>{o.status || 'pending'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
