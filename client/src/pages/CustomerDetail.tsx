import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCustomer, updateCustomer } from '../api/client'

export default function CustomerDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [editNotes, setEditNotes] = useState('')
  const [tagInput, setTagInput] = useState('')

  const { data } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id!),
    enabled: !!id,
  })

  const updateMut = useMutation({
    mutationFn: (updates: { notes?: string; tags?: string[] }) => updateCustomer(id!, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer', id] })
  })

  if (!data) return <div className="container" style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>

  const tags: string[] = data.tags || []

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      updateMut.mutate({ tags: [...tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    updateMut.mutate({ tags: tags.filter((t: string) => t !== tag) })
  }

  const cashbackAvailable = data.cashback?.filter((c: any) => c.status === 'available').reduce((s: number, c: any) => s + c.amount, 0) || 0

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <Link to="/dashboard/customers" className="btn btn-outline btn-sm" style={{ marginBottom: 16 }}>← Clientes</Link>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>{data.name}</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 12 }}>{data.phone} {data.email ? `• ${data.email}` : ''}</p>
        <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
          <div><p style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>Pedidos</p><p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.total_orders}</p></div>
          <div><p style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>Total Gasto</p><p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>R$ {Number(data.total_spent).toFixed(2)}</p></div>
          <div><p style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>Cashback Disponível</p><p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)' }}>R$ {cashbackAvailable.toFixed(2)}</p></div>
          <div><p style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>Pontos Fidelidade</p><p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3498db' }}>⭐ {data.loyaltyBalance || 0}</p></div>
          <div><p style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>Cliente Desde</p><p style={{ fontSize: '.9rem' }}>{new Date(data.created_at).toLocaleDateString('pt-BR')}</p></div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: '.85rem', color: 'var(--text-light)', marginBottom: 4 }}>Tags:</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
            {tags.map((t: string) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--primary)', color: '#fff', borderRadius: 12, fontSize: '.8rem' }}>
                {t}
                <button onClick={() => removeTag(t)} style={{ background: 'none', color: '#fff', fontSize: '.8rem', padding: 0 }}>✕</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input placeholder="Adicionar tag" style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: '.85rem', flex: 1 }}
              value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} />
            <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: '.75rem' }} onClick={addTag}>+</button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <p style={{ fontSize: '.85rem', color: 'var(--text-light)', marginBottom: 4 }}>Observações:</p>
          <textarea style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.85rem', fontFamily: 'inherit', minHeight: 60, resize: 'vertical' }}
            value={editNotes || data.notes || ''} onChange={e => setEditNotes(e.target.value)}
            onBlur={() => editNotes !== data.notes && updateMut.mutate({ notes: editNotes })} />
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>📋 Histórico de Pedidos</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.orders?.map(order => (
          <div key={order.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: '.9rem' }}>#{order.id.slice(0, 8)}</span>
              <span style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>{new Date((order as any).created_at).toLocaleString('pt-BR')}</span>
            </div>
            {order.items?.map((item: any) => (
              <p key={item.productId} style={{ fontSize: '.85rem', padding: '2px 0' }}>{item.quantity}x {item.productName}</p>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <span style={{ fontSize: '.8rem', color: 'var(--text-light)' }}>{order.status} • {order.payment_method}</span>
              <span style={{ fontWeight: 700 }}>R$ {order.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
        {(!data.orders || data.orders.length === 0) && (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 20 }}>Nenhum pedido encontrado</p>
        )}
      </div>
    </div>
  )
}
