import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoreSettings, updateStoreSettings, type StoreSettings } from '../api/client'

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, sans-serif', background: '#f5f5f5', minHeight: '100vh' },
  title: { fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: 0 },
  togglesRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 20 },
  toggleItem: { display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 200px' },
  toggleLabel: { fontSize: 14, color: '#444', fontWeight: 500 },
  toggle: { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative' as const, transition: 'background .2s' },
  toggleOn: { background: '#2563eb' },
  toggleOff: { background: '#ccc' },
  toggleCircle: { width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute' as const, top: 3, transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.15)' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6, flex: '1 1 200px' },
  label: { fontSize: 13, fontWeight: 600, color: '#555' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  textarea: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical' as const, minHeight: 80 },
  formRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  btn: { padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' },
}

interface ToggleProps {
  label: string
  checked: boolean
  onChange: () => void
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div style={styles.toggleItem}>
      <button style={{ ...styles.toggle, ...(checked ? styles.toggleOn : styles.toggleOff) }} onClick={onChange}>
        <div style={{ ...styles.toggleCircle, left: checked ? 23 : 3 }} />
      </button>
      <span style={styles.toggleLabel}>{label}</span>
    </div>
  )
}

export default function ConfigGeral() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery<StoreSettings>({ queryKey: ['storeSettings'], queryFn: getStoreSettings })

  const [deliveryActive, setDeliveryActive] = useState(true)
  const [pickupActive, setPickupActive] = useState(true)
  const [counterActive, setCounterActive] = useState(false)
  const [schedulingActive, setSchedulingActive] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState('5.00')
  const [freeFrom, setFreeFrom] = useState('50.00')
  const [minOrder, setMinOrder] = useState('20.00')
  const [observation, setObservation] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setSchedulingActive(settings.schedulingEnabled || false)
      setDeliveryFee(String(settings.deliveryFee || 5))
      setFreeFrom(String(settings.freeDeliveryFrom || 50))
    }
  }, [settings])

  const updateMut = useMutation({
    mutationFn: (data: Partial<StoreSettings>) => updateStoreSettings(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['storeSettings'] }); setSaved(true); setTimeout(() => setSaved(false), 2000) },
  })

  const handleSave = () => {
    updateMut.mutate({
      schedulingEnabled: schedulingActive,
      deliveryFee: Number(deliveryFee),
      freeDeliveryFrom: Number(freeFrom),
    } as any)
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Configuração Geral</h1>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Modos de Venda</h3>
        <div style={styles.togglesRow}>
          <Toggle label="Delivery ativo" checked={deliveryActive} onChange={() => setDeliveryActive(!deliveryActive)} />
          <Toggle label="Retirada ativa" checked={pickupActive} onChange={() => setPickupActive(!pickupActive)} />
          <Toggle label="Balcão ativo" checked={counterActive} onChange={() => setCounterActive(!counterActive)} />
          <Toggle label="Agendamento ativo" checked={schedulingActive} onChange={() => setSchedulingActive(!schedulingActive)} />
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Valores</h3>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Taxa de Entrega (R$)</label>
            <input style={styles.input} type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Entrega Grátis Acima de (R$)</label>
            <input style={styles.input} type="number" value={freeFrom} onChange={e => setFreeFrom(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Pedido Mínimo (R$)</label>
            <input style={styles.input} type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Mensagem de Observação</h3>
        <textarea style={styles.textarea} value={observation} onChange={e => setObservation(e.target.value)} placeholder="Mensagem exibida ao cliente..." />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={styles.btn} onClick={handleSave} disabled={updateMut.isPending}>{updateMut.isPending ? 'Salvando...' : 'Salvar Configurações'}</button>
        {saved && <span style={{ color: '#27ae60', fontSize: '0.85rem' }}>✓ Salvo!</span>}
      </div>
    </div>
  )
}
