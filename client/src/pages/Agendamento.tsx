import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStoreSettings, updateStoreSettings, type StoreSettings } from '../api/client'

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30',
]

export default function Agendamento() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery<StoreSettings>({
    queryKey: ['storeSettings'],
    queryFn: getStoreSettings,
  })

  const updateMut = useMutation({
    mutationFn: (data: Partial<StoreSettings>) => updateStoreSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storeSettings'] }),
  })

  const [enabled, setEnabled] = useState(settings?.schedulingEnabled || false)
  const [advanceDays, setAdvanceDays] = useState(7)
  const [minOrderValue, setMinOrderValue] = useState(0)
  const [selectedSlots, setSelectedSlots] = useState<string[]>(['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00'])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setEnabled(settings.schedulingEnabled || false)
  }, [settings])

  const handleSave = () => {
    updateMut.mutate({ schedulingEnabled: enabled })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleSlot = (slot: string) => {
    setSelectedSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort()
    )
  }

  const inputStyle: React.CSSProperties = {
    width: 120,
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: '0.9rem',
    outline: 'none',
    textAlign: 'center',
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📅 Agendamento</h1>
        <Link to="/dashboard" style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333' }}>Agendamento de Pedidos</h3>
            <p style={{ fontSize: '0.82rem', color: '#999', marginTop: 2 }}>Permitir que clientes agendem pedidos para horários específicos</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            style={{
              width: 56,
              height: 30,
              borderRadius: 15,
              border: 'none',
              background: enabled ? '#27ae60' : '#ddd',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background .2s',
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3,
              left: enabled ? 28 : 3,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,.15)',
              transition: 'left .2s',
            }} />
          </button>
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        padding: 24,
        marginBottom: 16,
        opacity: enabled ? 1 : 0.5,
        pointerEvents: enabled ? 'auto' : 'none',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Configurações</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: 8, display: 'block' }}>
              Dias de Antecedência
            </label>
            <p style={{ fontSize: '0.78rem', color: '#999', marginBottom: 8 }}>Quantos dias no futuro o cliente pode agendar</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setAdvanceDays(Math.max(1, advanceDays - 1))}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                −
              </button>
              <input
                type="number"
                value={advanceDays}
                onChange={e => setAdvanceDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                style={inputStyle}
                min={1}
                max={30}
              />
              <button
                onClick={() => setAdvanceDays(Math.min(30, advanceDays + 1))}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                +
              </button>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>dias</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: 8, display: 'block' }}>
              Pedido Mínimo para Agendamento
            </label>
            <p style={{ fontSize: '0.78rem', color: '#999', marginBottom: 8 }}>Valor mínimo do pedido para permitir agendamento</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>R$</span>
              <input
                type="number"
                value={minOrderValue}
                onChange={e => setMinOrderValue(Math.max(0, parseFloat(e.target.value) || 0))}
                style={inputStyle}
                min={0}
                step={5}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        padding: 24,
        marginBottom: 16,
        opacity: enabled ? 1 : 0.5,
        pointerEvents: enabled ? 'auto' : 'none',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 8 }}>Horários Disponíveis</h3>
        <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 16 }}>Selecione os horários que estarão disponíveis para agendamento</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {timeSlots.map(slot => {
            const isSelected = selectedSlots.includes(slot)
            return (
              <button
                key={slot}
                onClick={() => toggleSlot(slot)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${isSelected ? '#27ae60' : '#ddd'}`,
                  background: isSelected ? '#f0fdf4' : '#fff',
                  color: isSelected ? '#27ae60' : '#666',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {slot}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={() => setSelectedSlots(timeSlots)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: '0.8rem', cursor: 'pointer', color: '#666' }}
          >
            Selecionar Todos
          </button>
          <button
            onClick={() => setSelectedSlots([])}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: '0.8rem', cursor: 'pointer', color: '#666' }}
          >
            Limpar
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={updateMut.isPending}
        style={{
          padding: '12px 28px',
          borderRadius: 8,
          border: 'none',
          background: '#e74c3c',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          opacity: updateMut.isPending ? 0.6 : 1,
        }}
      >
        {updateMut.isPending ? 'Salvando...' : 'Salvar Configurações'}
      </button>
      {saved && <span style={{ marginLeft: 12, color: '#27ae60', fontSize: '0.85rem' }}>✓ Configurações salvas!</span>}
    </div>
  )
}
