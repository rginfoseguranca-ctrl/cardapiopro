import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getOrders, getCustomers } from '../api/client'
import type { Order } from '../api/client'

const styles = {
  page: { padding: '24px 20px', maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
  title: { fontSize: '1.4rem', fontWeight: 700, color: '#333', marginBottom: 20 } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' } as React.CSSProperties,
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 20 } as React.CSSProperties,
  statLabel: { fontSize: '.75rem', color: '#999', marginBottom: 4 } as React.CSSProperties,
  statValue: { fontSize: '1.3rem', fontWeight: 700, color: '#333' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' } as React.CSSProperties,
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: '.75rem', fontWeight: 600, color: '#999', borderBottom: '2px solid #f0f0f0', textTransform: 'uppercase' as const, letterSpacing: '.5px' } as React.CSSProperties,
  td: { padding: '10px 12px', fontSize: '.85rem', color: '#333', borderBottom: '1px solid #f5f5f5' } as React.CSSProperties,
  sectionTitle: { fontSize: '.95rem', fontWeight: 600, color: '#333', marginBottom: 12 } as React.CSSProperties,
  statusDot: (color: string) => ({ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: color, marginRight: 6 } as React.CSSProperties),
  statusBadge: (status: string) => {
    const colors: Record<string, string> = {
      pending: '#e74c3c', confirmed: '#f39c12', preparing: '#8e44ad',
      ready: '#27ae60', delivered: '#95a5a6', cancelled: '#bdc3c7',
    }
    return { display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: '.72rem', fontWeight: 600, background: `${colors[status] || '#999'}15`, color: colors[status] || '#666' } as React.CSSProperties
  },
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR')
}

export default function DesempenhoVisaoGeral() {
  const { data: summary, isLoading: summaryLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardSummary })
  const { data: orders, isLoading: ordersLoading } = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() })

  const recentOrders = useMemo(() => {
    if (!orders) return []
    return [...(orders as Order[])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
  }, [orders])

  const statusBreakdown = useMemo(() => {
    if (!summary?.ordersByStatus) return []
    return summary.ordersByStatus
  }, [summary])

  const isLoading = summaryLoading || ordersLoading

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Visão Geral do Estabelecimento</h1>

      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <p style={styles.statLabel}>Pedidos Hoje</p>
          <p style={styles.statValue}>{summary?.todayOrders ?? '—'}</p>
        </div>
        <div style={{ ...styles.card, background: '#d5f5e3' }}>
          <p style={{ ...styles.statLabel, color: '#1e8449' }}>Faturamento Hoje</p>
          <p style={{ ...styles.statValue, color: '#1e8449' }}>R$ {(summary?.todayRevenue ?? 0).toFixed(2)}</p>
        </div>
        <div style={{ ...styles.card, background: '#fadbd8' }}>
          <p style={{ ...styles.statLabel, color: '#c0392b' }}>Pedidos Pendentes</p>
          <p style={{ ...styles.statValue, color: '#c0392b' }}>{summary?.pendingOrders ?? '—'}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Faturamento Total</p>
          <p style={styles.statValue}>R$ {(summary?.totalRevenue ?? 0).toFixed(2)}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Total de Pedidos</p>
          <p style={styles.statValue}>{summary?.totalOrders ?? '—'}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Total de Clientes</p>
          <p style={styles.statValue}>{customers?.length ?? '—'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: statusBreakdown.length > 0 ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
        <div style={styles.card}>
          <p style={styles.sectionTitle}>Pedidos Recentes</p>
          {isLoading ? (
            <p style={{ color: '#999', fontSize: '.85rem' }}>Carregando...</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Pedido</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Valor</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Data</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ ...styles.td, fontWeight: 600 }}>#{o.id.slice(0, 8)}</td>
                    <td style={styles.td}>{o.customer_name}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>R$ {o.total.toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge(o.status)}>{o.status}</span>
                    </td>
                    <td style={{ ...styles.td, color: '#666', fontSize: '.8rem' }}>{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>Nenhum pedido encontrado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {statusBreakdown.length > 0 && (
          <div style={styles.card}>
            <p style={styles.sectionTitle}>Pedidos por Status</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {statusBreakdown.map(s => {
                const maxCount = Math.max(...statusBreakdown.map(x => x.count), 1)
                const dotColors: Record<string, string> = {
                  pending: '#e74c3c', confirmed: '#f39c12', preparing: '#8e44ad',
                  ready: '#27ae60', delivered: '#95a5a6', cancelled: '#bdc3c7',
                }
                const pct = (s.count / maxCount) * 100
                return (
                  <div key={s.status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '.85rem', color: '#333', display: 'flex', alignItems: 'center' }}>
                        <span style={styles.statusDot(dotColors[s.status] || '#999')} />
                        {s.status}
                      </span>
                      <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#333' }}>{s.count}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: dotColors[s.status] || '#999', borderRadius: 3, transition: 'width .3s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
