import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCustomers } from '../api/client'
import type { Customer } from '../api/client'

const styles = {
  page: { padding: '24px 20px', maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
  title: { fontSize: '1.4rem', fontWeight: 700, color: '#333', marginBottom: 20 } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' } as React.CSSProperties,
  explainCard: { background: '#f8f9fa', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid #e9ecef' } as React.CSSProperties,
  explainTitle: { fontSize: '.95rem', fontWeight: 600, color: '#333', marginBottom: 8 } as React.CSSProperties,
  explainText: { fontSize: '.85rem', color: '#666', lineHeight: 1.6 } as React.CSSProperties,
  rfvGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 } as React.CSSProperties,
  rfvCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' } as React.CSSProperties,
  rfvTitle: { fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  segmentRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' } as React.CSSProperties,
  segmentLabel: { fontSize: '.85rem', color: '#666' } as React.CSSProperties,
  segmentCount: { fontSize: '.85rem', fontWeight: 600, color: '#333' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' } as React.CSSProperties,
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: '.75rem', fontWeight: 600, color: '#999', borderBottom: '2px solid #f0f0f0', textTransform: 'uppercase' as const, letterSpacing: '.5px' } as React.CSSProperties,
  td: { padding: '10px 12px', fontSize: '.85rem', color: '#333', borderBottom: '1px solid #f5f5f5' } as React.CSSProperties,
  scoreBadge: (score: string) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: '.7rem', fontWeight: 600, background: score === 'Alto' ? '#d5f5e3' : score === 'Médio' ? '#fef9e7' : '#fadbd8', color: score === 'Alto' ? '#27ae60' : score === 'Médio' ? '#f39c12' : '#e74c3c' } as React.CSSProperties),
  sectionTitle: { fontSize: '.95rem', fontWeight: 600, color: '#333', marginBottom: 12 } as React.CSSProperties,
}

