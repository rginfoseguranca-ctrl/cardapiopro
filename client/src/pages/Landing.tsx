import { Link } from 'react-router-dom'

const features = [
  { icon: '📱', title: 'Cardápio Digital', desc: 'Cardápio responsivo e bonito para seus clientes' },
  { icon: '🛒', title: 'Pedidos Online', desc: 'Delivery, retirada, mesa e balcão' },
  { icon: '📊', title: 'Dashboard Completo', desc: 'Vendas, clientes, financeiro em tempo real' },
  { icon: '💳', title: 'Pagamento Online', desc: 'PIX, cartão de crédito e débito' },
  { icon: '🔔', title: 'Notificações Push', desc: 'Alertas em tempo real para novos pedidos' },
  { icon: '🎯', title: 'Marketing', desc: 'Cupons, fidelidade, cashback e campanhas' },
  { icon: '📦', title: 'Gestão de Estoque', desc: 'Controle de insumos e receitas' },
  { icon: '💰', title: 'Financeiro', desc: 'Contas, transações, relatórios e fiado' },
  { icon: '🤖', title: 'Chatbot IA', desc: 'Atendimento automatizado via WhatsApp' },
  { icon: '🖨️', title: 'Impressão', desc: 'Comandas e pedidos direto na impressora' },
  { icon: '🗺️', title: 'Rotas de Entrega', desc: 'Otimização de rotas e entregadores' },
  { icon: '📈', title: 'CRM', desc: 'Histórico e segmentação de clientes' },
]

const testimonials = [
  { name: 'Maria Silva', store: 'Lanchonete Sabor', text: 'Aumentei 40% meus pedidos depois que implementei o CardápioPro. Muito fácil de usar!' },
  { name: 'João Santos', store: 'Pizza Express', text: 'O módulo de mesas e KDS revolucionou meu restaurante. Recomendo!' },
  { name: 'Ana Costa', store: 'Hamburgueria Arte', text: 'O programa de fidelidade trouxe muitos clientes de volta. Excelente ferramenta.' },
]

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        color: '#fff', padding: '80px 20px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <span style={{ fontSize: '4rem' }}>🍔</span>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginTop: 16, marginBottom: 16 }}>
            CardápioPro
          </h1>
          <p style={{ fontSize: '1.3rem', opacity: 0.95, marginBottom: 32, lineHeight: 1.6 }}>
            A plataforma completa para gerenciar seu restaurante/lanchonete.
            Cardápio digital, pedidos online, gestão financeira e muito mais.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/cadastro" style={{
              background: '#fff', color: '#e74c3c', padding: '16px 32px',
              borderRadius: 12, fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none',
            }}>
              Teste Grátis por 14 Dias
            </Link>
            <Link to="/planos" style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '16px 32px',
              borderRadius: 12, fontWeight: 600, fontSize: '1.1rem', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>
              Ver Planos
            </Link>
          </div>
          <p style={{ marginTop: 20, opacity: 0.8, fontSize: '.9rem' }}>
            Sem cartão de crédito • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '40px 20px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 32 }}>
          {[
            { num: '500+', label: 'Restaurantes' },
            { num: '50k+', label: 'Pedidos/mês' },
            { num: '98%', label: 'Satisfação' },
            { num: '24/7', label: 'Suporte' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#e74c3c' }}>{s.num}</p>
              <p style={{ color: '#666', fontSize: '.9rem' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
            Tudo que você precisa
          </h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 48, fontSize: '1.1rem' }}>
            Uma plataforma completa para modernizar seu negócio
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} className="card" style={{ padding: 24 }}>
                <span style={{ fontSize: '2rem' }}>{f.icon}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 12, marginBottom: 4 }}>{f.title}</h3>
                <p style={{ color: '#666', fontSize: '.9rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 20px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: 48 }}>
            Como funciona
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
            {[
              { step: '1', icon: '📝', title: 'Cadastre-se', desc: 'Crie sua conta em 2 minutos' },
              { step: '2', icon: '🍔', title: 'Monte seu cardápio', desc: 'Adicione categorias e produtos' },
              { step: '3', icon: '🚀', title: 'Comece a vender', desc: 'Compartilhe o link e receba pedidos' },
            ].map(s => (
              <div key={s.step}>
                <div style={{
                  width: 48, height: 48, borderRadius: 24, background: '#e74c3c',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.2rem', margin: '0 auto 16px',
                }}>{s.step}</div>
                <span style={{ fontSize: '2rem' }}>{s.icon}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 8 }}>{s.title}</h3>
                <p style={{ color: '#666', fontSize: '.9rem', marginTop: 4 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: 48 }}>
            O que dizem nossos clientes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {testimonials.map(t => (
              <div key={t.name} className="card" style={{ padding: 24 }}>
                <p style={{ fontStyle: 'italic', color: '#555', marginBottom: 16, lineHeight: 1.6 }}>"{t.text}"</p>
                <p style={{ fontWeight: 700 }}>{t.name}</p>
                <p style={{ color: '#999', fontSize: '.85rem' }}>{t.store}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: '#fff', padding: '60px 20px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>
            Comece agora mesmo
          </h2>
          <p style={{ opacity: 0.9, marginBottom: 32, fontSize: '1.1rem' }}>
            Teste grátis por 14 dias. Sem compromisso, sem cartão de crédito.
          </p>
          <Link to="/cadastro" style={{
            background: '#e74c3c', color: '#fff', padding: '16px 40px',
            borderRadius: 12, fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none',
            display: 'inline-block',
          }}>
            Criar Minha Conta Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1a252f', color: '#fff', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🍔 CardápioPro</h3>
            <p style={{ color: '#95a5a6', fontSize: '.9rem', lineHeight: 1.6 }}>
              A plataforma completa para gerenciar seu restaurante com cardápio digital.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Produto</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/planos" style={{ color: '#95a5a6', textDecoration: 'none', fontSize: '.9rem' }}>Planos</Link>
              <Link to="/about" style={{ color: '#95a5a6', textDecoration: 'none', fontSize: '.9rem' }}>Sobre</Link>
              <Link to="/blog" style={{ color: '#95a5a6', textDecoration: 'none', fontSize: '.9rem' }}>Blog</Link>
              <Link to="/help" style={{ color: '#95a5a6', textDecoration: 'none', fontSize: '.9rem' }}>Ajuda</Link>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/termos" style={{ color: '#95a5a6', textDecoration: 'none', fontSize: '.9rem' }}>Termos de Uso</Link>
              <Link to="/privacidade" style={{ color: '#95a5a6', textDecoration: 'none', fontSize: '.9rem' }}>Privacidade</Link>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Contato</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: '#95a5a6', fontSize: '.9rem' }}>
              <p>suporte@seudominio.com</p>
              <p>(00) 00000-0000</p>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #2c3e50', marginTop: 32, paddingTop: 24, textAlign: 'center', color: '#7f8c8d', fontSize: '.85rem' }}>
          © {new Date().getFullYear()} CardápioPro. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
