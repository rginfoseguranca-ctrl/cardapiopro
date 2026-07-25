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
  statusBadge: (status: string) => {
    const colors: Record<string, { bg: string; fg: string }> = {
      delivered: { bg: '#d5f5e3', fg: '#27ae60' },
      pending: { bg: '#fef9e7', fg: '#f39c12' },
      confirmed: { bg: '#d6eaf8', fg: '#3498db' },
      preparing: { bg: '#ebdef0', fg: '#8e44ad' },
      ready: { bg: '#d5f5e3', fg: '#27ae60' },
      cancelled: { bg: '#fadbd8', fg: '#e74c3c' },
    }
    const c = colors[status] || { bg: '#f0f0f0', fg: '#666' }
    return { display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: '.72rem', fontWeight: 600, background: c.bg, color: c.fg } as React.CSSProperties
  },
  statusLabels: { pending: 'Pendente', confirmed: 'Confirmado', preparing: 'Preparando', ready: 'Pronto', delivered: 'Entregue', cancelled: 'Cancelado' } as Record<string, string>,
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR')
}

export default function DesempenhoEntregas() {
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: getOrders })

  const deliveryOrders = useMemo(() => {
    if (!orders) return []
    return (orders as Order[])
      .filter(o => o.delivery_type === 'delivery')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [orders])

  const totalDeliveries = deliveryOrders.length
  const deliveredCount = deliveryOrders.filter(o => o.status === 'delivered').length
  const deliveryRate = totalDeliveries > 0 ? ((deliveredCount / totalDeliveries) * 100).toFixed(1) : '0.0'
  const avgTime = 35

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Desempenho de Entregas</h1>

      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <p style={styles.statLabel}>Total Entregas</p>
          <p style={styles.statValue}>{totalDeliveries}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Tempo Médio</p>
          <p style={styles.statValue}>{avgTime} min</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Taxa de Entrega</p>
          <p style={styles.statValue}>{deliveryRate}%</p>
        </div>
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Pedidos de Entrega</p>
        {isLoading ? (
          <p style={{ color: '#999', fontSize: '.85rem' }}>Carregando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Pedido</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Endereço</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Data</th>
              </tr>
            </thead>
            <tbody>
              {deliveryOrders.map(o => (
                <tr key={o.id}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>#{o.id.slice(0, 8)}</td>
                  <td style={styles.td}>{o.customer_name}</td>
                  <td style={{ ...styles.td, color: '#666', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{o.delivery_address || '—'}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(o.status)}>{styles.statusLabels[o.status] || o.status}</span>
                  </td>
                  <td style={{ ...styles.td, color: '#666' }}>{formatDateTime(o.created_at)}</td>
                </tr>
              ))}
              {deliveryOrders.length === 0 && (
                <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>Nenhum pedido de entrega encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
