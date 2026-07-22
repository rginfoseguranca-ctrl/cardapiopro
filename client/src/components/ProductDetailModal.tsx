import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getComplementGroups, type ComplementGroup, type Complement, type Product } from '../api/client'
import { useCart } from '../hooks/useCart'
import { showToast } from './Toast'

interface Props {
  product: Product
  open: boolean
  onClose: () => void
}

export default function ProductDetailModal({ product, open, onClose }: Props) {
  const addItem = useCart(s => s.addItem)
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [added, setAdded] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const { data: groups } = useQuery({
    queryKey: ['complementGroups', product.id],
    queryFn: () => getComplementGroups(product.id),
    enabled: open,
  })

  const [selections, setSelections] = useState<Record<string, { groupName: string; type: 'radio' | 'checkbox'; min: number; max: number; isRequired: boolean; selected: { complementId: string; name: string; price: number }[] }>>({})
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setQty(1); setNotes(''); setAdded(false); setImgLoaded(false); setErrors([])
      if (groups && groups.length > 0) {
        const initial: any = {}
        for (const g of groups) {
          initial[g.id] = { groupName: g.name, type: g.type, min: g.min, max: g.max, isRequired: g.isRequired, selected: [] }
        }
        setSelections(initial)
      } else { setSelections({}) }
    }
  }, [open, groups])

  const hasPromo = product.pricePromotional && product.pricePromotional < product.price
  const basePrice = hasPromo ? product.pricePromotional! : product.price
  const hasComplements = groups && groups.length > 0

  const totalExtra = useMemo(() => {
    let t = 0
    for (const gId in selections) selections[gId].selected.forEach(s => t += s.price)
    return t
  }, [selections])

  const handleToggle = (group: ComplementGroup, item: Complement) => {
    setSelections(prev => {
      const g = { ...prev[group.id] }
      const exists = g.selected.find(s => s.complementId === item.id)
      if (group.type === 'radio') {
        g.selected = exists ? [] : [{ complementId: item.id, name: item.name, price: item.price }]
      } else {
        if (exists) g.selected = g.selected.filter(s => s.complementId !== item.id)
        else if (!group.max || g.selected.length < group.max) g.selected = [...g.selected, { complementId: item.id, name: item.name, price: item.price }]
      }
      return { ...prev, [group.id]: g }
    })
    setErrors([])
  }

  const handleAdd = () => {
    if (hasComplements) {
      const errs: string[] = []
      for (const gId in selections) {
        const g = selections[gId]
        if (g.selected.length < g.min) errs.push(`Selecione pelo menos ${g.min} opção em "${g.groupName}"`)
      }
      if (errs.length) { setErrors(errs); return }
    }
    const complements = hasComplements
      ? Object.entries(selections).filter(([_, g]) => g.selected.length > 0).map(([gId, g]) => ({ groupId: gId, groupName: g.groupName, items: g.selected.map(s => ({ complementId: s.complementId, name: s.name, price: s.price })) }))
      : undefined
    for (let i = 0; i < qty; i++) {
      addItem({ productId: product.id, productName: product.name, description: product.description, unitPrice: basePrice, notes: notes || undefined, complements, complementPrice: totalExtra })
    }
    setAdded(true)
    showToast(`${qty}x ${product.name} adicionado${qty > 1 ? 's' : ''} ao carrinho!`, 'success')
    setTimeout(() => { setAdded(false); onClose() }, 600)
  }

  if (!open) return null

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="animate-scaleIn" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '92%', maxWidth: 500, maxHeight: '88vh', background: '#fff',
        borderRadius: 16, zIndex: 300, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
      }}>
        <div style={{ position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 8, right: 8, zIndex: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,.4)', color: '#fff', border: 'none',
            fontSize: '1rem', cursor: 'pointer',
          }}>✕</button>
          <div style={{
            width: '100%', height: 180,
            background: !imgLoaded ? 'linear-gradient(135deg, #f5f5f5, #e0e0e0)' : '#f0f0f0',
          }}>
            {product.image ? (
              <img src={product.image} alt={product.name} onLoad={() => setImgLoaded(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgLoaded ? 1 : 0 }} />
            ) : (
              <div style={{ fontSize: '3rem', opacity: .3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>🥪</div>
            )}
            {hasPromo && (
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(135deg, #27ae60, #2ecc71)', color: '#fff', fontSize: '.7rem', fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                {Math.round((1 - product.pricePromotional! / product.price) * 100)}% OFF
              </div>
            )}
          </div>
        </div>

        <div style={{ overflow: 'auto', padding: '16px 20px 20px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{product.name}</h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                {hasPromo ? (
                  <>
                    <span style={{ fontSize: '.75rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>R$ {product.price.toFixed(2)}</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)' }}>R$ {product.pricePromotional!.toFixed(2)}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '1.3rem', fontWeight: 900 }}>R$ {product.price.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>

          {product.description && (
            <p style={{ fontSize: '.85rem', color: 'var(--text-light)', marginTop: 8, lineHeight: 1.5 }}>{product.description}</p>
          )}

          {product.ingredients.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {product.ingredients.map((ing, i) => (
                <span key={i} style={{ fontSize: '.7rem', padding: '2px 10px', borderRadius: 20, background: 'var(--bg)', color: 'var(--text-light)' }}>{ing}</span>
              ))}
            </div>
          )}

          <div className="divider" />

          {hasComplements && groups!.map(group => (
            <div key={group.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ fontSize: '.85rem', fontWeight: 600 }}>{group.name}{group.isRequired && <span style={{ color: 'var(--danger)' }}> *</span>}</h3>
                <span style={{ fontSize: '.7rem', color: 'var(--text-light)' }}>
                  {group.type === 'radio' ? 'Escolha 1' : `${selections[group.id]?.selected.length || 0}/${group.max || '∞'}`}
                </span>
              </div>
              {group.items.map(item => {
                const sel = selections[group.id]?.selected.some(s => s.complementId === item.id)
                return (
                  <div key={item.id} onClick={() => handleToggle(group, item)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', marginBottom: 4, cursor: 'pointer',
                    borderRadius: 8, border: `1px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                    background: sel ? 'var(--primary-light)' : 'transparent',
                    transition: 'all .15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: group.type === 'radio' ? '50%' : 4,
                        border: `2px solid ${sel ? 'var(--primary)' : '#ccc'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: sel ? 'var(--primary)' : 'transparent',
                      }}>
                        {sel && <span style={{ color: '#fff', fontSize: '.6rem' }}>✓</span>}
                      </span>
                      <span style={{ fontSize: '.8rem' }}>{item.name}</span>
                    </div>
                    {item.price > 0 && <span style={{ fontSize: '.8rem', fontWeight: 600 }}>+R$ {item.price.toFixed(2)}</span>}
                  </div>
                )
              })}
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-light)' }}>OBSERVAÇÃO</label>
            <input className="input mt-xs" placeholder="Algum pedido especial?" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%' }} />
          </div>

          {errors.length > 0 && (
            <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: '.8rem' }}>
              {errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
            </div>
          )}
        </div>

        <div style={{
          borderTop: '1px solid var(--border)', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '8px 12px', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>−</button>
            <span style={{ padding: '8px 14px', fontWeight: 700, fontSize: '.9rem' }}>{qty}</span>
            <button onClick={() => setQty(q => q + 1)} style={{ padding: '8px 12px', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>+</button>
          </div>
          <button className={`btn ${added ? 'btn-success' : 'btn-primary'}`} style={{ flex: 1, padding: '10px', fontWeight: 700, fontSize: '.9rem' }} onClick={handleAdd}>
            {added ? '✓ Adicionado' : `Adicionar • R$ ${((basePrice + totalExtra) * qty).toFixed(2)}`}
          </button>
        </div>
      </div>
    </>
  )
}
