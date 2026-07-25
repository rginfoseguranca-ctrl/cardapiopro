import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOrders, getDashboardSummary } from '../api/client'
import type { Order } from '../api/client'

const styles = {
  page: { padding: '24px 20px', maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
  title: { fontSize: '1.4rem', fontWeight: 700, color: '#333', marginBottom: 20 } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' } as React.CSSProperties,
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 } as React.CSSProperties,
  statLabel: { fontSize: '.8rem', color: '#999', marginBottom: 4 } as React.CSSProperties,
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: '#333' } as React.CSSProperties,
  filterRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' } as React.CSSProperties,
  input: { padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: '.85rem', outline: 'none', background: '#fff' } as React.CSSProperties,
  select: { padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: '.85rem', outline: 'none', background: '#fff' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' } as React.CSSProperties,
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: '.75rem', fontWeight: 600, color: '#999', borderBottom: '2px solid #f0f0f0', textTransform: 'uppercase' as const, letterSpacing: '.5px' } as React.CSSProperties,
  td: { padding: '10px 12px', fontSize: '.85rem', color: '#333', borderBottom: '1px solid #f5f5f5' } as React.CSSProperties,
  chartContainer: { ...{} as any, display: 'flex', alignItems: 'flex-end', gap: 4, height: 180, padding: '0 8px' } as React.CSSProperties,
  chartBar: (pct: number, isMax: boolean) => ({ width: '100%', height: `${Math.max(pct, 2)}%`, background: isMax ? '#e74c3c' : '#f5b7b1', borderRadius: '4px 4px 0 0', transition: 'height .3s', position: 'relative' as const }) as React.CSSProperties,
  chartLabel: { fontSize: '.6rem', color: '#999', textAlign: 'center' as const, marginTop: 4, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties,
  sectionTitle: { fontSize: '.95rem', fontWeight: 600, color: '#333', marginBottom: 12 } as React.CSSProperties,
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function DesempenhoVendas() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deliveryType, setDeliveryType] = useState('all')

  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const { data: _summary } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardSummary })

  const filteredOrders = useMemo(() => {
    if (!orders) return []
    let list = orders as Order[]
    if (startDate) list = list.filter(o => new Date(o.created_at) >= new Date(startDate))
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59)
      list = list.filter(o => new Date(o.created_at) <= end)
    }
    if (deliveryType !== 'all') list = list.filter(o => o.delivery_type === deliveryType)
    return list
  }, [orders, startDate, endDate, deliveryType])

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0)
  const totalOrders = filteredOrders.length
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const ordersByDay = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {}
    filteredOrders.forEach(o => {
      const day = formatDate(o.created_at)
      if (!map[day]) map[day] = { count: 0, revenue: 0 }
      map[day].count++
      map[day].revenue += o.total
    })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
  }, [filteredOrders])

  const maxCount = Math.max(...ordersByDay.map(d => d[1].count), 1)

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Desempenho de Vendas</h1>

      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <p style={styles.statLabel}>Faturamento no período</p>
          <p style={styles.statValue}>R$ {totalRevenue.toFixed(2)}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Total de Pedidos</p>
          <p style={styles.statValue}>{totalOrders}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Ticket Médio</p>
          <p style={styles.statValue}>R$ {avgTicket.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: 20 }}>
        <p style={styles.sectionTitle}>Vendas ao Longo do Tempo</p>
        {ordersByDay.length > 0 ? (
          <div>
            <div style={styles.chartContainer}>
              {ordersByDay.map(([day, data]) => (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{ fontSize: '.65rem', color: '#666', marginBottom: 2 }}>{data.count}</span>
                  <div style={styles.chartBar((data.count / maxCount) * 100, data.count === maxCount)} />
                  <span style={styles.chartLabel}>{day.slice(0, 5)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: '#999', fontSize: '.85rem' }}>Sem dados no período</p>
        )}
      </div>

      <div style={styles.filterRow}>
        <label style={{ fontSize: '.8rem', color: '#666' }}>Início</label>
        <input type="date" style={styles.input} value={startDate} onChange={e => setStartDate(e.target.value)} />
        <label style={{ fontSize: '.8rem', color: '#666' }}>Fim</label>
        <input type="date" style={styles.input} value={endDate} onChange={e => setEndDate(e.target.value)} />
        <select style={styles.select} value={deliveryType} onChange={e => setDeliveryType(e.target.value)}>
          <option value="all">Todos os tipos</option>
          <option value="delivery">Entrega</option>
          <option value="pickup">Balcão</option>
          <option value="dine_in">Mesa</option>
        </select>
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Pedidos por Período</p>
        {isLoading ? (
          <p style={{ color: '#999', fontSize: '.85rem' }}>Carregando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Pedidos</th>
                <th style={styles.th}>Faturamento</th>
                <th style={styles.th}>Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {ordersByDay.length > 0 ? ordersByDay.map(([day, data]) => (
                <tr key={day}>
                  <td style={styles.td}>{day}</td>
                  <td style={styles.td}>{data.count}</td>
                  <td style={styles.td}>R$ {data.revenue.toFixed(2)}</td>
                  <td style={styles.td}>R$ {(data.revenue / data.count).toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>Nenhum pedido encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
