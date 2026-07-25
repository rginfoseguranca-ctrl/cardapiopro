import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStoreSettings, updateStoreSettings, type StoreSettings } from '../api/client'

export default function Chatbot() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery<StoreSettings>({
    queryKey: ['storeSettings'],
    queryFn: getStoreSettings,
  })

  const updateMut = useMutation({
    mutationFn: (data: Partial<StoreSettings>) => updateStoreSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storeSettings'] }),
  })

  const [whatsapp, setWhatsapp] = useState(settings?.whatsapp || '')
  const [greeting, setGreeting] = useState('')
  const [autoReply, setAutoReply] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateMut.mutate({ whatsapp })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    padding: 20,
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🤖 Chatbot</h1>
        <Link to="/dashboard" style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ ...cardStyle, background: '#f0fdf4', border: '1px solid #d1fae5', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem' }}>💡</span>
          <div>
            <p style={{ fontWeight: 700, color: '#333', fontSize: '0.95rem', marginBottom: 4 }}>
              Configure o chatbot de WhatsApp para atender seus clientes automaticamente
            </p>
            <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.5 }}>
              O chatbot responde automaticamente mensagens de clientes, envia o cardápio, informa horários de funcionamento e muito mais.
            </p>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Configurações</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: 6, display: 'block' }}>Número do WhatsApp</label>
            <input
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: 6, display: 'block' }}>Mensagem de Saudação</label>
            <textarea
              value={greeting}
              onChange={e => setGreeting(e.target.value)}
              placeholder="Olá! 👋 Bem-vindo(a)! Como posso ajudar?"
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>Resposta Automática</p>
              <p style={{ fontSize: '0.8rem', color: '#999' }}>Ativar respostas automáticas para mensagens recebidas</p>
            </div>
            <button
              onClick={() => setAutoReply(!autoReply)}
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                border: 'none',
                background: autoReply ? '#27ae60' : '#ddd',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background .2s',
              }}
            >
              <span style={{
                position: 'absolute',
                top: 2,
                left: autoReply ? 26 : 2,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,.15)',
                transition: 'left .2s',
              }} />
            </button>
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
              alignSelf: 'flex-start',
            }}
          >
            {updateMut.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </button>
          {saved && <span style={{ color: '#27ae60', fontSize: '0.85rem' }}>✓ Configurações salvas!</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>💬</p>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#333', marginBottom: 4 }}>Respostas Automáticas</h4>
          <p style={{ fontSize: '0.82rem', color: '#999' }}>Configure respostas para perguntas frequentes</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>📱</p>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#333', marginBottom: 4 }}>Cardápio no WhatsApp</h4>
          <p style={{ fontSize: '0.82rem', color: '#999' }}>Envie o cardápio automaticamente pelo chat</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>🕐</p>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#333', marginBottom: 4 }}>Horário de Atendimento</h4>
          <p style={{ fontSize: '0.82rem', color: '#999' }}>Informa horários e status da loja</p>
        </div>
      </div>
    </div>
  )
}
