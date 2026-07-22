import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, getStoreSettings } from '../api/client'

const statusMap: Record<string, { label: string; emoji: string }> = {
  pending: { label: 'Aguardando confirmação', emoji: '⏳' },
  confirmed: { label: 'Pedido confirmado', emoji: '✅' },
  preparing: { label: 'Preparando', emoji: '👨‍🍳' },
  ready: { label: 'Pronto!', emoji: '🎉' },
  delivered: { label: 'Entregue', emoji: '📦' },
  cancelled: { label: 'Cancelado', emoji: '❌' },
}

const steps = ['pending', 'confirmed', 'preparing', 'ready']

export default function OrderStatus() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: settings } = useQuery({ queryKey: ['storeSettings'], queryFn: getStoreSettings })
  const [sseOrder, setSseOrder] = useState<any>(null)

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`)
      return data
    },
    refetchInterval: 10000, // fallback polling
  })

  // SSE real-time updates
  useEffect(() => {
    if (!id) return
    const evt = new EventSource(`/api/notifications/order/${id}/stream`)
    evt.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'status_update' && data.order) {
          setSseOrder(data.order)
        }
      } catch { /* ignore */ }
    }
    return () => evt.close()
  }, [id])

  const displayOrder = sseOrder || order

  if (!displayOrder) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 60 }}>
        <p>Carregando...</p>
      </div>
    )
  }

  const currentIdx = steps.indexOf(displayOrder.status)
  const statusInfo = statusMap[displayOrder.status] || { label: displayOrder.status, emoji: '📋' }

  return (
    <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>{statusInfo.emoji}</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Pedido #{displayOrder.id.slice(0, 8)}</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: 32 }}>{statusInfo.label}</p>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= currentIdx ? 'var(--primary)' : 'var(--border)' }} />
        ))}
      </div>

      <div className="card" style={{ padding: 20, textAlign: 'left', marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>📋 Detalhes</h3>
        {displayOrder.items.map((item: any) => (
          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', padding: '4px 0' }}>
            <span>{item.quantity}x {item.productName}</span>
            <span>R$ {item.totalPrice.toFixed(2)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Total</span>
          <span>R$ {displayOrder.total.toFixed(2)}</span>
        </div>
        <p style={{ fontSize: '.85rem', color: 'var(--text-light)', marginTop: 8 }}>
          Pagamento: {displayOrder.payment_method} • {displayOrder.delivery_type === 'pickup' ? 'Retirada' : 'Entrega'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Voltar ao Cardápio
        </button>
        {settings?.whatsapp && (
          <button className="btn btn-success" onClick={() => {
            const msg = encodeURIComponent(
              `Olá! Pedido #${displayOrder.id.slice(0, 8)}\n` +
              displayOrder.items.map((i: any) => `${i.quantity}x ${i.productName} - R$ ${i.totalPrice.toFixed(2)}`).join('\n') +
              `\nTotal: R$ ${displayOrder.total.toFixed(2)}\nPagamento: ${displayOrder.payment_method}`
            )
            window.open(`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank')
          }}>
            📱 Compartilhar no WhatsApp
          </button>
        )}
      </div>
    </div>
  )
}
