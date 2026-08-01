import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createOrder, validateCoupon, applyCoupon, getStoreSettings, getPixQrCode, getDeliveryAreas } from '../api/client'
import { useCart } from '../hooks/useCart'
import { useOrderMode } from '../hooks/useOrderMode'

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const { mode, tableNumber } = useOrderMode()
  const isMesa = mode === 'mesa'
  const isBalcao = mode === 'balcao'
  const isDelivery = !isMesa && !isBalcao
  const { data: storeSettings } = useQuery({ queryKey: ['storeSettings'], queryFn: getStoreSettings })
  const { data: deliveryAreas } = useQuery({
    queryKey: ['deliveryAreas'],
    queryFn: getDeliveryAreas,
    enabled: isDelivery,
  })

  const [selectedAreaId, setSelectedAreaId] = useState<string>('')

  const selectedArea = deliveryAreas?.find((a: any) => a.id === selectedAreaId)

  const [form, setForm] = useState({
    name: '', phone: '', payment: 'pix',
    address: '', addressNumber: '', addressNeighborhood: '',
    addressCep: '', addressQuadra: '', addressLote: '', addressReference: '',
    scheduling: 'now',
    scheduledDate: '', scheduledTime: '',
    notes: '', couponCode: '',
    changeFor: '',
  })
  const [error, setError] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponData, setCouponData] = useState<{ coupon: { id: string; code: string; title: string }; discount: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)

  const deliveryFee = isDelivery && storeSettings && selectedArea
    ? (selectedArea.freeDeliveryFrom > 0 && subtotal() >= selectedArea.freeDeliveryFrom ? 0 : (selectedArea.baseFee || 0))
    : (isDelivery && storeSettings
      ? (storeSettings.freeDeliveryFrom > 0 && subtotal() >= storeSettings.freeDeliveryFrom ? 0 : (storeSettings.deliveryFee || 0))
      : 0)

  const totalBeforeDiscount = subtotal() + deliveryFee
  const finalTotal = Math.max(0, totalBeforeDiscount - couponDiscount)

  const { data: pixData } = useQuery({
    queryKey: ['pixQrCode', finalTotal, form.payment],
    queryFn: () => getPixQrCode(finalTotal, 'temp'),
    enabled: form.payment === 'pix' && finalTotal > 0,
  })

  useEffect(() => {
    if (pixData?.payload) setPixQrCode(pixData.payload)
    else setPixQrCode(null)
  }, [pixData])

  useEffect(() => {
    const cep = form.addressCep.replace(/\D/g, '')
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setForm(f => ({
              ...f,
              address: data.logradouro || f.address,
              addressNeighborhood: data.bairro || f.addressNeighborhood,
            }))
          }
        })
        .catch(() => { /* ignore */ })
    }
  }, [form.addressCep])

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (order) => {
      if (couponData) await applyCoupon(couponData.coupon.id)
      clearCart()
      navigate(`/order/${order.id}`)
    }
  })

  const handleApplyCoupon = async () => {
    if (!form.couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const result = await validateCoupon(form.couponCode, subtotal())
      setCouponDiscount(result.discount)
      setCouponData(result)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setCouponError(axiosErr.response?.data?.error || 'Cupom inválido')
      setCouponDiscount(0)
      setCouponData(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name) { setError('Nome é obrigatório'); return }
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) { setError('Telefone/WhatsApp é obrigatório'); return }
    if (isDelivery && !form.address) { setError('Endereço é obrigatório para entrega'); return }

    const hours = storeSettings?.openingHours || {}
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = dayNames[new Date().getDay()]
    const todayHours = hours[today]
    const isScheduled = form.scheduling === 'schedule' && form.scheduledDate && form.scheduledTime

    if (!isScheduled && todayHours && !todayHours.closed && todayHours.open && todayHours.close) {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const [openH, openM] = todayHours.open.split(':').map(Number)
      const [closeH, closeM] = todayHours.close.split(':').map(Number)
      const openTime = openH * 60 + openM
      const closeTime = closeH * 60 + closeM

      if (currentTime < openTime || currentTime >= closeTime) {
        setError('Loja fechada no momento. Pedidos só podem ser feitos no horário de funcionamento.')
        return
      }
    }

    let scheduledAt: string | undefined
    if (form.scheduling === 'schedule' && form.scheduledDate && form.scheduledTime) {
      const [h, m] = form.scheduledTime.split(':')
      const d = new Date(form.scheduledDate)
      d.setHours(Number(h), Number(m))
      scheduledAt = d.toISOString()
    }

    const addressParts = [
      `${form.address}${form.addressNumber ? `, ${form.addressNumber}` : ''}`,
      form.addressNeighborhood ? `Bairro: ${form.addressNeighborhood}` : '',
      form.addressCep ? `CEP: ${form.addressCep}` : '',
      form.addressQuadra ? `Quadra: ${form.addressQuadra}` : '',
      form.addressLote ? `Lote: ${form.addressLote}` : '',
      form.addressReference ? `Ref: ${form.addressReference}` : '',
    ]

    const deliveryAddress = isDelivery ? addressParts.filter(Boolean).join(' | ') : undefined

    mutation.mutate({
      customerName: form.name,
      customerPhone: form.phone || '00000000000',
      items: items,
      paymentMethod: form.payment,
      deliveryType: isDelivery ? 'delivery' : isMesa ? 'mesa' : 'balcao',
      deliveryAddress,
      deliveryFee,
      tableNumber: isMesa ? tableNumber : undefined,
      notes: form.notes,
      scheduledAt,
      couponCode: couponData?.coupon?.code || '',
      couponDiscount,
    })
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 60 }}>
        <span style={{ fontSize: '3rem' }}>🛒</span>
        <h2>Sacola vazia</h2>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          Voltar ao Cardápio
        </button>
      </div>
    )
  }

  const needsChange = form.payment === 'cash' && Number(form.changeFor) > finalTotal
  const changeAmount = needsChange ? Number(form.changeFor) - finalTotal : 0

  return (
    <div className="container" style={{ padding: '20px 0 60px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>
        {isMesa ? `🍽️ Mesa ${tableNumber} - Finalizar Pedido` : isBalcao ? '🏪 Finalizar Pedido' : '🚚 Finalizar Pedido'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="card p-xl mb-lg">
          <h3 className="mb-md">📋 Resumo do Pedido</h3>
          {items.map(item => (
            <div key={item.productId} className="flex justify-between text-sm" style={{ padding: '4px 0' }}>
              <span>{item.quantity}x {item.productName}</span>
              <span>R$ {item.totalPrice.toFixed(2)}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>R$ {subtotal().toFixed(2)}</span></div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm"><span>🚚 Taxa de entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
          )}
          {deliveryFee === 0 && isDelivery && storeSettings && storeSettings.freeDeliveryFrom > 0 && subtotal() < storeSettings.freeDeliveryFrom && (
            <div className="flex justify-between text-sm text-muted"><span>🚚 Entrega</span><span>R$ {(storeSettings.deliveryFee || 0).toFixed(2)}</span></div>
          )}
          {deliveryFee === 0 && isDelivery && storeSettings && storeSettings.freeDeliveryFrom > 0 && subtotal() >= storeSettings.freeDeliveryFrom && (
            <div className="flex justify-between text-sm text-success"><span>🚚 Entrega</span><span>Grátis!</span></div>
          )}
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-success"><span>Desconto ({couponData?.coupon?.code})</span><span>-R$ {couponDiscount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between font-bold" style={{ fontSize: '1.1rem', marginTop: 4 }}>
            <span>Total</span><span>R$ {finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="card p-xl mb-lg">
          <h3 className="mb-md">🏷️ Cupom de Desconto</h3>
          <div className="input-group">
            <input className="input" placeholder="Digite o cupom" style={{ textTransform: 'uppercase' }}
              value={form.couponCode} onChange={e => { setForm(f => ({ ...f, couponCode: e.target.value })); setCouponDiscount(0); setCouponData(null); setCouponError('') }} />
            <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyCoupon} disabled={couponLoading}>
              {couponLoading ? '...' : 'Aplicar'}
            </button>
          </div>
          {couponError && <p className="input-error-text mt-xs">{couponError}</p>}
          {couponData && <p className="text-success text-sm mt-xs">Cupom aplicado!</p>}
        </div>

        <div className="card p-xl mb-lg">
          <h3 className="mb-md">👤 Seus Dados</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="input" placeholder="Seu nome *" required
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="input" placeholder="WhatsApp (com DDD) *" required
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))} />
          </div>
        </div>

        {isDelivery && (
          <div className="card p-xl mb-lg">
            <h3 className="mb-md">📍 Endereço de Entrega</h3>
            {deliveryAreas && deliveryAreas.length > 0 && (
              <div className="mb-md">
                <p className="mb-sm" style={{fontWeight: 600, fontSize: '0.9rem'}}>Área de entrega</p>
                <select className="input" value={selectedAreaId} onChange={e => setSelectedAreaId(e.target.value)}>
                  <option value="">Selecione a área</option>
                  {deliveryAreas.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.baseFee ? `R$ ${Number(a.baseFee).toFixed(2)}` : 'Grátis'}
                      {a.freeDeliveryFrom > 0 ? ` (grátis acima de R$ ${Number(a.freeDeliveryFrom).toFixed(2)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input" placeholder="Rua/Av *"
                value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="input" placeholder="Número"
                  value={form.addressNumber} onChange={e => setForm(f => ({ ...f, addressNumber: e.target.value }))} />
                <input className="input" placeholder="Bairro"
                  value={form.addressNeighborhood} onChange={e => setForm(f => ({ ...f, addressNeighborhood: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="input" placeholder="CEP"
                  value={form.addressCep} onChange={e => setForm(f => ({ ...f, addressCep: e.target.value }))} />
                <input className="input" placeholder="Quadra (Qd)"
                  value={form.addressQuadra} onChange={e => setForm(f => ({ ...f, addressQuadra: e.target.value }))} />
              </div>
              <input className="input" placeholder="Lote (Lt)"
                value={form.addressLote} onChange={e => setForm(f => ({ ...f, addressLote: e.target.value }))} />
              <input className="input" placeholder="Ponto de referência (opcional)"
                value={form.addressReference} onChange={e => setForm(f => ({ ...f, addressReference: e.target.value }))} />
            </div>
          </div>
        )}

        {(!storeSettings || storeSettings.schedulingEnabled) && (
        <div className="card p-xl mb-lg">
          <h3 className="mb-md">⏰ Quando deseja?</h3>
          <div className="flex gap-md mb-md">
            <button type="button" className={`btn flex-1 ${form.scheduling === 'now' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setForm(f => ({ ...f, scheduling: 'now' }))}>⚡ Agora</button>
            <button type="button" className={`btn flex-1 ${form.scheduling === 'schedule' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setForm(f => ({ ...f, scheduling: 'schedule' }))}>📅 Agendar</button>
          </div>
          {form.scheduling === 'schedule' && (
            <div className="flex gap-md">
              <input type="date" className="input" required value={form.scheduledDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
              <input type="time" className="input" required value={form.scheduledTime}
                onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))} />
            </div>
          )}
        </div>
        )}

        <div className="card p-xl mb-lg">
          <h3 className="mb-md">💳 Pagamento</h3>
          <div className="flex flex-wrap gap-md">
            {[
              { value: 'pix', label: 'PIX' },
              { value: 'credit', label: 'Cartão Crédito' },
              { value: 'debit', label: 'Cartão Débito' },
              { value: 'meal_ticket', label: 'Vale Refeição' },
              { value: 'cash', label: 'Dinheiro' },
            ].map(opt => (
              <button key={opt.value} type="button"
                className={`btn flex-1 ${form.payment === opt.value ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setForm(f => ({ ...f, payment: opt.value }))}>{opt.label}</button>
            ))}
          </div>

          {form.payment === 'pix' && storeSettings?.paymentPixKey && (
            <div className="mt-md p-md" style={{ background: 'var(--bg)', borderRadius: 8 }}>
              <p className="font-semibold text-sm">📱 Chave PIX:</p>
              <p className="text-primary font-bold">{storeSettings.paymentPixKey}</p>
              {storeSettings.paymentPixName && <p className="text-xs text-muted">Titular: {storeSettings.paymentPixName}</p>}
              {pixQrCode && (
                <div className="mt-md text-center">
                  <p className="text-sm text-muted mb-xs">Escaneie para pagar:</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixQrCode)}`}
                    alt="PIX QR Code" style={{ width: 200, height: 200, borderRadius: 8 }} />
                  <p className="text-xs text-muted mt-xs">Total: R$ {finalTotal.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}
          {form.payment === 'credit' && storeSettings?.paymentCardInfo && (
            <p className="mt-md text-sm text-muted">💳 {storeSettings.paymentCardInfo}</p>
          )}
          {form.payment === 'debit' && (
            <p className="mt-md text-sm text-muted">💳 Pagamento na entrega via maquininha</p>
          )}
          {form.payment === 'meal_ticket' && (
            <p className="mt-md text-sm text-muted">🎫 Aceitamos Vale Refeição e Vale Alimentação (Sodexo, Alelo, VR, Flash, etc.) na entrega</p>
          )}

          {form.payment === 'cash' && (
            <div className="mt-md">
              {storeSettings?.paymentCashInfo && <p className="text-sm text-muted mb-md">💵 {storeSettings.paymentCashInfo}</p>}
              <input className="input" type="number" placeholder="Troco para (opcional)"
                value={form.changeFor} onChange={e => setForm(f => ({ ...f, changeFor: e.target.value }))} />
              {needsChange && (
                <p className="text-success text-sm mt-xs">Troco: R$ {changeAmount.toFixed(2)}</p>
              )}
            </div>
          )}
        </div>

        <div className="card p-xl mb-lg">
          <textarea className="input" placeholder="Observações (opcional)"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        {error && <p className="text-danger text-center mb-md">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" style={{ padding: '16px', fontSize: '1.1rem' }}
          disabled={mutation.isPending}>
          {mutation.isPending ? 'Enviando...' : `Confirmar Pedido - R$ ${finalTotal.toFixed(2)}`}
        </button>

        {mutation.isError && (
          <p className="text-danger text-center mt-lg">
            Erro ao criar pedido. Tente novamente.
          </p>
        )}
      </form>
    </div>
  )
}
