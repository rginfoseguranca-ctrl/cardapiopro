import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getOrders, type Order } from '../api/client'

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  canceled: 'Cancelado',
  cancelled: 'Cancelado',
}

const statusColors: Record<string, string> = {
  pending: '#f39c12',
  confirmed: '#3498db',
  preparing: '#e67e22',
  ready: '#2ecc71',
  delivered: '#27ae60',
  canceled: '#e74c3c',
  cancelled: '#e74c3c',
}

const statusFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Pronto' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'canceled', label: 'Cancelado' },
]

export default function HistoricoPedidos() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = orders.filter((o: Order) => {
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter || (statusFilter === 'canceled' && o.status === 'cancelled')
    const orderDate = new Date(o.created_at).toISOString().slice(0, 10)
    const matchFrom = !dateFrom || orderDate >= dateFrom
    const matchTo = !dateTo || orderDate <= dateTo
    return matchSearch && matchStatus && matchFrom && matchTo
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📋 Histórico de Pedidos</h1>
        <Link to="/dashboard" style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Buscar por cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none', background: '#fff' }}
          >
            {statusFilters.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
          />
          <span style={{ color: '#999' }}>até</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20 }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>Carregando pedidos...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>Nenhum pedido encontrado</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  {['#', 'Cliente', 'Telefone', 'Itens', 'Total', 'Status', 'Pagamento', 'Data'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: '#666', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order: Order) => (
                  <>
                    <tr
                      key={order.id}
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0', transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#333' }}>#{order.id.slice(0, 6)}</td>
                      <td style={{ padding: '12px 8px', color: '#333', fontWeight: 500 }}>{order.customer_name}</td>
                      <td style={{ padding: '12px 8px', color: '#666' }}>{order.customer_phone}</td>
                      <td style={{ padding: '12px 8px', color: '#666', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: '#333' }}>R$ {order.total.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#fff',
                          background: statusColors[order.status] || '#999',
                        }}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#666', textTransform: 'capitalize' }}>{order.payment_method}</td>
                      <td style={{ padding: '12px 8px', color: '#999', whiteSpace: 'nowrap' }}>
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr key={order.id + '-expanded'}>
                        <td colSpan={8} style={{ padding: '16px 8px', background: '#f9fafb', borderBottom: '2px solid #eee' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                              <h4 style={{ fontSize: '0.85rem', color: '#333', fontWeight: 700, marginBottom: 8 }}>Itens do Pedido</h4>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#555' }}>
                                  <span style={{ fontWeight: 600 }}>{item.quantity}x {item.productName}</span>
                                  <span style={{ marginLeft: 8, color: '#999' }}>R$ {item.totalPrice.toFixed(2)}</span>
                                  {item.notes && <div style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>Obs: {item.notes}</div>}
                                  {item.complements && item.complements.length > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                                      {item.complements.map((c, ci) => (
                                        <div key={ci}>+ {c.groupName}: {c.items.map(i => i.name).join(', ')}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '0.85rem', color: '#333', fontWeight: 700, marginBottom: 8 }}>Detalhes</h4>
                              <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 2 }}>
                                <p><strong>Subtotal:</strong> R$ {order.subtotal.toFixed(2)}</p>
                                {order.discount > 0 && <p><strong>Desconto:</strong> -R$ {order.discount.toFixed(2)}</p>}
                                <p><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
                                <p><strong>Tipo:</strong> {order.delivery_type === 'delivery' ? 'Delivery' : order.delivery_type === 'pickup' ? 'Retirada' : `Mesa ${order.table_number || ''}`}</p>
                                {order.delivery_address && <p><strong>Endereço:</strong> {order.delivery_address}</p>}
                                {order.notes && <p><strong>Obs:</strong> {order.notes}</p>}
                                {order.scheduled_at && <p><strong>Agendado:</strong> {new Date(order.scheduled_at).toLocaleString('pt-BR')}</p>}
                                <p><strong>Pagamento:</strong> {order.payment_method} ({order.payment_status})</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
