import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createOrder, validateCoupon, pdvSearchCustomers } from '../api/client'
import { usePdvCart } from '../hooks/usePdvCart'

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
  cashbar: '#17212b',
}

const formatPrice = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

function hasRequiredGroups(product: any, complements: Record<string, any[]>): boolean {
  const groups = complements[product.id] || []
  return groups.some((g: any) => g.isRequired)
}

/* ───── Beep (Web Audio, sem assets) ───── */
let _ctx: AudioContext | null = null
function beep(count = 1, freq = 880) {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    if (!_ctx) _ctx = new AC()
    if (_ctx.state === 'suspended') _ctx.resume()
    for (let i = 0; i < count; i++) {
      const t0 = _ctx.currentTime + i * 0.14
      const osc = _ctx.createOscillator()
      const gain = _ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.08, t0)
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09)
      osc.connect(gain)
      gain.connect(_ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 0.1)
    }
  } catch { }
}

/* ───── ComplementModal (compacto) ───── */
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

/* ───── PaymentModal (simples, 4 métodos + fiado, troco) ───── */
function PaymentModalAvulso({ subtotal, discountVal, couponDiscount, customer, notes, onClose, onSuccess }: {
  subtotal: number; discountVal: number; couponDiscount: number
  customer: any; notes: string; onClose: () => void; onSuccess: (method: string, change: number) => void
}) {
  const total = Math.max(0, subtotal - discountVal - couponDiscount)
  const [method, setMethod] = useState('dinheiro')
  const [changeFor, setChangeFor] = useState('')
  const [loading, setLoading] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  const change = method === 'dinheiro' && Number(changeFor) > total ? Number(changeFor) - total : 0

  const handleFinish = async () => {
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
        customerName: customer?.name || 'Avulso',
        customerPhone: customer?.phone || '00000000000',
        items,
        paymentMethod: method,
        paymentStatus: method === 'fiado' ? 'pending' : 'paid',
        deliveryType: 'pickup',
        notes: notes || undefined,
        discount: Math.min(Number(discountVal) || 0, subtotal),
        couponDiscount: Number(couponDiscount) || 0,
      }
      if (method === 'dinheiro' && change > 0) {
        orderData.changeFor = Number(changeFor)
      }
      await createOrder(orderData)
      beep(2, 1318)
      onSuccess(method, change)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Erro desconhecido'
      setFinishError(msg)
      beep(1, 220)
    } finally {
      setLoading(false)
    }
  }

  const payMethods = [
    { key: 'dinheiro', label: '💵 Dinheiro', big: true },
    { key: 'pix', label: '📱 Pix' },
    { key: 'debito', label: '💳 Débito' },
    { key: 'credito', label: '💳 Crédito' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>💳 Finalizar Venda</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: COLORS.textLight }}>✕</button>
        </div>

        <div style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', color: COLORS.primary, marginBottom: 20 }}>
          {formatPrice(total)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {payMethods.map(m => (
            <button key={m.key}
              onClick={() => setMethod(m.key)}
              style={{
                padding: '14px 0', borderRadius: 10, fontSize: m.big ? '1rem' : '.85rem', fontWeight: 700, cursor: 'pointer',
                border: method === m.key ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                background: method === m.key ? '#fef2f2' : COLORS.card,
                color: COLORS.text, gridColumn: m.big ? '1 / -1' : 'auto',
              }}
            >{m.label}</button>
          ))}
        </div>
        <button onClick={() => setMethod('fiado')}
          style={{
            width: '100%', marginTop: 8, padding: 8, borderRadius: 8, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
            border: method === 'fiado' ? `2px solid ${COLORS.warning}` : `1px dashed ${COLORS.border}`,
            background: method === 'fiado' ? '#fef9ec' : 'transparent', color: COLORS.textLight,
          }}>
          📝 Fiado {method === 'fiado' && '(pagamento pendente)'}
        </button>

        {method === 'dinheiro' && (
          <div style={{ margin: 14 }}>
            <label style={{ fontSize: '.8rem', color: COLORS.textLight, display: 'block', marginBottom: 4 }}>Valor recebido (Enter finaliza)</label>
            <input type="number" step="0.01" min={0} placeholder="R$ 0,00" autoFocus
              value={changeFor} onChange={e => setChangeFor(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleFinish() }}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: '1rem' }}
            />
            {change > 0 && (
              <div style={{ marginTop: 8, fontWeight: 800, color: COLORS.warning, fontSize: '1.05rem' }}>
                💵 Troco: {formatPrice(change)}
              </div>
            )}
          </div>
        )}

        {finishError && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fef5f5', border: '1px solid #f5c6cb', borderRadius: 8, fontSize: '.82rem', color: '#c0392b' }}>
            ❌ {finishError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 12, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleFinish} disabled={loading}
            style={{
              flex: 2, padding: 12, background: COLORS.success, color: '#fff', border: 'none',
              borderRadius: 8, fontWeight: 800, fontSize: '1.05rem', cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? 'Processando...' : `✅ Finalizar (Enter)`}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───── CartPanel (simples: itens +/-, opções recolhíveis) ───── */
function CartPanel({ totals, scanCode, setScanCode, couponError, customerSearch, setCustomerSearch, customerResults, setCustomerResults, onFinalize, onClose, isSheet }: {
  totals: { cartCount: number; subtotal: number; discountVal: number; couponVal: number; total: number }
  scanCode: string; setScanCode: (v: string) => void; couponError: string | null
  customerSearch: string; setCustomerSearch: (v: string) => void; customerResults: any[]
  setCustomerResults: (v: any[]) => void
  onFinalize: () => void; onClose: () => void; isSheet: boolean
}) {
  const { items, removeItem, updateQty, clear, customer, setCustomer, discount, setDiscount, coupon, notes, setNotes } = usePdvCart()
  const [optionsOpen, setOptionsOpen] = useState(false)
  const { cartCount, subtotal, discountVal, couponVal, total } = totals

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: COLORS.card, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontWeight: 700, fontSize: '.85rem', color: COLORS.text }}>
          🛒 Carrinho {cartCount > 0 && <span style={{ color: COLORS.textLight, fontWeight: 600 }}>({cartCount} itens)</span>}
        </div>
        {isSheet && <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: COLORS.textLight, cursor: 'pointer' }}>✕</button>}
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 14px' }}>
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: COLORS.textLight, fontSize: '.85rem' }}>
            Carrinho vazio
            <br /><span style={{ fontSize: '.72rem' }}>Toque nos produtos ou passe o código de barras</span>
          </div>
        )}
        {items.map((item, idx) => (
          <div key={item.id} style={{ padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, fontWeight: 600, fontSize: '.8rem', color: COLORS.text }}>{item.productName}</div>
              <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '.85rem', padding: 2 }}>✕</button>
            </div>
            {item.complements?.map(g => (
              <div key={g.groupId} style={{ fontSize: '.7rem', color: COLORS.textLight }}>{g.items.map(i => i.name).join(', ')}</div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => updateQty(idx, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${COLORS.border}`, background: COLORS.card, cursor: 'pointer', fontWeight: 700 }}>−</button>
                <span style={{ fontWeight: 700, fontSize: '.85rem', minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateQty(idx, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${COLORS.border}`, background: COLORS.card, cursor: 'pointer', fontWeight: 700 }}>+</button>
              </div>
              <div style={{ fontWeight: 800, fontSize: '.85rem', color: COLORS.text }}>{formatPrice(item.totalPrice)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Options (collapsible) */}
      <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <button
          onClick={() => setOptionsOpen(o => !o)}
          style={{ width: '100%', padding: '9px 14px', background: '#fafafa', border: 'none', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, color: COLORS.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚙️ Opções {customer || discount || coupon || notes ? '·' : ''}</span>
          <span style={{ color: COLORS.textLight }}>{optionsOpen ? '▲' : '▼'}</span>
        </button>

        {optionsOpen && (
          <div style={{ padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 190, overflow: 'auto' }}>
            {/* Customer */}
            {!customer ? (
              <>
                <input placeholder="Cliente (opcional) — Avulso por padrão"
                  value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.78rem' }} />
                {customerResults.length > 0 && (
                  <div style={{ maxHeight: 100, overflow: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
                    {customerResults.map(c => (
                      <div key={c.id}
                        onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]) }}
                        style={{ padding: '6px 10px', cursor: 'pointer', fontSize: '.75rem', borderBottom: `1px solid ${COLORS.border}` }}>
                        {c.name} — {c.phone}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: '.78rem', color: COLORS.text, display: 'flex', justifyContent: 'space-between' }}>
                <span>👤 {customer.name} {customer.phone && `(${customer.phone})`}</span>
                <button onClick={() => setCustomer(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
              </div>
            )}

            {/* Discount + coupon */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select value={discount?.type || 'percent'}
                onChange={e => setDiscount({ type: e.target.value as any, value: discount?.value || 0 })}
                style={{ padding: '5px 4px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.75rem' }}>
                <option value="percent">%</option>
                <option value="fixed">R$</option>
              </select>
              <input type="number" min={0} placeholder="Desconto"
                value={discount?.value ?? ''}
                onChange={e => setDiscount({ type: discount?.type || 'percent', value: Number(e.target.value) })}
                style={{ flex: 1, minWidth: 0, padding: '6px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.78rem' }} />
              {discount && <button onClick={() => setDiscount(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '.8rem' }}>✕</button>}
              <input placeholder="Cupom"
                value={scanCode} onChange={e => setScanCode(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: '6px 8px', borderRadius: 6, border: `1px solid ${couponError ? '#e74c3c' : COLORS.border}`, fontSize: '.78rem' }} />
            </div>
            {couponError && <div style={{ fontSize: '.7rem', color: '#e74c3c' }}>❌ {couponError}</div>}
            {!couponError && Number(coupon?.discount) > 0 && (
              <div style={{ fontSize: '.7rem', color: COLORS.success }}>✅ Cupom {coupon?.code}: -{formatPrice(Number(coupon?.discount) || 0)}</div>
            )}

            <input placeholder="Observações do pedido..." value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: '.78rem' }} />
          </div>
        )}

        {/* Totals */}
        <div style={{ padding: '8px 14px', borderTop: `1px solid ${COLORS.border}`, background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: COLORS.textLight }}>
            <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
          </div>
          {discountVal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', color: COLORS.warning }}>
              <span>Desconto</span><span>-{formatPrice(discountVal)}</span>
            </div>
          )}
          {couponVal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', color: COLORS.warning }}>
              <span>Cupom</span><span>-{formatPrice(couponVal)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: COLORS.text, marginTop: 4 }}>
            <span>Total</span><span>{formatPrice(total)}</span>
          </div>
        </div>

        <div style={{ padding: '8px 14px', display: 'flex', gap: 8 }}>
          <button onClick={clear} disabled={items.length === 0}
            style={{ padding: '10px 14px', background: '#fef2f2', border: 'none', borderRadius: 8, fontWeight: 700, cursor: items.length > 0 ? 'pointer' : 'not-allowed', fontSize: '.8rem', color: '#e74c3c' }}>
            🗑
          </button>
          <button onClick={onFinalize} disabled={items.length === 0}
            style={{
              flex: 1, padding: 13, background: items.length > 0 ? COLORS.success : '#ccc', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 800,
              cursor: items.length > 0 ? 'pointer' : 'not-allowed',
            }}>
            💳 Finalizar • {formatPrice(total)}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───── VendaAvulsa (food market minimalista) ───── */
export default function VendaAvulsa({ products, categories, complements }: {
  products: any[]; categories: any[]; complements: Record<string, any[]>
}) {
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [scanCode, setScanCode] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const [done, setDone] = useState<{ total: number; method: string; change: number; count: number } | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const searchRef = useRef<HTMLInputElement>(null)
  const lastAddedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { items, setCoupon, discount, coupon, customer, notes } = usePdvCart()

  const focusSearch = useCallback(() => {
    setTimeout(() => searchRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const cartCount = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0)
  const discountCalc = discount?.type === 'percent' ? subtotal * (Number(discount.value) / 100) : (discount?.value || 0)
  const couponVal = Number(coupon?.discount) || 0
  const total = Math.max(0, subtotal - discountCalc - couponVal)

  const qtyMap = useMemo(() => {
    const map: Record<string, number> = {}
    items.forEach(i => { map[i.productId] = (map[i.productId] || 0) + i.quantity })
    return map
  }, [items])

  /* coupon validation */
  useEffect(() => {
    const code = scanCode.trim()
    if (code.length < 2) { setCoupon(null); setCouponError(null); return }
    setCoupon({ code, discount: 0, couponId: undefined })
    const t = setTimeout(async () => {
      try {
        const res = await validateCoupon(code, subtotal)
        setCoupon({ code, discount: res.discount, couponId: res.coupon?.id })
        setCouponError(null)
      } catch (err: any) {
        setCouponError(err?.response?.data?.error || err.message || 'Cupom inválido')
        setCoupon({ code, discount: 0, couponId: undefined })
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanCode, subtotal])

  /* customer search */
  useEffect(() => {
    if (customerSearch.trim().length < 2) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      try { setCustomerResults(await pdvSearchCustomers(customerSearch)) } catch { }
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  /* last-added glow timer */
  useEffect(() => {
    if (lastAddedTimer.current) clearTimeout(lastAddedTimer.current)
    if (!lastAddedId) return
    lastAddedTimer.current = setTimeout(() => setLastAddedId(null), 900)
    return () => { if (lastAddedTimer.current) clearTimeout(lastAddedTimer.current) }
  }, [lastAddedId])

  /* done banner auto-hide */
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(null), 3000)
    return () => clearTimeout(t)
  }, [done])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q) {
      const barcodeMatch = products.filter(p => p.barcode && p.barcode.trim() === search.trim())
      if (barcodeMatch.length > 0) return barcodeMatch
    }
    let list = products
    if (catFilter !== 'all') list = list.filter((p: any) => p.category_id === catFilter)
    if (q) list = list.filter((p: any) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    return list
  }, [products, catFilter, search])

  const addItem = (p: any, comps?: any[]) => {
    usePdvCart.getState().addItem(p, comps)
    setSearch('')
    setLastAddedId(p.id)
    beep(1)
    focusSearch()
  }

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const q = search.trim()
    if (!q) return
    e.preventDefault()
    if (filtered.length === 1) {
      const p = filtered[0]
      if (hasRequiredGroups(p, complements)) setSelectedProduct(p)
      else addItem(p)
      return
    }
    beep(1, 220)
  }

  const handleTileClick = (p: any) => {
    if (hasRequiredGroups(p, complements)) setSelectedProduct(p)
    else addItem(p)
  }

  const openPayment = useCallback(() => {
    if (usePdvCart.getState().items.length === 0) return
    setPaymentOpen(true)
  }, [])

  const openPaymentRef = useRef(openPayment)
  openPaymentRef.current = openPayment
  const paymentOpenRef = useRef(paymentOpen)
  paymentOpenRef.current = paymentOpen

  /* global keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault()
        if (!paymentOpenRef.current) openPaymentRef.current()
      } else if (e.key === 'Escape') {
        setPaymentOpen(false)
        setSelectedProduct(null)
        setCartOpen(false)
        setDone(null)
        focusSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusSearch])

  const handleDone = (method: string, change: number) => {
    setDone({ total, method, change, count: cartCount })
    usePdvCart.getState().clear()
    setScanCode('')
    setPaymentOpen(false)
    setCartOpen(false)
    focusSearch()
  }

  const totals = { cartCount, subtotal, discountVal: discountCalc, couponVal, total }

  const methodsMap: Record<string, string> = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito', fiado: 'Fiado' }

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: COLORS.bg }}>
      {/* Search bar */}
      <div style={{ padding: '10px 14px', background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          ref={searchRef}
          placeholder="🔍 Buscar ou passar o código de barras...  (Enter adiciona · F8 finaliza)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          autoFocus
          style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: '1rem', outline: 'none' }}
        />
        {search && (
          <button onClick={() => { setSearch(''); focusSearch() }}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: COLORS.textLight, cursor: 'pointer' }}>✕</button>
        )}
      </div>

      {/* Category chips */}
      <div style={{ padding: '8px 14px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
        <button
          onClick={() => setCatFilter('all')}
          style={{
            padding: '6px 12px', borderRadius: 20, border: catFilter === 'all' ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
            background: catFilter === 'all' ? COLORS.primary : COLORS.card, color: catFilter === 'all' ? '#fff' : COLORS.text,
            fontWeight: 600, fontSize: '.78rem', cursor: 'pointer', flexShrink: 0,
          }}
        >
          🛍️ Todos
        </button>
        {categories.map((c: any) => (
          <button key={c.id}
            onClick={() => setCatFilter(c.id)}
            style={{
              padding: '6px 12px', borderRadius: 20, border: catFilter === c.id ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
              background: catFilter === c.id ? COLORS.primary : COLORS.card, color: catFilter === c.id ? '#fff' : COLORS.text,
              fontWeight: 600, fontSize: '.78rem', cursor: 'pointer', flexShrink: 0,
            }}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row' }}>
        {/* Product grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 14px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, alignContent: 'start' }}>
          {filtered.map((p: any) => {
            const qty = qtyMap[p.id] || 0
            const glow = lastAddedId === p.id
            return (
              <div key={p.id}
                onClick={() => handleTileClick(p)}
                style={{
                  background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`,
                  padding: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative',
                  boxShadow: glow ? '0 0 0 2px rgba(39,174,96,.8), 0 4px 12px rgba(39,174,96,.35)' : '0 1px 3px rgba(0,0,0,.06)',
                  transition: 'box-shadow .2s ease',
                }}
              >
                {qty > 0 && (
                  <div style={{
                    position: 'absolute', top: -6, right: -6, background: COLORS.success, color: '#fff',
                    borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '.78rem', boxShadow: '0 2px 6px rgba(0,0,0,.25)',
                  }}>
                    {qty}
                  </div>
                )}
                {p.image ? (
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: '100%', height: 80, background: '#f8f9fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🛒</div>
                )}
                <div style={{ fontWeight: 600, fontSize: '.8rem', textAlign: 'center', color: COLORS.text, lineHeight: 1.2 }}>{p.name}</div>
                {p.barcode && <div style={{ fontSize: '.6rem', color: COLORS.textLight }}>#{p.barcode}</div>}
                <div style={{ fontWeight: 700, color: COLORS.primary, fontSize: '.85rem' }}>{formatPrice(p.price)}</div>
                {hasRequiredGroups(p, complements) && <span style={{ fontSize: '.65rem', color: COLORS.accent }}>+ complementos</span>}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: COLORS.textLight }}>
              Nenhum produto encontrado
            </div>
          )}
        </div>

        {/* Cart panel (desktop) */}
        {!isMobile && (
          <div style={{ width: 340, flexShrink: 0, borderLeft: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
            <CartPanel
              totals={totals}
              scanCode={scanCode} setScanCode={setScanCode} couponError={couponError}
              customerSearch={customerSearch} setCustomerSearch={setCustomerSearch}
              customerResults={customerResults} setCustomerResults={setCustomerResults}
              onFinalize={openPayment} onClose={() => setCartOpen(false)} isSheet={false}
            />
          </div>
        )}
      </div>

      {/* Cash bar (sempre visível) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        background: COLORS.cashbar, flexShrink: 0,
      }}>
        {isMobile && (
          <button onClick={() => setCartOpen(true)}
            style={{ background: '#ffffff22', border: 'none', color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>
            🛒 {cartCount}
          </button>
        )}
        <div style={{ flex: 1, color: '#fff', display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ fontSize: '.72rem', color: '#9fb0c0', textTransform: 'uppercase', letterSpacing: .5 }}>Total {cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatPrice(total)}</span>
        </div>
        <button onClick={openPayment} disabled={items.length === 0}
          style={{
            padding: '14px 26px', borderRadius: 10, background: items.length > 0 ? COLORS.success : '#3a4650',
            color: items.length > 0 ? '#fff' : '#8a97a3', border: 'none', fontSize: '1.05rem', fontWeight: 800,
            cursor: items.length > 0 ? 'pointer' : 'not-allowed',
          }}>
          💳 Finalizar <span style={{ fontSize: '.72rem', fontWeight: 600 }}>(F8)</span>
        </button>
      </div>

      {/* Mobile cart bottom sheet */}
      {isMobile && cartOpen && (
        <div className="modal-overlay" onClick={() => setCartOpen(false)}>
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, height: '70vh', background: COLORS.card,
            borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden',
          }} onClick={e => e.stopPropagation()}>
            <CartPanel
              totals={totals}
              scanCode={scanCode} setScanCode={setScanCode} couponError={couponError}
              customerSearch={customerSearch} setCustomerSearch={setCustomerSearch}
              customerResults={customerResults} setCustomerResults={setCustomerResults}
              onFinalize={openPayment} onClose={() => setCartOpen(false)} isSheet
            />
          </div>
        </div>
      )}

      {selectedProduct && (
        <ComplementModal
          product={selectedProduct}
          groups={complements[selectedProduct.id] || []}
          onConfirm={(comps) => { addItem(selectedProduct, comps); setSelectedProduct(null) }}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {paymentOpen && (
        <PaymentModalAvulso
          subtotal={subtotal} discountVal={discountCalc} couponDiscount={couponVal}
          customer={customer} notes={notes}
          onClose={() => setPaymentOpen(false)}
          onSuccess={handleDone}
        />
      )}

      {/* Done banner */}
      {done && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: COLORS.success, color: '#fff', borderRadius: 12, padding: '12px 22px',
          boxShadow: '0 8px 24px rgba(0,0,0,.25)', textAlign: 'center', fontSize: '.9rem', fontWeight: 700,
        }}>
          ✅ Venda finalizada • {formatPrice(done.total)} • {methodsMap[done.method] || done.method} • {done.count} {done.count === 1 ? 'item' : 'itens'}
          {done.change > 0 && <span style={{ display: 'block', fontSize: '.8rem', fontWeight: 600 }}>Troco: {formatPrice(done.change)}</span>}
        </div>
      )}
    </div>
  )
}
