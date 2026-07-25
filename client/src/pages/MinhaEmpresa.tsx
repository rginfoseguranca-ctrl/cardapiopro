import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStoreSettings, updateStoreSettings, type StoreSettings } from '../api/client'

const tabs = ['Perfil', 'Horários', 'Formas de Pagamento', 'Campos Personalizados']

const weekDays: Record<string, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export default function MinhaEmpresa() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('Perfil')

  const { data: settings } = useQuery<StoreSettings>({
    queryKey: ['storeSettings'],
    queryFn: getStoreSettings,
  })

  const updateMut = useMutation({
    mutationFn: (data: Partial<StoreSettings>) => updateStoreSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storeSettings'] }),
  })

  const [form, setForm] = useState({
    storeName: '',
    storeIcon: '',
    primaryColor: '',
    whatsapp: '',
    footerText: '',
  })
  const [loaded, setLoaded] = useState(false)

  if (settings && !loaded) {
    setForm({
      storeName: settings.storeName || '',
      storeIcon: settings.storeIcon || '',
      primaryColor: settings.primaryColor || '#e74c3c',
      whatsapp: settings.whatsapp || '',
      footerText: settings.footerText || '',
    })
    setLoaded(true)
  }

  const handleSave = () => {
    updateMut.mutate({
      storeName: form.storeName,
      storeIcon: form.storeIcon,
      primaryColor: form.primaryColor,
      whatsapp: form.whatsapp,
      footerText: form.footerText,
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🏢 Minha Empresa</h1>
        <Link to="/dashboard" style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 6, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? '#fff' : '#666',
              background: activeTab === tab ? '#e74c3c' : 'transparent',
              cursor: 'pointer',
              transition: 'all .2s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Perfil' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333' }}>Informações do Perfil</h3>
          <div>
            <label style={labelStyle}>Nome da Loja</label>
            <input style={inputStyle} value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Ícone da Loja (emoji)</label>
            <input style={inputStyle} value={form.storeIcon} onChange={e => setForm({ ...form, storeIcon: e.target.value })} placeholder="🍔" />
          </div>
          <div>
            <label style={labelStyle}>Cor Principal</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="color"
                value={form.primaryColor}
                onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                style={{ width: 48, height: 38, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', padding: 2 }}
              />
              <input style={{ ...inputStyle, width: 120 }} value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>WhatsApp</label>
            <input style={inputStyle} value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label style={labelStyle}>Texto do Rodapé</label>
            <input style={inputStyle} value={form.footerText} onChange={e => setForm({ ...form, footerText: e.target.value })} placeholder="Feito com ❤️ pela Cardápio Web" />
          </div>
          <div>
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
            {updateMut.isSuccess && <span style={{ marginLeft: 12, color: '#27ae60', fontSize: '0.85rem' }}>✓ Salvo!</span>}
          </div>
        </div>
      )}

      {activeTab === 'Horários' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Horários de Funcionamento</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(weekDays).map(([key, label]) => {
              const hours = settings?.openingHours?.[key]
              const isClosed = hours?.closed ?? false
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                  <span style={{ width: 140, fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>{label}</span>
                  {isClosed ? (
                    <span style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>Fechado</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.85rem', color: '#555' }}>{hours?.open || '08:00'}</span>
                      <span style={{ color: '#ccc' }}>às</span>
                      <span style={{ fontSize: '0.85rem', color: '#555' }}>{hours?.close || '22:00'}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p style={{ marginTop: 16, fontSize: '0.82rem', color: '#999' }}>Edição de horários será disponibilizada em breve.</p>
        </div>
      )}

      {activeTab === 'Formas de Pagamento' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333' }}>Formas de Pagamento</h3>
          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #d1fae5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>💚</span>
              <span style={{ fontWeight: 700, color: '#333', fontSize: '0.95rem' }}>PIX</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 32 }}>
              <div>
                <label style={labelStyle}>Chave PIX</label>
                <input style={inputStyle} value={settings?.paymentPixKey || ''} readOnly placeholder="Chave PIX" />
              </div>
              <div>
                <label style={labelStyle}>Nome no PIX</label>
                <input style={inputStyle} value={settings?.paymentPixName || ''} readOnly placeholder="Nome" />
              </div>
            </div>
          </div>
          <div style={{ padding: '16px', background: '#eff6ff', borderRadius: 8, border: '1px solid #dbeafe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>💳</span>
              <span style={{ fontWeight: 700, color: '#333', fontSize: '0.95rem' }}>Cartão</span>
            </div>
            <div style={{ marginLeft: 32 }}>
              <label style={labelStyle}>Informações do Cartão</label>
              <input style={inputStyle} value={settings?.paymentCardInfo || ''} readOnly placeholder="Aceita crédito e débito" />
            </div>
          </div>
          <div style={{ padding: '16px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>💵</span>
              <span style={{ fontWeight: 700, color: '#333', fontSize: '0.95rem' }}>Dinheiro</span>
            </div>
            <div style={{ marginLeft: 32 }}>
              <label style={labelStyle}>Informações do Dinheiro</label>
              <input style={inputStyle} value={settings?.paymentCashInfo || ''} readOnly placeholder="Troco disponível" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Campos Personalizados' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333', marginBottom: 12 }}>Campos Personalizados</h3>
          <p style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            Adicione campos personalizados ao checkout para coletar informações adicionais dos seus clientes, como andar, ponto de referência, alergias alimentares, etc.
          </p>
          <div style={{ padding: 32, background: '#f9fafb', borderRadius: 8, border: '2px dashed #ddd', textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>📝</p>
            <p style={{ fontSize: '0.9rem', color: '#999' }}>Em breve você poderá criar campos personalizados aqui.</p>
          </div>
        </div>
      )}
    </div>
  )
}