function daysDiff(d1: Date, d2: Date) {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function recencyLabel(days: number): string {
  if (days <= 7) return 'Até 7 dias'
  if (days <= 30) return '7–30 dias'
  if (days <= 90) return '30–90 dias'
  return '+90 dias'
}

function frequencyLabel(orders: number): string {
  if (orders >= 10) return '10+ pedidos'
  if (orders >= 5) return '5–9 pedidos'
  if (orders >= 2) return '2–4 pedidos'
  return '1 pedido'
}

function valueLabel(spent: number): string {
  if (spent >= 500) return 'R$ 500+'
  if (spent >= 200) return 'R$ 200–499'
  if (spent >= 50) return 'R$ 50–199'
  return 'Até R$ 50'
}

function scoreLevel(v: number, thresholds: number[]): string {
  if (v <= thresholds[0]) return 'Alto'
  if (v <= thresholds[1]) return 'Médio'
  return 'Baixo'
}

export default function DesempenhoRFV() {
  const { data: customers, isLoading } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() })
  const [sortBy, setSortBy] = useState<'recency' | 'frequency' | 'value'>('recency')

  const customerData = useMemo(() => {
    if (!customers) return []
    const now = new Date()
    return (customers as Customer[]).map(c => {
      const days = c.last_order_at ? daysDiff(new Date(c.last_order_at), now) : 999
      return { ...c, recencyDays: days }
    })
  }, [customers])

  const recencyCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Até 7 dias': 0, '7–30 dias': 0, '30–90 dias': 0, '+90 dias': 0 }
    customerData.forEach(c => { counts[recencyLabel(c.recencyDays)]++ })
    return counts
  }, [customerData])

  const frequencyCounts = useMemo(() => {
    const counts: Record<string, number> = { '10+ pedidos': 0, '5–9 pedidos': 0, '2–4 pedidos': 0, '1 pedido': 0 }
    customerData.forEach(c => { counts[frequencyLabel(c.total_orders)]++ })
    return counts
  }, [customerData])

  const valueCounts = useMemo(() => {
    const counts: Record<string, number> = { 'R$ 500+': 0, 'R$ 200–499': 0, 'R$ 50–199': 0, 'Até R$ 50': 0 }
    customerData.forEach(c => { counts[valueLabel(c.total_spent || 0)]++ })
    return counts
  }, [customerData])

  const sortedCustomers = useMemo(() => {
    const list = [...customerData]
    if (sortBy === 'recency') list.sort((a, b) => a.recencyDays - b.recencyDays)
    else if (sortBy === 'frequency') list.sort((a, b) => b.total_orders - a.total_orders)
    else list.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    return list.slice(0, 20)
  }, [customerData, sortBy])

  const rfvScore = (days: number, orders: number, spent: number) => {
    const r = scoreLevel(days, [7, 30])
    const f = scoreLevel(10 - orders, [2, 5])
    const v = scoreLevel(500 - spent, [100, 300])
    return { r, f, v }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Desempenho RFV</h1>

      <div style={styles.explainCard}>
        <p style={styles.explainTitle}>O que é segmentação RFV?</p>
        <p style={styles.explainText}>
          <strong>Recência (R):</strong> Tempo desde a última compra. Clientes que compraram recentemente têm mais chance de voltar.<br />
          <strong>Frequência (F):</strong> Quantidade de pedidos realizados. Clientes frequentes são mais leais.<br />
          <strong>Valor (V):</strong> Total gasto. Clientes que gastam mais são mais valiosos para o negócio.
        </p>
      </div>

      <div style={styles.rfvGrid}>
        <div style={styles.rfvCard}>
          <p style={styles.rfvTitle}>🕐 Recência</p>
          {Object.entries(recencyCounts).map(([label, count]) => (
            <div key={label} style={styles.segmentRow}>
              <span style={styles.segmentLabel}>{label}</span>
              <span style={styles.segmentCount}>{count}</span>
            </div>
          ))}
        </div>
        <div style={styles.rfvCard}>
          <p style={styles.rfvTitle}>🔄 Frequência</p>
          {Object.entries(frequencyCounts).map(([label, count]) => (
            <div key={label} style={styles.segmentRow}>
              <span style={styles.segmentLabel}>{label}</span>
              <span style={styles.segmentCount}>{count}</span>
            </div>
          ))}
        </div>
        <div style={styles.rfvCard}>
          <p style={styles.rfvTitle}>💰 Valor</p>
          {Object.entries(valueCounts).map(([label, count]) => (
            <div key={label} style={styles.segmentRow}>
              <span style={styles.segmentLabel}>{label}</span>
              <span style={styles.segmentCount}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={styles.sectionTitle}>Scores RFV dos Clientes</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['recency', 'frequency', 'value'] as const).map(key => (
              <button key={key} onClick={() => setSortBy(key)} style={{
                padding: '6px 14px', borderRadius: 8, border: sortBy === key ? '2px solid #333' : '1px solid #e0e0e0',
                background: sortBy === key ? '#333' : '#fff', color: sortBy === key ? '#fff' : '#666',
                fontSize: '.8rem', fontWeight: 600, cursor: 'pointer'
              }}>
                {key === 'recency' ? 'Recência' : key === 'frequency' ? 'Frequência' : 'Valor'}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <p style={{ color: '#999', fontSize: '.85rem' }}>Carregando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Telefone</th>
                <th style={styles.th}>Recência</th>
                <th style={styles.th}>Frequência</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>RFV</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map(c => {
                const scores = rfvScore(c.recencyDays, c.total_orders, c.total_spent || 0)
                return (
                  <tr key={c.id}>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{c.name}</td>
                    <td style={styles.td}>{c.phone}</td>
                    <td style={styles.td}>{c.recencyDays <= 999 ? `${c.recencyDays}d` : '—'}</td>
                    <td style={styles.td}>{c.total_orders}</td>
                    <td style={styles.td}>R$ {(c.total_spent || 0).toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={{ display: 'flex', gap: 4 }}>
                        <span style={styles.scoreBadge(scores.r)}>{scores.r}</span>
                        <span style={styles.scoreBadge(scores.f)}>{scores.f}</span>
                        <span style={styles.scoreBadge(scores.v)}>{scores.v}</span>
                      </span>
                    </td>
                  </tr>
                )
              })}
              {sortedCustomers.length === 0 && (
                <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>Nenhum cliente encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
