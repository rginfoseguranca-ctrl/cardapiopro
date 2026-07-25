import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOrders, getProducts, getCategories } from '../api/client'
import type { Order, OrderItem, Product, Category } from '../api/client'

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
  barContainer: { width: 80, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' } as React.CSSProperties,
  barFill: (pct: number) => ({ height: '100%', width: `${pct}%`, background: '#e74c3c', borderRadius: 3 } as React.CSSProperties),
}

export default function DesempenhoCatalogo() {
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  const productRanking = useMemo(() => {
    if (!orders || !products) return []
    const productMap: Record<string, { name: string; categoryId: string; price: number; qty: number; revenue: number }> = {}

    ;(products as Product[]).forEach(p => {
      productMap[p.id] = { name: p.name, categoryId: p.categoryId, price: p.price, qty: 0, revenue: 0 }
    })

    ;(orders as Order[]).forEach(order => {
      const items: OrderItem[] = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
      items.forEach(item => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.productName, categoryId: '', price: item.unitPrice, qty: 0, revenue: 0 }
        }
        productMap[item.productId].qty += item.quantity
        productMap[item.productId].revenue += item.totalPrice
      })
    })

    return Object.entries(productMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)
  }, [orders, products])

  const catMap = useMemo(() => {
    if (!categories) return {}
    const m: Record<string, string> = {}
    ;(categories as Category[]).forEach(c => { m[c.id] = `${c.icon} ${c.name}` })
    return m
  }, [categories])

  const maxQty = Math.max(...productRanking.map(p => p.qty), 1)
  const totalQty = productRanking.reduce((s, p) => s + p.qty, 0)
  const totalRevenue = productRanking.reduce((s, p) => s + p.revenue, 0)

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Desempenho do Catálogo</h1>

      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <p style={styles.statLabel}>Produtos no Ranking</p>
          <p style={styles.statValue}>{productRanking.length}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Total Unidades Vendidas</p>
          <p style={styles.statValue}>{totalQty}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.statLabel}>Receita Total (Top 10)</p>
          <p style={styles.statValue}>R$ {totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Top 10 Produtos Mais Vendidos</p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Produto</th>
              <th style={styles.th}>Categoria</th>
              <th style={styles.th}>Preço</th>
              <th style={styles.th}>Quantidade Vendida</th>
              <th style={styles.th}>Receita</th>
            </tr>
          </thead>
          <tbody>
            {productRanking.map((p, i) => (
              <tr key={p.id}>
                <td style={styles.td}><span style={styles.rankBadge(i + 1)}>{i + 1}</span></td>
                <td style={{ ...styles.td, fontWeight: 600 }}>{p.name}</td>
                <td style={{ ...styles.td, color: '#666' }}>{catMap[p.categoryId] || '—'}</td>
                <td style={styles.td}>R$ {p.price.toFixed(2)}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{p.qty}</span>
                    <div style={styles.barContainer}>
                      <div style={styles.barFill((p.qty / maxQty) * 100)} />
                    </div>
                  </div>
                </td>
                <td style={{ ...styles.td, fontWeight: 600, color: '#27ae60' }}>R$ {p.revenue.toFixed(2)}</td>
              </tr>
            ))}
            {productRanking.length === 0 && (
              <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>Nenhum dado disponível</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
