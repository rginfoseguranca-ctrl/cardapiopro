import { Link } from 'react-router-dom'

const categories = ['Todos', 'Delivery', 'Tráfego Pago', 'Marketing Digital', 'iFood']

const mentorias = [
  { title: 'Como Estruturar Seu Cardápio', author: 'Herbert Nobre', category: 'Delivery', emoji: '📱', color: '#667eea', desc: 'Aprenda a montar um cardápio digital que converte visitantes em clientes.' },
  { title: 'Estratégias dos Restaurantes que Mais Crescem', author: 'Fábio Bindes', category: 'Marketing Digital', emoji: '🚀', color: '#e74c3c', desc: 'Práticas e estratégias dos restaurantes com maior crescimento do Brasil.' },
  { title: 'Como Conseguir Clientes Todos os Dias', author: 'Marcos Dellamarque', category: 'Tráfego Pago', emoji: '📢', color: '#27ae60', desc: 'Estratégias para atrair novos clientes diariamente via tráfego pago.' },
  { title: 'Custo e Precificação para Delivery', author: 'Rodrigo Scartezini', category: 'Delivery', emoji: '💰', color: '#f39c12', desc: 'Como calcular custos e precificar seus produtos para maximizar lucro.' },
  { title: 'Marketing Digital para Restaurantes', author: 'Rodrigo Bindes', category: 'Marketing Digital', emoji: '📈', color: '#9b59b6', desc: 'Os 5 pilares para o restaurante bater recorde de vendas com marketing digital.' },
  { title: 'Destravando o Tráfego Pago', author: 'Cayo Sá', category: 'Tráfego Pago', emoji: '🎯', color: '#3498db', desc: 'Como configurar e escalar campanhas de tráfego pago para delivery.' },
  { title: 'Aumentar Vendas no iFood', author: 'Fernando Baldino', category: 'iFood', emoji: '🛵', color: '#e74c3c', desc: 'Estratégias comprovadas para aumentar suas vendas na plataforma iFood.' },
  { title: 'Entregas Rápidas no iFood', author: 'Eduardo Nanni', category: 'iFood', emoji: '⚡', color: '#e67e22', desc: 'A importância de entregar rápido e como otimizar sua logística.' },
  { title: 'Máquina de Vendas para Delivery', author: 'Marcos Dellamarque', category: 'Delivery', emoji: '⚙️', color: '#2c3e50', desc: 'Monte uma operação de delivery que gera vendas de forma consistente.' },
  { title: 'Vender Mais com Tráfego Pago', author: 'Bruno Urel', category: 'Tráfego Pago', emoji: '🔥', color: '#c0392b', desc: 'Como usar tráfego pago para escalar vendas no seu delivery.' },
  { title: 'Posicionar nas Redes Sociais', author: 'Rafael Freitas', category: 'Marketing Digital', emoji: '📱', color: '#1abc9c', desc: 'Como posicionar seu restaurante nas redes sociais do absoluto zero.' },
  { title: 'Se Torne o Brabo do Delivery', author: 'André Lopes', category: 'Delivery', emoji: '🏆', color: '#f1c40f', desc: 'Estratégias avançadas para dominar o mercado de delivery na sua região.' },
]

export default function Materiais() {
  return (
    <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <span style={{ fontSize: '3rem' }}>📚</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: 16, marginBottom: 12 }}>Aprenda com o CardápioPro</h1>
          <p style={{ fontSize: '1.1rem', opacity: .92, lineHeight: 1.6 }}>
            Conteúdos gratuitos para você dominar o mercado de delivery e aumentar suas vendas.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: '32px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky' as const, top: 64, zIndex: 50 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 12, overflowX: 'auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map(cat => (
            <span key={cat} style={{
              padding: '8px 20px', borderRadius: 20, fontSize: '.88rem', fontWeight: 600, cursor: 'pointer',
              background: cat === 'Todos' ? '#667eea' : '#f5f5f5', color: cat === 'Todos' ? '#fff' : '#666',
              border: 'none', transition: '.2s', whiteSpace: 'nowrap' as const
            }}>
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* MENTORIAS */}
      <section style={{ padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>Mentorias</h2>
          <p style={{ color: '#666', marginBottom: 32 }}>Aprenda com os maiores especialistas do mercado de delivery.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {mentorias.map(m => (
              <div key={m.title} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #f0f0f0', transition: '.25s', cursor: 'pointer' }}>
                <div style={{ width: '100%', height: 160, background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span style={{ fontSize: '3rem' }}>{m.emoji}</span>
                  <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,.5)', color: '#fff', padding: '3px 10px', borderRadius: 6, fontSize: '.7rem', fontWeight: 60 }}>{m.category}</span>
                </div>
                <div style={{ padding: 20 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, color: '#1a1a1a' }}>{m.title}</h4>
                  <p style={{ fontSize: '.85rem', color: '#666', lineHeight: 1.5, marginBottom: 12 }}>{m.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 16, background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.7rem', fontWeight: 700, flexShrink: 0 }}>
                      {m.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span style={{ fontSize: '.82rem', color: '#888' }}>Com {m.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YOUTUBE SECTION */}
      <section style={{ padding: '48px 24px', background: '#f7f8fa' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>Vídeos em Destaque</h2>
          <p style={{ color: '#666', marginBottom: 32 }}>Assista nossos tutoriais e aprenda na prática.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              { title: 'Como Usar o Cardápio Digital', color: '#e74c3c', emoji: '📱' },
              { title: '5 Dicas para Vender Mais', color: '#27ae60', emoji: '📈' },
              { title: 'Gerenciar Estoque do Delivery', color: '#3498db', emoji: '📦' },
              { title: 'Configurar Agendamento de Pedidos', color: '#9b59b6', emoji: '📅' },
            ].map(v => (
              <div key={v.title} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #f0f0f0', cursor: 'pointer' }}>
                <div style={{ width: '100%', height: 180, background: `linear-gradient(135deg, ${v.color}, ${v.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span style={{ fontSize: '3rem' }}>{v.emoji}</span>
                  <div style={{ position: 'absolute', width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: v.color }}>▶</div>
                </div>
                <div style={{ padding: 16 }}>
                  <h4 style={{ fontSize: '.95rem', fontWeight: 700 }}>{v.title}</h4>
                  <p style={{ fontSize: '.8rem', color: '#999', marginTop: 4 }}>CardápioPro</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', padding: '60px 24px', textAlign: 'center', color: '#fff' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>Quer mais conteúdos como esses?</h2>
        <p style={{ fontSize: '1rem', opacity: .92, marginBottom: 28 }}>
          Siga nas redes sociais e tenha acesso a conteúdos que vão ajudar você a alcançar o sucesso.
        </p>
        <Link to="/" style={{ background: '#fff', color: '#e74c3c', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: '1rem', textDecoration: 'none', display: 'inline-block' }}>
          Conheça o CardápioPro
        </Link>
      </section>
    </div>
  )
}
