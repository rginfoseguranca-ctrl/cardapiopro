import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCustomers } from '../api/client'
import type { Customer } from '../api/client'

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
  rankBadge: (rank: number) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 12, fontSize: '.7rem', fontWeight: 700, background: rank <= 3 ? '#e74c3c' : '#f0f0f0', color: rank <= 3 ? '#fff' : '#666' } as React.CSSProperties),
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function DesempenhoClientes() {
  const { data: customers, isLoading } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() })

  const stats = useMemo(() => {
    if (!customers) return { total: 0, avgTicket: 0, active: 0 }
    const list = customers as Customer[]
    const totalSpent = list.reduce((s, c) => s + (c.total_spent || 0), 0)
    const active = list.filter(c => c.total_orders > 0).length
    return {
      total: list.length,
      avgTicket: list.length > 0 ? totalSpent / list.length : 0,
      active,
    }
  }, [customers])

  const topCustomers = useMemo(() => {
    if (!customers) return []
    return [...(customers as Customer[])]
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      .slice(0, 10)
  }, [customers])

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Desempenho de Clientes</h1>

      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <p style={styles.statLabel}>Total de Clientes</p>
          <p style={styles.statValue}>{stats.total}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Ticket Médio</p>
          <p style={styles.statValue}>R$ {stats.avgTicket.toFixed(2)}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Clientes Ativos</p>
          <p style={styles.statValue}>{stats.active}</p>
        </div>
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Top 10 Clientes por Gasto</p>
        {isLoading ? (
          <p style={{ color: '#999', fontSize: '.85rem' }}>Carregando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Telefone</th>
                <th style={styles.th}>Total Pedidos</th>
                <th style={styles.th}>Total Gasto</th>
                <th style={styles.th}>Último Pedido</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => (
                <tr key={c.id}>
                  <td style={styles.td}><span style={styles.rankBadge(i + 1)}>{i + 1}</span></td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{c.name}</td>
                  <td style={styles.td}>{c.phone}</td>
                  <td style={styles.td}>{c.total_orders}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#27ae60' }}>R$ {(c.total_spent || 0).toFixed(2)}</td>
                  <td style={{ ...styles.td, color: '#666' }}>{formatDate(c.last_order_at)}</td>
                </tr>
              ))}
              {topCustomers.length === 0 && (
                <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>Nenhum cliente encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
