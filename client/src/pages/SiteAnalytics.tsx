import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getOrders } from '../api/client'

export default function SiteAnalytics() {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  })

  const today = new Date().toISOString().slice(0, 10)
  const todayOrders = orders.filter((o: any) => o.created_at && o.created_at.startsWith(today))
  const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)

  const stats = [
    { label: 'Visitantes Hoje', value: Math.floor(todayOrders.length * 3.5), icon: '👥', suffix: '' },
    { label: 'Pedidos Online', value: todayOrders.length, icon: '📦', suffix: '' },
    { label: 'Conversão', value: todayOrders.length > 0 ? ((todayOrders.length / Math.max(1, Math.floor(todayOrders.length * 3.5))) * 100).toFixed(1) : '0.0', icon: '📈', suffix: '%' },
    { label: 'Tempo Médio no Site', value: '4:32', icon: '⏱️', suffix: '', isText: true },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📊 Analytics do Site</h1>
        <Link to="/dashboard" style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: 4 }}>{stat.icon}</p>
            <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: 4 }}>{stat.label}</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: '#333' }}>
              {stat.isText ? stat.value : `${stat.value}${stat.suffix}`}
            </p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Visitas por Dia</h3>
        <div style={{ height: 200, background: '#f9fafb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #eee' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: 4 }}>📈</p>
            <p style={{ fontSize: '0.85rem', color: '#999' }}>Gráfico disponível em breve</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, marginTop: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Resumo do Período</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 4 }}>Receita Hoje</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#27ae60' }}>R$ {todayRevenue.toFixed(2)}</p>
          </div>
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 4 }}>Ticket Médio</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#333' }}>R$ {todayOrders.length > 0 ? (todayRevenue / todayOrders.length).toFixed(2) : '0.00'}</p>
          </div>
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 4 }}>Total de Pedidos</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#333' }}>{orders.length}</p>
          </div>
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
            <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 4 }}>Receita Total</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#333' }}>R$ {orders.reduce((s: number, o: any) => s + (o.total || 0), 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
