import { Link } from 'react-router-dom'

const plans = [
  {
    name: 'Delivery',
    price: 'Grátis',
    period: '',
    desc: 'Para quem quer começar no delivery',
    features: ['Cardápio Digital', 'Pedidos pelo WhatsApp', 'Gestão de Pedidos', 'Retirada e Delivery', 'Pagamento online'],
    cta: 'Começar Grátis',
    popular: false,
  },
  {
    name: 'Premium',
    price: 'Grátis',
    period: '',
    desc: 'Para quem quer crescer com força total',
    features: ['Tudo do plano Delivery', 'Chatbot com IA', 'Disparador de WhatsApp', 'Programa de Fidelidade', 'Cupons e Descontos', 'Cashback', 'CRM Completo', 'Módulo Financeiro', 'Suporte Prioritário'],
    cta: 'Ativar Premium',
    popular: true,
  },
  {
    name: 'Mesas',
    price: 'Grátis',
    period: '',
    desc: 'Para restaurantes com operação presencial',
    features: ['Cardápio QR Code por Mesa', 'Gestão de Mesas e Comandas', 'KDS (Cozinha)', 'PDV Integrado', 'Controle de Caixa', 'Impressoras por Setor', 'Módulo KDS'],
    cta: 'Ativar Mesas',
    popular: false,
  },
]

export default function Plans() {
  return (
    <div style={{ padding: '40px 16px' }}>
      <div className="container" style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Planos e Preços</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>Todos os recursos inclusos. Sem mensalidade.</p>
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
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{plan.price}</span>
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
