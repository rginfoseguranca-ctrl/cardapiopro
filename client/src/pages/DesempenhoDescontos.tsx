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
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function DesempenhoDescontos() {
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: getOrders })

  const discountData = useMemo(() => {
    if (!orders) return { orders: [], totalDiscount: 0, avgDiscount: 0, discountCount: 0 }
    const discounted = (orders as Order[]).filter(o => o.discount > 0)
    const totalDiscount = discounted.reduce((s, o) => s + o.discount, 0)
    return {
      orders: discounted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      totalDiscount,
      avgDiscount: discounted.length > 0 ? totalDiscount / discounted.length : 0,
      discountCount: discounted.length,
    }
  }, [orders])

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Desempenho de Descontos</h1>

      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <p style={styles.statLabel}>Total Descontos</p>
          <p style={{ ...styles.statValue, color: '#e74c3c' }}>R$ {discountData.totalDiscount.toFixed(2)}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Desconto Médio</p>
          <p style={styles.statValue}>R$ {discountData.avgDiscount.toFixed(2)}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Pedidos com Desconto</p>
          <p style={styles.statValue}>{discountData.discountCount}</p>
        </div>
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Pedidos com Desconto</p>
        {isLoading ? (
          <p style={{ color: '#999', fontSize: '.85rem' }}>Carregando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Pedido</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Subtotal</th>
                <th style={styles.th}>Desconto</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Data</th>
              </tr>
            </thead>
            <tbody>
              {discountData.orders.map(o => (
                <tr key={o.id}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>#{o.id.slice(0, 8)}</td>
                  <td style={styles.td}>{o.customer_name}</td>
                  <td style={styles.td}>R$ {o.subtotal.toFixed(2)}</td>
                  <td style={{ ...styles.td, color: '#e74c3c', fontWeight: 600 }}>-R$ {o.discount.toFixed(2)}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>R$ {o.total.toFixed(2)}</td>
                  <td style={{ ...styles.td, color: '#666' }}>{formatDateTime(o.created_at)}</td>
                </tr>
              ))}
              {discountData.orders.length === 0 && (
                <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>Nenhum pedido com desconto encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
