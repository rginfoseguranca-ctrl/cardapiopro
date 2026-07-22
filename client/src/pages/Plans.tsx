import { Link } from 'react-router-dom'

const plans = [
  {
    name: 'Start',
    price: '49,99',
    period: '/mês',
    desc: 'Para quem quer começar no digital',
    features: ['Cardápio Digital', 'Pedidos WhatsApp', 'Dashboard', 'Clientes', 'Cupons', 'Blog', 'Fidelidade'],
    cta: 'Começar Agora',
    popular: false,
  },
  {
    name: 'Profissional',
    price: '79,99',
    period: '/mês',
    desc: 'Gestão completa do seu restaurante',
    features: ['Tudo do Start', 'Delivery', 'Mesas e Comandas', 'KDS Cozinha', 'PDV Integrado', 'Fiado', 'Estoque', 'Impressoras'],
    cta: 'Teste Grátis 14 Dias',
    popular: true,
  },
  {
    name: 'Premium',
    price: '149,99',
    period: '/mês',
    desc: 'Para quem quer crescer com força total',
    features: ['Tudo do Profissional', 'Chatbot IA', 'CRM Completo', 'Cashback', 'Campanhas', 'Rotas de Entrega', 'Suporte VIP'],
    cta: 'Teste Grátis 14 Dias',
    popular: false,
  },
]

export default function Plans() {
  return (
    <div style={{ padding: '40px 16px' }}>
      <div className="container" style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Planos e Preços</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>Teste grátis por 14 dias. Cancele quando quiser.</p>
      </div>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 960 }}>
        {plans.map(plan => (
          <div key={plan.name} className="card" style={{
            padding: 32, textAlign: 'center', position: 'relative',
            border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
            transform: plan.popular ? 'scale(1.05)' : 'none',
          }}>
            {plan.popular && (
              <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: '.8rem', fontWeight: 600 }}>
                MAIS POPULAR
              </span>
            )}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>{plan.name}</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '.9rem', marginBottom: 16 }}>{plan.desc}</p>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>R$ {plan.price}</span>
              <span style={{ color: 'var(--text-light)' }}>{plan.period}</span>
            </div>
            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              {plan.features.map(f => (
                <p key={f} style={{ padding: '4px 0', fontSize: '.9rem' }}>✅ {f}</p>
              ))}
            </div>
            <Link to="/cadastro" className="btn" style={{ width: '100%', background: plan.popular ? 'var(--primary)' : 'var(--text)', color: '#fff', display: 'block' }}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
