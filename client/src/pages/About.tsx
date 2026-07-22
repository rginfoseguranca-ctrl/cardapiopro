import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStoreSettings, type StoreSettings } from '../api/client'

export default function About() {
  const { data: settings } = useQuery<StoreSettings>({ queryKey: ['storeSettings'], queryFn: getStoreSettings })
  const s = settings || {} as StoreSettings
  const storeName = s.storeName || 'Cardápio'
  const storeIcon = s.storeIcon || '🍔'
  const whatsapp = s.whatsapp || ''
  const address = s.address || ''
  const openingHours = s.openingHours ? JSON.parse(s.openingHours) : null

  return (
    <div className="container" style={{ padding: '32px 0' }}>
      <Link to="/" className="btn btn-outline btn-sm" style={{ marginBottom: 20 }}>← Cardápio</Link>

      <div className="card" style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: '3rem' }}>{storeIcon}</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>{storeName}</h1>
          <p style={{ color: 'var(--text-light)' }}>Conheça um pouco mais sobre nós</p>
        </div>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Quem Somos</h2>
          <p style={{ lineHeight: 1.7, color: 'var(--text)' }}>
            Bem-vindo ao {storeName}! Trabalhamos com dedicação para oferecer
            a melhor experiência gastronômica para nossos clientes.
          </p>
          <p style={{ lineHeight: 1.7, color: 'var(--text)', marginTop: 12 }}>
            Nosso compromisso é oferecer um atendimento rápido e de qualidade,
            seja para retirar na loja ou receber no conforto da sua casa.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Nossos Valores</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              { icon: '⭐', title: 'Qualidade', desc: 'Ingredientes selecionados' },
              { icon: '⏱️', title: 'Agilidade', desc: 'Preparo rápido e eficiente' },
              { icon: '💛', title: 'Carinho', desc: 'Feito com dedicação' },
              { icon: '😊', title: 'Atendimento', desc: 'Satisfação garantida' },
            ].map(v => (
              <div key={v.title} className="card" style={{ padding: 16, textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>{v.icon}</span>
                <p style={{ fontWeight: 600, marginTop: 8 }}>{v.title}</p>
                <p style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>📍 Informações</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '.95rem' }}>
            {address && <p>📍 {address}</p>}
            {whatsapp && <p>📱 WhatsApp: {whatsapp}</p>}
            {s.footerText && <p>{s.footerText}</p>}
            {!address && !whatsapp && <p style={{ color: 'var(--text-light)' }}>Dados não configurados pelo estabelecimento.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
