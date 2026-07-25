import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../api/client'
import type { Order } from '../api/client'

const styles = {
  page: { padding: '24px 20px', maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
  title: { fontSize: '1.4rem', fontWeight: 700, color: '#333', marginBottom: 20 } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' } as React.CSSProperties,
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 } as React.CSSProperties,
  statLabel: { fontSize: '.8rem', color: '#999', marginBottom: 4 } as React.CSSProperties,
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: '#333' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' } as React.CSSProperties,
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: '.75rem', fontWeight: 600, color: '#999', borderBottom: '2px solid #f0f0f0', textTransform: 'uppercase' as const, letterSpacing: '.5px' } as React.CSSProperties,
  td: { padding: '10px 12px', fontSize: '.85rem', color: '#333', borderBottom: '1px solid #f5f5f5' } as React.CSSProperties,
  sectionTitle: { fontSize: '.95rem', fontWeight: 600, color: '#333', marginBottom: 12 } as React.CSSProperties,
}

function formatDateTime(d: string) {
  const date = new Date(d)
  return { date: date.toLocaleDateString('pt-BR'), time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
}

export default function DesempenhoCancelamentos() {
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: getOrders })

  const stats = useMemo(() => {
    if (!orders) return { cancelled: [], totalCancelled: 0, cancelRate: '0.0', lostRevenue: 0, totalOrders: 0 }
    const all = orders as Order[]
    const cancelled = all.filter(o => o.status === 'cancelled')
    const lostRevenue = cancelled.reduce((s, o) => s + o.total, 0)
    return {
      cancelled: cancelled.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      totalCancelled: cancelled.length,
      cancelRate: all.length > 0 ? ((cancelled.length / all.length) * 100).toFixed(1) : '0.0',
      lostRevenue,
      totalOrders: all.length,
    }
  }, [orders])

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Desempenho de Cancelamentos</h1>

      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <p style={styles.statLabel}>Total Cancelados</p>
          <p style={{ ...styles.statValue, color: '#e74c3c' }}>{stats.totalCancelled}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Taxa de Cancelamento</p>
          <p style={styles.statValue}>{stats.cancelRate}%</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Faturamento Perdido</p>
          <p style={{ ...styles.statValue, color: '#e74c3c' }}>R$ {stats.lostRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Pedidos Cancelados</p>
        {isLoading ? (
          <p style={{ color: '#999', fontSize: '.85rem' }}>Carregando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Pedido</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Hora</th>
              </tr>
            </thead>
            <tbody>
              {stats.cancelled.map(o => {
                const dt = formatDateTime(o.created_at)
                return (
                  <tr key={o.id}>
                    <td style={{ ...styles.td, fontWeight: 600 }}>#{o.id.slice(0, 8)}</td>
                    <td style={styles.td}>{o.customer_name}</td>
                    <td style={{ ...styles.td, color: '#e74c3c', fontWeight: 600 }}>R$ {o.total.toFixed(2)}</td>
                    <td style={{ ...styles.td, color: '#666' }}>{dt.date}</td>
                    <td style={{ ...styles.td, color: '#666' }}>{dt.time}</td>
                  </tr>
                )
              })}
              {stats.cancelled.length === 0 && (
                <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>Nenhum pedido cancelado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
