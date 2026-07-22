import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, updateOrderStatus, type Order } from '../api/client'

function playSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch { /* ignore */ }
}

export default function KDS() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [now, setNow] = useState(new Date())

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    refetchInterval: 10000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  // SSE for real-time order updates
  useEffect(() => {
    const evt = new EventSource('/api/notifications/stream')
    evt.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_order') {
          playSound()
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        } else if (data.type === 'status_update' && data.order) {
          // Update specific order in cache
          queryClient.setQueryData(['orders'], (old: any[] | undefined) => {
            if (!old) return old
            return old.map(o => o.id === data.order.id ? data.order : o)
          })
        }
      } catch { /* ignore */ }
    }
    return () => evt.close()
  }, [queryClient])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const pending = orders.filter((o: Order) => o.status === 'pending')
  const preparing = orders.filter((o: Order) => o.status === 'confirmed' || o.status === 'preparing')
  const ready = orders.filter((o: Order) => o.status === 'ready')
  const recent = orders.filter((o: Order) => o.status === 'delivered' || o.status === 'cancelled')

  const getElapsed = (createdAt: string) => {
    const diff = now.getTime() - new Date(createdAt).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'agora'
    if (min < 60) return `${min}min`
    return `${Math.floor(min / 60)}h${min % 60}min`
  }

  const getTimeColor = (createdAt: string) => {
    const diff = now.getTime() - new Date(createdAt).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 5) return 'var(--success)'
    if (min < 15) return 'var(--warning)'
    return 'var(--danger)'
  }

  const renderOrder = (o: Order) => {
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
    return (
      <div key={o.id} className="card p-md" style={{
        borderLeft: `4px solid ${o.status === 'pending' ? 'var(--danger)' : o.status === 'ready' ? 'var(--success)' : 'var(--warning)'}`,
        animation: 'fadeIn 0.3s ease',
      }}>
        <div className="flex justify-between items-center mb-sm">
          <div>
            <strong style={{ fontSize: '1.1rem' }}>
              #{o.id.slice(-6).toUpperCase()}
            </strong>
            {o.table_number && <span className="badge badge-primary ml-sm">Mesa {o.table_number}</span>}
            {o.delivery_type === 'delivery' && <span className="badge badge-info ml-sm">Entrega</span>}
            {o.delivery_type === 'balcao' && <span className="badge badge-warning ml-sm">Balcão</span>}
          </div>
          <span style={{ color: getTimeColor(o.created_at), fontWeight: 700, fontSize: '.9rem' }}>
            {getElapsed(o.created_at)}
          </span>
        </div>
        <p className="text-sm"><strong>{o.customer_name}</strong> {o.customer_phone !== '00000000000' && `- ${o.customer_phone}`}</p>
        <div className="divider" />
        {(items as Array<{ productName: string; quantity: number; totalPrice: number }>).map((item, i) => (
          <p key={i} className="text-sm">{item.quantity}x {item.productName} <span className="text-muted">R$ {item.totalPrice.toFixed(2)}</span></p>
        ))}
        <p className="text-xs text-muted mt-xs">{o.payment_method} • R$ {o.total.toFixed(2)}</p>
        {o.notes && <p className="text-xs text-info mt-xs">📝 {o.notes}</p>}
        <div className="flex gap-sm mt-sm">
          {o.status === 'pending' && (
            <button className="btn btn-success btn-sm" onClick={() => statusMutation.mutate({ id: o.id, status: 'confirmed' })}>
              ✅ Confirmar
            </button>
          )}
          {o.status === 'confirmed' && (
            <button className="btn btn-warning btn-sm" onClick={() => statusMutation.mutate({ id: o.id, status: 'preparing' })}>
              👨‍🍳 Preparar
            </button>
          )}
          {o.status === 'preparing' && (
            <button className="btn btn-primary btn-sm" onClick={() => statusMutation.mutate({ id: o.id, status: 'ready' })}>
              ✅ Pronto
            </button>
          )}
          {o.status === 'ready' && (
            <button className="btn btn-outline btn-sm" onClick={() => statusMutation.mutate({ id: o.id, status: 'delivered' })}>
              🚚 Entregue
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '16px 0' }}>
      <div className="flex justify-between items-center mb-sm">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>👨‍🍳 KDS - Cozinha</h2>
        <button className="btn btn-sm btn-outline" onClick={() => navigate('/admin')}>Painel</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        <div>
          <h3 className="text-sm font-semibold mb-sm" style={{ color: 'var(--danger)' }}>
            🔴 Novos ({pending.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(renderOrder)}
            {pending.length === 0 && <p className="text-sm text-muted">Nenhum pedido novo</p>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-sm" style={{ color: 'var(--warning)' }}>
            🟡 Em Preparo ({preparing.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {preparing.map(renderOrder)}
            {preparing.length === 0 && <p className="text-sm text-muted">Nenhum pedido em preparo</p>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-sm" style={{ color: 'var(--success)' }}>
            🟢 Prontos ({ready.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ready.map(renderOrder)}
            {ready.length === 0 && <p className="text-sm text-muted">Nenhum pedido pronto</p>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-sm" style={{ color: 'var(--text-muted)' }}>
            ⚪ Concluídos ({recent.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map(renderOrder)}
            {recent.length === 0 && <p className="text-sm text-muted">Nenhum pedido concluído</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
