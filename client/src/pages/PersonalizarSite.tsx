import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStoreSettings, updateStoreSettings, type StoreSettings } from '../api/client'

export default function PersonalizarSite() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery<StoreSettings>({
    queryKey: ['storeSettings'],
    queryFn: getStoreSettings,
  })

  const updateMut = useMutation({
    mutationFn: (data: Partial<StoreSettings>) => updateStoreSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storeSettings'] }),
  })

  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || '#e74c3c')
  const [showPrices, setShowPrices] = useState(true)
  const [showDeliveryFee, setShowDeliveryFee] = useState(true)
  const [showScheduling, setShowScheduling] = useState(settings?.schedulingEnabled || false)
  const [logoPreview, setLogoPreview] = useState(settings?.logoUrl || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setPrimaryColor(settings.primaryColor || '#e74c3c')
      setShowScheduling(settings.schedulingEnabled || false)
      setLogoPreview(settings.logoUrl || '')
    }
  }, [settings])

  const handleSave = () => {
    updateMut.mutate({ primaryColor, schedulingEnabled: showScheduling, logoUrl: logoPreview })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    width: 52,
    height: 28,
    borderRadius: 14,
    border: 'none',
    background: active ? '#27ae60' : '#ddd',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background .2s',
    flexShrink: 0,
  })

  const toggleDot = (active: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 2,
    left: active ? 26 : 2,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,.15)',
    transition: 'left .2s',
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🎨 Personalizar Site</h1>
        <Link to="/dashboard" style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Opções de Exibição</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>Mostrar Preços</p>
                  <p style={{ fontSize: '0.78rem', color: '#999' }}>Exibir valores dos produtos no cardápio</p>
                </div>
                <button style={toggleStyle(showPrices)} onClick={() => setShowPrices(!showPrices)}>
                  <span style={toggleDot(showPrices)} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>Mostrar Taxa de Entrega</p>
                  <p style={{ fontSize: '0.78rem', color: '#999' }}>Exibir valor da entrega no cardápio</p>
                </div>
                <button style={toggleStyle(showDeliveryFee)} onClick={() => setShowDeliveryFee(!showDeliveryFee)}>
                  <span style={toggleDot(showDeliveryFee)} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>Agendamento</p>
                  <p style={{ fontSize: '0.78rem', color: '#999' }}>Permitir agendamento de pedidos</p>
                </div>
                <button style={toggleStyle(showScheduling)} onClick={() => setShowScheduling(!showScheduling)}>
                  <span style={toggleDot(showScheduling)} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Cor Principal</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                style={{ width: 48, height: 38, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', padding: 2 }}
              />
              <input
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                style={{ width: 120, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c'].map(c => (
                <button
                  key={c}
                  onClick={() => setPrimaryColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: primaryColor === c ? '3px solid #333' : '2px solid #eee',
                    background: c,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Logo</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: '#f9fafb',
                border: '2px dashed #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                {logoPreview ? '🖼️' : '📷'}
              </div>
              <div>
                <button style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  background: '#fff',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: '#333',
                }}>
                  Escolher Arquivo
                </button>
                <p style={{ fontSize: '0.78rem', color: '#999', marginTop: 4 }}>PNG ou JPG, até 2MB</p>
              </div>
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
            {updateMut.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          {saved && <span style={{ color: '#27ae60', fontSize: '0.85rem' }}>✓ Alterações salvas!</span>}
        </div>

        <div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, position: 'sticky', top: 16 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#333', marginBottom: 12 }}>Pré-visualização</h3>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #eee' }}>
              <div style={{ background: primaryColor, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{settings?.storeIcon || '🍔'} {settings?.storeName || 'Minha Loja'}</p>
              </div>
              <div style={{ padding: 16, background: '#fff' }}>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>Hambúrguer Clássico</p>
                  {showPrices && <p style={{ fontSize: '0.82rem', color: primaryColor, fontWeight: 700 }}>R$ 24,90</p>}
                </div>
                <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>Pizza Margherita</p>
                  {showPrices && <p style={{ fontSize: '0.82rem', color: primaryColor, fontWeight: 700 }}>R$ 39,90</p>}
                </div>
                {showDeliveryFee && (
                  <p style={{ fontSize: '0.78rem', color: '#999', marginTop: 8, textAlign: 'center' }}>
                    🚴 Entrega: R$ 5,00
                  </p>
                )}
                {showScheduling && (
                  <p style={{ fontSize: '0.78rem', color: '#27ae60', marginTop: 4, textAlign: 'center' }}>
                    📅 Agendamento disponível
                  </p>
                )}
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center', marginTop: 8 }}>
              Pré-visualização simplificada
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
