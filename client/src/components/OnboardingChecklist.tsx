import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

interface ChecklistItem {
  id: string
  label: string
  description: string
  done: boolean
  link?: string
}

export default function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('onboarding_dismissed') === 'true')

  const { data: store } = useQuery({ queryKey: ['storeSettings'], queryFn: async () => { const r = await api.get('/store/settings'); return r.data } })
  const { data: products } = useQuery({ queryKey: ['productsAll'], queryFn: async () => { const r = await api.get('/products/all'); return r.data } })

  if (dismissed) return null

  const items: ChecklistItem[] = [
    {
      id: 'name',
      label: 'Nome da loja',
      description: 'Configure o nome que aparece no cardápio',
      done: !!store?.storeName && store.storeName !== 'Lanchonete do Povo',
    },
    {
      id: 'logo',
      label: 'Logo da loja',
      description: 'Adicione o logo da sua marca',
      done: !!store?.logoUrl,
    },
    {
      id: 'whatsapp',
      description: 'Número para receber notificações de pedidos',
      label: 'WhatsApp',
      done: !!store?.whatsapp,
    },
    {
      id: 'pix',
      label: 'Chave PIX',
      description: 'Chave PIX para recebimento de pagamentos',
      done: !!store?.paymentPixKey && store.paymentPixKey !== '11.99999-8888',
    },
    {
      id: 'hours',
      label: 'Horário de funcionamento',
      description: 'Defina os dias e horários de abertura',
      done: !!store?.openingHours && store.openingHours !== '{}',
    },
    {
      id: 'products',
      label: 'Adicionar produtos',
      description: 'Cadastre pelo menos um produto no cardápio',
      done: products && products.length > 0,
    },
    {
      id: 'categories',
      label: 'Organizar categorias',
      description: 'Crie categorias para organizar seus produtos',
      done: true,
    },
    {
      id: 'colors',
      label: 'Cores da marca',
      description: 'Personalize as cores do cardápio',
      done: store?.primaryColor !== '#e74c3c',
    },
    {
      id: 'footer',
      label: 'Texto do rodapé',
      description: 'Mensagem que aparece no rodapé do cardápio',
      done: !!store?.footerText && !store.footerText.includes('Lanchonete do Povo'),
    },
  ]

  const doneCount = items.filter(i => i.done).length
  const total = items.length
  const progress = Math.round((doneCount / total) * 100)

  if (progress === 100) {
    setDismissed(true)
    localStorage.setItem('onboarding_dismissed', 'true')
    return null
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20, border: '2px solid var(--primary)', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>🎯 Configuração Inicial</h3>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('onboarding_dismissed', 'true') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-light)' }}
        >✕</button>
      </div>

      <div style={{ background: 'var(--bg)', borderRadius: 8, height: 8, marginBottom: 16 }}>
        <div style={{
          background: 'var(--primary)', borderRadius: 8, height: '100%',
          width: `${progress}%`, transition: 'width 0.5s',
        }} />
      </div>
      <p style={{ fontSize: '.8rem', color: 'var(--text-light)', marginBottom: 12 }}>
        {doneCount}/{total} etapas concluídas
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            borderRadius: 8, background: item.done ? 'rgba(46,204,113,0.1)' : 'var(--bg)',
            border: '1px solid', borderColor: item.done ? 'rgba(46,204,113,0.3)' : 'var(--border)',
          }}>
            <span style={{ fontSize: '1.1rem' }}>{item.done ? '✅' : '⬜'}</span>
            <div>
              <p style={{ fontSize: '.85rem', fontWeight: 600, textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</p>
              <p style={{ fontSize: '.75rem', color: 'var(--text-light)' }}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
