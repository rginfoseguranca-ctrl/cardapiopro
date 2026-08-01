import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export default function OrderHistory() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [formattedPhone, setFormattedPhone] = useState('')
  const [error, setError] = useState('')

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(e.target.value.replace(/\D/g, ''))
    setFormattedPhone(formatted)
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customerOrders', phone],
    queryFn: async () => {
      const { data } = await api.get(`/customers/public/phone/${phone}/orders`)
      return data
    },
    enabled: phone.length >= 10,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (phone.length < 10) {
      setError('Digite um WhatsApp válido com DDD')
      return
    }
    refetch()
  }

  const statusMap: Record<string, { label: string; emoji: string }> = {
    pending: { label: 'Aguardando', emoji: '⏳' },
    confirmed: { label: 'Confirmado', emoji: '✅' },
    preparing: { label: 'Preparando', emoji: '👨‍🍳' },
    ready: { label: 'Pronto', emoji: '🎉' },
    delivered: { label: 'Entregue', emoji: '📦' },
    cancelled: { label: 'Cancelado', emoji: '❌' },
  }

  return (
    <div className="container" style={{ padding: '20px 0 60px', maxWidth: 500 }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>📋 Meus Pedidos</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>
        Digite seu WhatsApp para ver seu histórico de pedidos
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input flex-1"
            type="tel"
            placeholder="WhatsApp com DDD"
            value={formattedPhone}
            onChange={handlePhoneChange}
            maxLength={15}
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading || phone.length < 10}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="text-danger text-sm mt-xs">{error}</p>}
      </form>

      {data?.customer && (
        <div className="card p-md mb-lg" style={{ textAlign: 'center' }}>
          <p className="text-sm text-muted">Cliente: <strong>{data.customer.name}</strong></p>
          <p className="text-sm text-muted">WhatsApp: {data.customer.phone}</p>
          <p className="text-sm text-muted">Total de pedidos: {data.customer.total_orders}</p>
          <p className="text-sm text-muted">Total gasto: R$ {data.customer.total_spent.toFixed(2)}</p>
        </div>
      )}

      {data?.orders?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.orders.map((order: any) => {
            const statusInfo = statusMap[order.status] || { label: order.status, emoji: '📋' }
            const items = order.items
            const itemText = items.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')
            return (
              <div key={order.id} className="card p-md" style={{ borderLeft: `4px solid ${statusInfo.emoji === '📦' ? 'var(--success)' : 'var(--primary)'}` }}>
                <div className="flex justify-between items-center mb-sm">
                  <span style={{ fontSize: '1.1rem' }}>{statusInfo.emoji}</span>
                  <span className="font-bold">{statusInfo.label}</span>
                </div>
                <p className="text-sm mb-xs"><strong>Pedido:</strong> #{order.id.slice(0, 8)}</p>
                <p className="text-sm mb-xs"><strong>Data:</strong> {new Date(order.created_at).toLocaleString('pt-BR')}</p>
                <p className="text-sm mb-xs"><strong>Itens:</strong> {itemText}</p>
                <p className="text-sm mb-xs"><strong>Total:</strong> R$ {order.total.toFixed(2)}</p>
                <p className="text-sm text-muted"><strong>Pagamento:</strong> {order.payment_method}</p>
                <button
                  className="btn btn-sm btn-outline mt-sm"
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  Ver detalhes
                </button>
              </div>
            )
          })}
        </div>
      )}

      {data && data.orders?.length === 0 && phone.length >= 10 && !isLoading && (
        <div className="empty-state" style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: '3rem' }}>📭</span>
          <h3>Nenhum pedido encontrado</h3>
          <p className="text-muted">Você ainda não fez nenhum pedido</p>
          <button className="btn btn-primary mt-lg" onClick={() => navigate('/')}>
            Fazer um pedido
          </button>
        </div>
      )}

      {error && <p className="text-danger text-center">{error}</p>}
    </div>
  )
}