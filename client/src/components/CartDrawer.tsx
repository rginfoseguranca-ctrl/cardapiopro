import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { saveAbandonedCart } from '../api/client'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSaveCart = async () => {
    setSaving(true)
    try {
      await saveAbandonedCart({ items, subtotal: subtotal() })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>()
    return items.filter(i => {
      if (seen.has(i.productId)) return false
      seen.add(i.productId)
      return true
    })
  }, [items])

  if (!open) return null

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="animate-slideIn" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '90%', maxWidth: 400,
        background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,.15)',
      }}>
        <div className="flex items-center justify-between" style={{ padding: '20px 20px 0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>🛒 Sacola</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ fontSize: '1.5rem' }}>✕</button>
        </div>

        {items.length === 0 ? (
          <div className="empty-state" style={{ flex: 1 }}>
            <div className="empty-state-icon">🛒</div>
            <p className="empty-state-title">Sua sacola está vazia</p>
            <p className="empty-state-text">Adicione produtos do cardápio para começar</p>
            <button className="btn btn-primary mt-lg" onClick={onClose}>Ver Cardápio</button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
              {items.map(item => {
                const key = `${item.productId}_${item.complements ? item.complements.map(g => g.items.map(i => i.complementId).sort().join(',')).join('|') : ''}`
                return (
                  <div key={key} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.productName}</p>
                        {item.description && (
                          <p style={{
                            fontSize: '.7rem', color: 'var(--text-light)', marginTop: 2,
                            lineHeight: 1.3, display: '-webkit-box',
                            WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>{item.description}</p>
                        )}
                        {item.complements && item.complements.length > 0 && (
                          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {item.complements.map(g => g.items.map(i => i.name).join(', ')).join(' | ')}
                          </div>
                        )}
                        {item.notes && (
                          <p style={{ fontSize: '.7rem', color: 'var(--secondary)', fontStyle: 'italic' }}>
                            Obs: {item.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted">R$ {item.unitPrice.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-xs ml-sm">
                        <button className="btn btn-outline btn-xs"
                          onClick={() => item.quantity > 1 ? updateQuantity(key, item.quantity - 1) : removeItem(key)}>−</button>
                        <span className="font-bold" style={{ minWidth: 24, textAlign: 'center', fontSize: '.9rem' }}>{item.quantity}</span>
                        <button className="btn btn-primary btn-xs"
                          onClick={() => updateQuantity(key, item.quantity + 1)}>+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-xs">
                      <button className="btn-ghost" style={{ fontSize: '.7rem', color: 'var(--danger)' }}
                        onClick={() => removeItem(key)}>Remover</button>
                      <p className="font-bold" style={{ fontSize: '.9rem' }}>R$ {item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}

              {uniqueProducts.length > 1 && (
                <div style={{ marginTop: 20, padding: '16px 0', borderTop: '2px dashed var(--border)' }}>
                  <p style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: 10 }}>
                    🔄 Quem pediu isso também pediu
                  </p>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                    {uniqueProducts.slice(0, 4).map(p => (
                      <div key={p.productId} style={{
                        minWidth: 100, padding: 8, borderRadius: 10,
                        background: 'var(--bg)', textAlign: 'center', flexShrink: 0,
                      }}>
                        <p style={{ fontSize: '.7rem', fontWeight: 600, lineHeight: 1.2 }}>{p.productName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              borderTop: '2px solid var(--border)', padding: '16px 20px',
              background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,.06)',
            }}>
              <div className="flex justify-between items-end mb-sm">
                <span style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} itens)</span>
                <span className="font-bold" style={{ fontSize: '1.1rem' }}>R$ {subtotal().toFixed(2)}</span>
              </div>
              <button className="btn btn-primary btn-block" style={{ fontSize: '1rem', padding: '14px' }}
                onClick={() => { onClose(); navigate('/checkout') }}>
                Finalizar Pedido
              </button>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-outline btn-sm flex-1" onClick={handleSaveCart} disabled={saving}>
                  {saving ? 'Salvando...' : saved ? '✅ Salvo!' : '💾 Salvar'}
                </button>
                <button className="btn btn-outline btn-sm flex-1" style={{ color: 'var(--danger)' }} onClick={clearCart}>
                  🗑️ Limpar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
