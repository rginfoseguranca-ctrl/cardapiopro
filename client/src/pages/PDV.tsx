import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { pdvGetProducts, pdvSearchCustomers, occupyTable, createOrder, validateCoupon } from '../api/client'
import { usePdvCart } from '../hooks/usePdvCart'
import VendaAvulsa from '../components/VendaAvulsa'

const COLORS = {
  primary: '#e74c3c',
  primaryDark: '#c0392b',
  bg: '#f0f2f5',
  card: '#fff',
  text: '#2c3e50',
  textLight: '#7f8c8d',
  border: '#e0e0e0',
  success: '#27ae60',
  warning: '#f39c12',
  accent: '#3498db',
}

const formatPrice = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

/* ───── ProductGrid ───── */
function ProductGrid({
  products, categories, complements, onAdd,
}: {
  products: any[]; categories: any[]; complements: Record<string, any[]>
  onAdd: (p: any, comps?: any[], qty?: number) => void
}) {
  const [catFilter, setCatFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const filtered = useMemo(() => {
    let list = products
    if (catFilter !== 'all') list = list.filter((p: any) => p.category_id === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p: any) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    }
    return list
  }, [products, catFilter, search])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar produto..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: '.9rem' }}
        />
        <button className="btn btn-sm btn-outline" onClick={() => setCatFilter('all')}
          style={catFilter === 'all' ? { background: COLORS.primary, color: '#fff' } : {}}>
          Todos
        </button>
        {categories.map((c: any) => (
          <button key={c.id} className="btn btn-sm btn-outline" onClick={() => setCatFilter(c.id)}
            style={catFilter === c.id ? { background: COLORS.primary, color: '#fff' } : {}}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, alignContent: 'start' }}>
        {filtered.map((p: any) => {
          const hasComps = complements[p.id]?.length
          return (
            <div key={p.id}
              onClick={() => hasComps ? setSelectedProduct(p) : onAdd(p)}
              style={{
                background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`,
                padding: 12, cursor: 'pointer', transition: 'all .15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,.06)',
              }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)')}
              onMouseOut={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.06)')}
            >
              {p.image ? (
                <img src={p.image} alt={p.name} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <div style={{ width: '100%', height: 90, background: '#f8f9fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🍽️</div>
              )}
              <div style={{ fontWeight: 600, fontSize: '.85rem', textAlign: 'center', color: COLORS.text }}>{p.name}</div>
              <div style={{ fontWeight: 700, color: COLORS.primary, fontSize: '.9rem' }}>{formatPrice(p.price)}</div>
              {hasComps && <span style={{ fontSize: '.7rem', color: COLORS.accent }}>+ complementos</span>}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: COLORS.textLight }}>
            Nenhum produto encontrado
          </div>
        )}
      </div>

      {selectedProduct && (
        <ComplementModal
          product={selectedProduct}
          groups={complements[selectedProduct.id] || []}
          onConfirm={(comps) => { onAdd(selectedProduct, comps); setSelectedProduct(null) }}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}

/* ───── ComplementModal ───── */
function ComplementModal({ product, groups, onConfirm, onClose }: {
  product: any; groups: any[]; onConfirm: (comps: any[]) => void; onClose: () => void
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({})

  const toggle = (groupId: string, itemId: string, max: number) => {
    setSelected(prev => {
      const current = prev[groupId] || []
      if (current.includes(itemId)) {
        return { ...prev, [groupId]: current.filter(i => i !== itemId) }
      }
      if (max === 1) return { ...prev, [groupId]: [itemId] }
      if (current.length >= max) return prev
      return { ...prev, [groupId]: [...current, itemId] }
    })
  }

  const buildComps = () => groups.map(g => ({
    groupId: g.id, groupName: g.name,
    items: (selected[g.id] || []).map(itemId => {
      const item = g.items?.find((i: any) => i.id === itemId)
      return { complementId: itemId, name: item?.name || '', price: Number(item?.price || 0) }
    }),
  })).filter(c => c.items.length > 0)

  const totalAdd = product.price + buildComps().reduce((s, g) => s + g.items.reduce((a, i) => a + i.price, 0), 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{product.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: COLORS.textLight }}>✕</button>
        </div>
        <p style={{ color: COLORS.textLight, marginBottom: 16, fontSize: '.85rem' }}>{product.description}</p>

        {groups.map(g => (
          <div key={g.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 6, color: COLORS.text }}>
              {g.name} {g.max === 1 ? '(1 opção)' : `(até ${g.max})`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {g.items?.map((item: any) => {
                const sel = (selected[g.id] || []).includes(item.id)
                return (
                  <label key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      borderRadius: 8, border: `1px solid ${sel ? COLORS.primary : COLORS.border}`,
                      background: sel ? '#fef2f2' : COLORS.card, cursor: 'pointer',
                    }}
                  >
                    <input type={g.max === 1 ? 'radio' : 'checkbox'}
                      name={`comp_${g.id}`} checked={sel}
                      onChange={() => toggle(g.id, item.id, g.max)}
                      style={{ accentColor: COLORS.primary }}
                    />
                    <span style={{ flex: 1, fontSize: '.85rem' }}>{item.name}</span>
                    {Number(item.price) > 0 && (
                      <span style={{ color: COLORS.primary, fontWeight: 600, fontSize: '.8rem' }}>+{formatPrice(Number(item.price))}</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => onConfirm(buildComps())}
          style={{
            width: '100%', padding: 12, background: COLORS.success, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Adicionar • {formatPrice(totalAdd)}
        </button>
      </div>
    </div>
  )
}

/* ───── CartPanel ───── */
function CartPanel({ isMobile }: { isMobile?: boolean }) {
  const {
    items, removeItem, updateQty, updateNotes, customer, setCustomer,
    orderType, setOrderType, tableNumber, setTable,
    discount, setDiscount, coupon, setCoupon, notes, setNotes,
    heldOrders, holdOrder, recallOrder, discardHeld, clear,
    _counter,
  } = usePdvCart()

  const [paymentModal, setPaymentModal] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<any[]>([])

  useEffect(() => {
    if (customerSearch.trim().length < 2) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      try { setCustomerResults(await pdvSearchCustomers(customerSearch)) } catch { }
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0)
  const discountVal = discount?.type === 'percent' ? subtotal * (discount.value / 100) : (discount?.value || 0)
  const couponVal = coupon?.discount || 0
  const total = Math.max(0, subtotal - discountVal - couponVal)

  const addHeld = () => { holdOrder() }

  return (
    <div style={{
      width: isMobile ? '100%' : 380, background: COLORS.card, borderLeft: isMobile ? 'none' : `1px solid ${COLORS.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Order type + Table */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {(['balcao', 'mesa', 'delivery'] as const).map(t => (
            <button key={t}
              onClick={() => setOrderType(t)}
              style={{
                flex: 1, padding: '6px 0', fontSize: '.75rem', fontWeight: 600, borderRadius: 6,
                border: orderType === t ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                background: orderType === t ? COLORS.primary : COLORS.card,
                color: orderType === t ? '#fff' : COLORS.text, cursor: 'pointer',
              }}
            >
              {t === 'balcao' ? '🏪 Balcão' : t === 'mesa' ? '🪑 Mesa' : '🛵 Delivery'}
            </button>
          ))}
        </div>
        {orderType === 'mesa' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '.8rem', color: COLORS.textLight }}>Mesa:</span>
            <input type="number" min={1} placeholder="Nº"
              value={tableNumber ?? ''}
              onChange={e => setTable(e.target.value ? Number(e.target.value) : null)}
              style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.85rem' }}
            />
            {tableNumber && (
              <button className="btn btn-sm btn-outline" onClick={async () => {
                try { await occupyTable(String(tableNumber), customer?.name, customer?.phone) } catch {}
              }}>Ocupar</button>
            )}
          </div>
        )}
      </div>

      {/* Cart items */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 14px' }}>
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: COLORS.textLight }}>
            Carrinho vazio<br /><span style={{ fontSize: '.8rem' }}>Clique nos produtos para adicionar</span>
          </div>
        )}
        {items.map((item, idx) => (
          <div key={item.id} style={{
            padding: '10px 0', borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '.85rem', color: COLORS.text }}>{item.productName}</div>
                {item.complements?.map(g => (
                  <div key={g.groupId} style={{ fontSize: '.75rem', color: COLORS.textLight, marginTop: 2 }}>
                    {g.items.map(i => i.name).join(', ')}
                  </div>
                ))}
              </div>
              <button onClick={() => removeItem(idx)}
                style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '.85rem', padding: 2 }}>
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => updateQty(idx, item.quantity - 1)}
                  style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${COLORS.border}`, background: COLORS.card, cursor: 'pointer' }}>−</button>
                <span style={{ fontWeight: 600, fontSize: '.85rem', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateQty(idx, item.quantity + 1)}
                  style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${COLORS.border}`, background: COLORS.card, cursor: 'pointer' }}>+</button>
              </div>
              <div style={{ fontWeight: 700, fontSize: '.9rem', color: COLORS.text }}>{formatPrice(item.totalPrice)}</div>
            </div>
            <input placeholder="Observação..."
              value={item.notes || ''}
              onChange={e => updateNotes(idx, e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: '4px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.75rem' }}
            />
          </div>
        ))}
      </div>

      {/* Customer + Notes */}
      <div style={{ padding: '8px 14px', borderTop: `1px solid ${COLORS.border}` }}>
        <input placeholder="Buscar cliente por nome ou telefone..."
          value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.8rem', marginBottom: 4 }}
        />
        {customerResults.length > 0 && (
          <div style={{ maxHeight: 120, overflow: 'auto', marginBottom: 4, border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
            {customerResults.map(c => (
              <div key={c.id}
                onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]) }}
                style={{ padding: '6px 10px', cursor: 'pointer', fontSize: '.8rem', borderBottom: `1px solid ${COLORS.border}` }}
                onMouseOver={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                {c.name} — {c.phone}
              </div>
            ))}
          </div>
        )}
        {customer && (
          <div style={{ fontSize: '.8rem', color: COLORS.text, marginBottom: 4 }}>
            Cliente: {customer.name} {customer.phone && `(${customer.phone})`}
            <button onClick={() => setCustomer(null)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        <input placeholder="Observações do pedido..."
          value={notes} onChange={e => setNotes(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.8rem' }}
        />
      </div>

      {/* Discount */}
      <div style={{ padding: '8px 14px', borderTop: `1px solid ${COLORS.border}` }}>
        <DiscountRow discount={discount} coupon={coupon}
          onChangeDiscount={setDiscount} onChangeCoupon={setCoupon}
          subtotal={subtotal}
        />
      </div>

      {/* Totals */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${COLORS.border}`, background: '#fafafa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', color: COLORS.textLight }}>
          <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
        </div>
        {discountVal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: COLORS.warning }}>
            <span>Desconto</span><span>-{formatPrice(discountVal)}</span>
          </div>
        )}
        {couponVal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: COLORS.warning }}>
            <span>Cupom</span><span>-{formatPrice(couponVal)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: COLORS.text, marginTop: 4 }}>
          <span>Total</span><span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 8 }}>
        <button onClick={addHeld} disabled={items.length === 0}
          style={{ flex: 1, padding: '8px 0', background: '#f0f0f0', border: 'none', borderRadius: 8, fontWeight: 600, cursor: items.length > 0 ? 'pointer' : 'not-allowed', fontSize: '.8rem', color: COLORS.text }}>
          ⏸ Suspender
        </button>
        <button onClick={clear} disabled={items.length === 0}
          style={{ flex: 1, padding: '8px 0', background: '#fef2f2', border: 'none', borderRadius: 8, fontWeight: 600, cursor: items.length > 0 ? 'pointer' : 'not-allowed', fontSize: '.8rem', color: '#e74c3c' }}>
          🗑 Limpar
        </button>
      </div>
      <div style={{ padding: '0 14px 10px' }}>
        {orderType === 'mesa' && !tableNumber && items.length > 0 && (
          <div style={{ fontSize: '.75rem', color: '#e74c3c', marginBottom: 6, textAlign: 'center' }}>
            ⚠️ Informe o número da mesa para finalizar
          </div>
        )}
        <button onClick={() => setPaymentModal(true)} disabled={items.length === 0 || (orderType === 'mesa' && !tableNumber)}
          style={{
            width: '100%', padding: 14, background: items.length > 0 && (orderType !== 'mesa' || tableNumber) ? COLORS.success : '#ccc', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: '1.05rem', fontWeight: 700,
            cursor: items.length > 0 && (orderType !== 'mesa' || tableNumber) ? 'pointer' : 'not-allowed',
          }}>
          💳 Finalizar Pedido • {formatPrice(total)}
        </button>
      </div>

      {/* Held Orders */}
      {heldOrders.length > 0 && (
        <div style={{ borderTop: `2px dashed ${COLORS.border}`, padding: '8px 14px' }}>
          <div style={{ fontSize: '.8rem', fontWeight: 600, color: COLORS.textLight, marginBottom: 6 }}>
            ⏸ Pedidos Suspensos ({heldOrders.length})
          </div>
          {heldOrders.map(h => (
            <div key={h.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 8px', background: '#fef9e7', borderRadius: 6, marginBottom: 4, fontSize: '.78rem',
            }}>
              <div>
                <span style={{ fontWeight: 600 }}>{h.items.length} itens</span>
                <span style={{ color: COLORS.textLight, marginLeft: 6 }}>{formatPrice(h.total)}</span>
                {h.tableNumber && <span style={{ marginLeft: 6 }}>Mesa {h.tableNumber}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => recallOrder(h.id)} style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: '.7rem' }}>Retomar</button>
                <button onClick={() => discardHeld(h.id)} style={{ background: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer', fontSize: '.8rem' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {paymentModal && (
        <PaymentModal
          total={total} subtotal={subtotal} customer={customer} orderType={orderType}
          tableNumber={tableNumber} notes={notes}
          discount={discount} coupon={coupon}
          onClose={() => setPaymentModal(false)}
          onSuccess={() => { setPaymentModal(false); clear() }}
        />
      )}
    </div>
  )
}

/* ───── DiscountRow ───── */
function DiscountRow({ discount, coupon, onChangeDiscount, onChangeCoupon, subtotal }: {
  discount: any; coupon: any; onChangeDiscount: any; onChangeCoupon: any; subtotal: number
}) {
  const [showDiscount, setShowDiscount] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    if (!coupon?.code || coupon.code.trim().length < 2) { setCouponError(null); return }
    const t = setTimeout(async () => {
      setValidating(true)
      setCouponError(null)
      try {
        const res = await validateCoupon(coupon.code.trim(), subtotal)
        onChangeCoupon({ code: coupon.code.trim(), discount: res.discount, couponId: res.coupon?.id })
      } catch (err: any) {
        setCouponError(err?.response?.data?.error || err.message || 'Cupom inválido')
        onChangeCoupon({ code: coupon.code.trim(), discount: 0, couponId: undefined })
      } finally { setValidating(false) }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon?.code, subtotal])

  return (
    <div>
      <button onClick={() => setShowDiscount(!showDiscount)}
        style={{ background: 'none', border: 'none', color: COLORS.accent, cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, padding: 0 }}>
        {showDiscount ? '−' : '+'} Desconto / Cupom
      </button>
      {showDiscount && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select value={discount?.type || 'percent'}
              onChange={e => onChangeDiscount({ type: e.target.value, value: discount?.value || 0 })}
              style={{ padding: '4px 6px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.78rem' }}>
              <option value="percent">%</option>
              <option value="fixed">R$</option>
            </select>
            <input type="number" min={0} placeholder="Valor"
              value={discount?.value ?? ''}
              onChange={e => onChangeDiscount({ type: discount?.type || 'percent', value: Number(e.target.value) })}
              style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.78rem' }}
            />
            <button onClick={() => onChangeDiscount(null)}
              style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '.85rem' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input placeholder="Código do cupom"
              value={coupon?.code || ''}
              onChange={e => onChangeCoupon({ code: e.target.value, discount: 0 })}
              style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: `1px solid ${couponError ? '#e74c3c' : COLORS.border}`, fontSize: '.78rem' }}
            />
            {validating && <span style={{ fontSize: '.7rem', color: COLORS.textLight }}>validando...</span>}
            {coupon?.code && <button onClick={() => { onChangeCoupon(null); setCouponError(null) }}
              style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '.85rem' }}>✕</button>}
          </div>
          {couponError && <div style={{ fontSize: '.72rem', color: '#e74c3c' }}>❌ {couponError}</div>}
          {!couponError && Number(coupon?.discount) > 0 && (
            <div style={{ fontSize: '.72rem', color: COLORS.success }}>✅ Cupom aplicado: -{formatPrice(Number(coupon.discount))}</div>
          )}
        </div>
      )}
    </div>
  )
}

/* ───── PaymentModal ───── */
function PaymentModal({ total, subtotal, customer, orderType, tableNumber, notes, discount, coupon, onClose, onSuccess }: {
  total: number; subtotal: number; customer: any; orderType: string; tableNumber: number | null
  notes: string; discount: any; coupon: any; onClose: () => void; onSuccess: () => void
}) {
  const [method, setMethod] = useState('dinheiro')
  const [changeFor, setChangeFor] = useState('')
  const [loading, setLoading] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  const payMethods = [
    { key: 'dinheiro', label: '💵 Dinheiro' },
    { key: 'debito', label: '💳 Débito' },
    { key: 'credito', label: '💳 Crédito' },
    { key: 'pix', label: '📱 Pix' },
    { key: 'fiado', label: '📝 Fiado' },
  ]

  const change = method === 'dinheiro' && Number(changeFor) > total ? Number(changeFor) - total : 0
  const discountVal = discount?.type === 'percent' ? subtotal * (Number(discount.value) / 100) : (discount?.value || 0)

  const handleFinish = async () => {
    if (orderType === 'mesa' && !tableNumber) { setFinishError('Informe o número da mesa para finalizar.'); return }
    setLoading(true)
    setFinishError(null)
    try {
      const items = usePdvCart.getState().items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        complements: item.complements,
        notes: item.notes,
      }))
      const orderData: any = {
        customerName: customer?.name || 'Balcão',
        customerPhone: customer?.phone || '00000000000',
        items,
        paymentMethod: method,
        paymentStatus: method === 'fiado' ? 'pending' : 'paid',
        deliveryType: orderType === 'delivery' ? 'delivery' : (orderType === 'mesa' ? 'dine-in' : 'pickup'),
        tableNumber: tableNumber || undefined,
        notes: notes || undefined,
        discount: Math.min(Number(discountVal) || 0, subtotal),
        couponCode: coupon?.code || undefined,
        couponDiscount: Number(coupon?.discount) || 0,
      }
      if (method === 'dinheiro' && change > 0) {
        orderData.changeFor = Number(changeFor)
      }
      await createOrder(orderData)
      if (orderType === 'mesa' && tableNumber) {
        await occupyTable(String(tableNumber), customer?.name, customer?.phone).catch(() => {})
      }
      onSuccess()
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Erro desconhecido'
      console.error('❌ createOrder failed:', msg, err)
      setFinishError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>💳 Finalizar Pedido</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: COLORS.textLight }}>✕</button>
        </div>

        <div style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', color: COLORS.primary, marginBottom: 20 }}>
          {formatPrice(total)}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 8, color: COLORS.text }}>Forma de Pagamento</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {payMethods.map(m => (
              <button key={m.key}
                onClick={() => setMethod(m.key)}
                style={{
                  padding: '10px 0', borderRadius: 8, fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
                  border: method === m.key ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                  background: method === m.key ? '#fef2f2' : COLORS.card,
                  color: COLORS.text,
                }}
              >{m.label}</button>
            ))}
          </div>
        </div>

        {method === 'dinheiro' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '.8rem', color: COLORS.textLight, display: 'block', marginBottom: 4 }}>Valor recebido</label>
            <input type="number" step="0.01" min={0} placeholder="R$ 0,00"
              value={changeFor} onChange={e => setChangeFor(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: '.9rem' }}
            />
            {change > 0 && (
              <div style={{ marginTop: 6, fontWeight: 700, color: COLORS.warning, fontSize: '.9rem' }}>
                Troco: {formatPrice(change)}
              </div>
            )}
          </div>
        )}

        {finishError && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fef5f5', border: '1px solid #f5c6cb', borderRadius: 8, fontSize: '.82rem', color: '#c0392b' }}>
            ❌ {finishError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 10, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleFinish} disabled={loading}
            style={{
              flex: 2, padding: 10, background: COLORS.success, color: '#fff', border: 'none',
              borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? 'Processando...' : `✅ Finalizar`}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───── Main PDV ───── */
export default function PDV({ standalone }: { standalone?: boolean }) {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['pdvProducts'], queryFn: pdvGetProducts })
  const addItem = usePdvCart(s => s.addItem)
  const cartCount = usePdvCart(s => s.items.length)
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products')
  const [mode, setMode] = useState<'avulso' | 'completo'>('avulso')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (isMobile && cartCount > 0) setMobileView('cart')
  }, [cartCount, isMobile])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.textLight }}>
          Carregando PDV...
        </div>
      )
    }

    if (isError || !data) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40, color: COLORS.textLight }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: COLORS.text }}>Erro ao carregar PDV</div>
          <div style={{ fontSize: '.85rem', textAlign: 'center', maxWidth: 400, color: '#e74c3c' }}>
            {error instanceof Error ? error.message : 'Erro desconhecido. Verifique se o servidor está rodando.'}
          </div>
          <button onClick={() => refetch()} style={{ padding: '10px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Tentar novamente
          </button>
        </div>
      )
    }

    const categories = data.categories || []
    const products = data.products || []
    const complements = data.complements || {}

    if (mode === 'avulso') {
      return <VendaAvulsa products={products} categories={categories} complements={complements} />
    }

    return (
      <div style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        flex: 1, background: COLORS.bg, overflow: 'hidden',
      }}>
        {/* Mobile Toggle Tab */}
        {isMobile && (
          <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.card }}>
            <button
              onClick={() => setMobileView('products')}
              style={{
                flex: 1, padding: '10px 0', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
                border: 'none', borderBottom: mobileView === 'products' ? `2px solid ${COLORS.primary}` : '2px solid transparent',
                background: 'transparent', color: mobileView === 'products' ? COLORS.primary : COLORS.textLight,
              }}
            >
              🍔 Produtos
            </button>
            <button
              onClick={() => setMobileView('cart')}
              style={{
                flex: 1, padding: '10px 0', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
                border: 'none', borderBottom: mobileView === 'cart' ? `2px solid ${COLORS.primary}` : '2px solid transparent',
                background: 'transparent', color: mobileView === 'cart' ? COLORS.primary : COLORS.textLight,
              }}
            >
              🛒 Carrinho {cartCount > 0 && `(${cartCount})`}
            </button>
          </div>
        )}

        {(!isMobile || mobileView === 'products') && (
          <ProductGrid
            products={products}
            categories={categories}
            complements={complements}
            onAdd={(p, comps) => addItem(p, comps)}
          />
        )}

        {(!isMobile || mobileView === 'cart') && (
          <CartPanel isMobile={isMobile} />
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: standalone ? '100vh' : '100%',
      background: COLORS.bg, overflow: 'hidden',
    }}>
      {/* Mode selector */}
      <div style={{
        display: 'flex', flexShrink: 0, background: COLORS.card,
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <button
          onClick={() => setMode('avulso')}
          style={{
            flex: 1, padding: '10px 0', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer',
            border: 'none', borderBottom: mode === 'avulso' ? `3px solid ${COLORS.primary}` : '3px solid transparent',
            background: mode === 'avulso' ? '#fef2f2' : 'transparent',
            color: mode === 'avulso' ? COLORS.primary : COLORS.textLight,
          }}
        >
          🛒 Venda Avulsa
        </button>
        <button
          onClick={() => setMode('completo')}
          style={{
            flex: 1, padding: '10px 0', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer',
            border: 'none', borderBottom: mode === 'completo' ? `3px solid ${COLORS.primary}` : '3px solid transparent',
            background: mode === 'completo' ? '#fef2f2' : 'transparent',
            color: mode === 'completo' ? COLORS.primary : COLORS.textLight,
          }}
        >
          🧾 PDV Completo
        </button>
      </div>
      {renderContent()}
    </div>
  )
}
