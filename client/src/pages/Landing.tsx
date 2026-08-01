import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const features = [
  { icon: '📱', bg: '#fff3e0', title: 'Cardápio Digital', desc: 'Cardápio online responsivo, bonito e rápido para delivery, mesa e balcão.' },
  { icon: '🛒', bg: '#e8f5e9', title: 'Pedidos Online', desc: 'Receba pedidos automaticamente do WhatsApp, site e redes sociais.' },
  { icon: '📊', bg: '#e3f2fd', title: 'Dashboard Completo', desc: 'Vendas, clientes, financeiro e métricas em tempo real.' },
  { icon: '💳', bg: '#fce4ec', title: 'Pagamento Online', desc: 'PIX, cartão de crédito e débito direto pelo cardápio.' },
  { icon: '🤖', bg: '#f3e5f5', title: 'Chatbot IA', desc: 'Atendimento automatizado 24h no WhatsApp com inteligência artificial.' },
  { icon: '🎯', bg: '#fff8e1', title: 'Programa de Fidelidade', desc: 'Pontos, recompensas e cashback para manter seus clientes voltando.' },
  { icon: '📦', bg: '#e0f2f1', title: 'Controle de Estoque', desc: 'Gerencie insumos, fichas técnicas e alertas de reposição.' },
  { icon: '💰', bg: '#fbe9e7', title: 'Módulo Financeiro', desc: 'Contas a pagar, receber, fluxo de caixa e relatórios.' },
  { icon: '🖨️', bg: '#f1f8e9', title: 'Impressão Automática', desc: 'Comandas de cozinha e delivery impressas automaticamente.' },
  { icon: '🗺️', bg: '#e8eaf6', title: 'Rotas de Entrega', desc: 'Otimize rotas e acompanhe entregadores em tempo real.' },
  { icon: '📈', bg: '#fce4ec', title: 'CRM e Segmentação', desc: 'Histórico de clientes, segmentação e campanhas personalizadas.' },
  { icon: '📝', bg: '#fff3e0', title: 'Cupons e Descontos', desc: 'Cupons de primeira compra, aniversário e promoções estratégicas.' },
]

const plans = [
  { name: 'Start', price: '49,99', desc: 'Para quem está começando no digital', features: ['Cardápio Digital', 'Pedidos WhatsApp', 'Dashboard de Vendas', 'Gestão de Clientes', 'Cupons e Descontos', 'Blog Integrado', 'Programa de Fidelidade'], cta: 'Teste Grátis', popular: false },
  { name: 'Profissional', price: '79,99', desc: 'Gestão completa do seu restaurante', features: ['Tudo do Start +', 'Delivery com Rotas', 'Mesas e Comandas', 'KDS Cozinha', 'PDV Integrado', 'Fiado e Estoque', 'Impressoras'], cta: 'Teste Grátis 14 Dias', popular: true },
  { name: 'Premium', price: '149,99', desc: 'Para quem quer crescer com força total', features: ['Tudo do Profissional +', 'Chatbot IA WhatsApp', 'CRM Completo', 'Cashback Automático', 'Campanhas em Massa', 'Multi-Lojas', 'Suporte VIP'], cta: 'Teste Grátis 14 Dias', popular: false },
]

const faqItems = [
  { q: 'Como funciona o suporte?', a: 'Nosso suporte funciona de segunda a sábado, das 09h às 22h, e domingos das 14h às 22h. Você pode tirar dúvidas pelo WhatsApp ou pelo painel de ajuda.' },
  { q: 'Posso usar só no celular?', a: 'Sim! O CardápioPro funciona em qualquer dispositivo — celular, tablet, computador. Não precisa baixar aplicativo, basta acessar pelo navegador.' },
  { q: 'Qual o preço da ferramenta?', a: 'Nossos planos começam em R$49,99/mês para operações simples e vão até R$149,99/mês para operações completas com todas as funcionalidades.' },
  { q: 'Consigo imprimir comandas?', a: 'Sim! É possível imprimir comandas de delivery, retirada e cozinha. Você também pode destinar setores de impressão para diferentes produtos.' },
  { q: 'Meu cliente pode pagar online?', a: 'Sim! Oferecemos pagamento via PIX automático, cartão de crédito e débito, direto pelo cardápio digital.' },
  { q: 'Tem período de teste?', a: 'Sim! Oferecemos 14 dias de teste grátis em qualquer plano, sem necessidade de cartão de crédito.' },
]

const materials = [
  { title: 'Como Estruturar Seu Cardápio', author: 'Herbert Nobre', tag: 'Cardápio Digital', emoji: '📱', color: '#667eea' },
  { title: 'Estratégias dos Restaurantes que Mais Crescem', author: 'Fábio Bindes', tag: 'Estratégia', emoji: '🚀', color: '#e74c3c' },
  { title: 'Como Conseguir Clientes Todos os Dias', author: 'Marcos Dellamarque', tag: 'Tráfego Pago', emoji: '📢', color: '#27ae60' },
  { title: 'Custo e Precificação para Delivery', author: 'Rodrigo Scartezini', tag: 'Financeiro', emoji: '💰', color: '#f39c12' },
  { title: 'Marketing Digital para Restaurantes', author: 'Rodrigo Bindes', tag: 'Marketing', emoji: '📈', color: '#9b59b6' },
  { title: 'Destravando o Tráfego Pago', author: 'Cayo Sá', tag: 'Tráfego Pago', emoji: '🎯', color: '#3498db' },
]

const testimonials = [
  { name: 'Patrick Bartholazi', store: 'B3X Burger', text: '100% dos meus pedidos são feitos pelo cardápio digital. Se alguém se nega a usar, eu prefiro abrir mão do cliente. É uma adesão total!', result: '+R$ 8 mil/mês', letter: 'P' },
  { name: 'Julio Martins', store: 'Pão de Alho do Julio', text: 'De uma noite de 40 pedidos, apenas 3 são manuais. A grande maioria é pelo cardápio digital. A adesão é enorme.', result: '+R$ 5 mil/mês', letter: 'J' },
  { name: 'Bruno Felipe', store: 'Oxen Burguer', text: 'O programa de fidelidade e as campanhas de WhatsApp trouxeram muitos clientes de volta. O chatbot automatiza 80% do meu atendimento.', result: '+R$ 12 mil/mês', letter: 'B' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [activePillar, setActivePillar] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [heroForm, setHeroForm] = useState({ storeName: '', email: '', whatsapp: '', segment: '' })

  const pillars = [
    { icon: '🤖', bg: '#e8f5e9', title: 'Automação', desc: 'Cardápios digitais, chatbot de WhatsApp, agendamento e pagamentos online para automatizar seu atendimento.', items: ['Chatbot com IA', 'Cardápio Digital', 'Pagamento Online', 'Agendamento'] },
    { icon: '📈', bg: '#fff3e0', title: 'Vendas', desc: 'Disparador de WhatsApp, programa de fidelidade, cupons e integrações com Meta e Google Ads.', items: ['Disparador WhatsApp', 'Fidelidade e Cashback', 'Cupons Estratégicos', 'Integração com Anúncios'] },
    { icon: '⚙️', bg: '#e3f2fd', title: 'Gestão', desc: 'Controle de caixa, estoque, fiado, notas fiscais, impressoras e gestão de entregadores.', items: ['Caixa e Financeiro', 'Estoque Avançado', 'NF-e e Relatórios', 'Impressoras e KDS'] },
  ]

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', color: '#1a1a1a' }}>

      {/* HEADER */}
      <header style={{ position: 'sticky' as const, top: 0, zIndex: 100, background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #eee', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e74c3c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            🍔 CardápioPro
          </Link>
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <a href="#funcionalidades" style={{ color: '#444', textDecoration: 'none', fontSize: '.9rem', fontWeight: 500 }}>Funcionalidades</a>
            <a href="#materiais" style={{ color: '#444', textDecoration: 'none', fontSize: '.9rem', fontWeight: 500 }}>Conteúdos</a>
            <Link to="/planos" style={{ color: '#444', textDecoration: 'none', fontSize: '.9rem', fontWeight: 500 }}>Planos</Link>
            <Link to="/blog" style={{ color: '#444', textDecoration: 'none', fontSize: '.9rem', fontWeight: 500 }}>Blog</Link>
            <Link to="/login" style={{ color: '#666', textDecoration: 'none', fontSize: '.9rem', fontWeight: 500 }}>Login</Link>
            <Link to="/cadastro" style={{ background: '#e74c3c', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: '.9rem', textDecoration: 'none' }}>Teste Grátis</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #a93226 100%)', color: '#fff', padding: '80px 24px 100px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', padding: '6px 16px', borderRadius: 20, fontSize: '.8rem', fontWeight: 600, marginBottom: 20, border: '1px solid rgba(255,255,255,.2)' }}>🚀 Novo: Chatbot com IA integrado</span>
            <h1 style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-.02em' }}>O Cardápio Digital mais completo do Brasil</h1>
            <p style={{ fontSize: '1.15rem', opacity: .92, lineHeight: 1.7, marginBottom: 32, maxWidth: 500 }}>
              Experimente a ferramenta que vai automatizar seus pedidos no WhatsApp, aumentar suas vendas com marketing e profissionalizar a gestão do seu negócio.
            </p>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxWidth: 420 }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Comece seu teste grátis agora</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input placeholder="Nome do restaurante" value={heroForm.storeName} onChange={e => setHeroForm(f => ({ ...f, storeName: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' as const }} />
                <input placeholder="Seu e-mail" type="email" value={heroForm.email} onChange={e => setHeroForm(f => ({ ...f, email: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' as const }} />
                <input placeholder="WhatsApp (DDD + número)" value={heroForm.whatsapp} onChange={e => setHeroForm(f => ({ ...f, whatsapp: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' as const }} />
                <select value={heroForm.segment} onChange={e => setHeroForm(f => ({ ...f, segment: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '.9rem', outline: 'none', color: heroForm.segment ? '#333' : '#666', background: '#fff', boxSizing: 'border-box' as const }}>
                  <option>Qual o seu segmento?</option>
                  <option>Pizzaria</option>
                  <option>Hamburgueria</option>
                  <option>Restaurante</option>
                  <option>Lanchonete</option>
                  <option>Confeitaria</option>
                  <option>Açaíteria</option>
                  <option>Sushi</option>
                  <option>Marmitaria</option>
                  <option>Outro</option>
                </select>
                <button onClick={() => navigate('/cadastro')} style={{ width: '100%', padding: '14px', borderRadius: 8, background: '#e74c3c', color: '#fff', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: 4 }}>TESTE AGORA POR 14 DIAS</button>
                <p style={{ fontSize: '.75rem', color: '#999', marginTop: 4, textAlign: 'center' as const }}>Sem cartão de crédito • Cancele quando quiser</p>
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' as const, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxWidth: 320 }}>
                <div style={{ background: '#f0f0f0', borderRadius: 8, padding: 4, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: '#ff5f57' }} />
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: '#ffbd2e' }} />
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: '#28c840' }} />
                  </div>
                </div>
                <div style={{ background: '#e74c3c', borderRadius: '6px 6px 0 0', padding: '20px 16px', textAlign: 'center' }}>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: '.95rem' }}>🍔 Lanchonete do Zé</p>
                  <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.75rem', marginTop: 4 }}>Peça agora pelo cardápio digital</p>
                </div>
                <div style={{ padding: 12 }}>
                  {[
                    { emoji: '🍔', name: 'X-Burger Clássico', desc: 'Pão, hambúrguer, queijo, alface', price: 'R$ 24,90', bg: '#ffeaa7' },
                    { emoji: '🍕', name: 'Pizza Margherita', desc: 'Molho, mussarela, manjericão', price: 'R$ 39,90', bg: '#dfe6e9' },
                    { emoji: '🥤', name: 'Milkshake Chocolate', desc: 'Chocolate belga, leite, sorvete', price: 'R$ 18,90', bg: '#c8d6e5' },
                  ].map(item => (
                    <div key={item.name} style={{ background: '#f9f9f9', borderRadius: 8, padding: 10, marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{item.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '.8rem' }}>{item.name}</p>
                        <p style={{ fontSize: '.7rem', color: '#999' }}>{item.desc}</p>
                        <p style={{ fontSize: '.85rem', fontWeight: 700, color: '#e74c3c' }}>{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ position: 'absolute', top: -10, right: -30, background: '#27ae60', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: '.75rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(39,174,96,.3)' }}>
                📦 Novo pedido!
              </div>
              <div style={{ position: 'absolute', bottom: 30, left: -40, background: '#fff', color: '#333', padding: '8px 14px', borderRadius: 10, fontSize: '.75rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#27ae60' }}>✓</span> Pagamento confirmado
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,.06)', maxWidth: 900, margin: '-40px auto 0', padding: '32px 48px', display: 'flex', justifyContent: 'space-around', position: 'relative' as const, zIndex: 10 }}>
        {[{ num: '+2 mil', label: 'clientes ativos' }, { num: '50 mil+', label: 'pedidos processados' }, { num: '+40%', label: 'aumento de vendas' }, { num: '24/7', label: 'suporte disponível' }].map(st => (
          <div key={st.label} style={{ textAlign: 'center' as const }}>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#e74c3c' }}>{st.num}</p>
            <p style={{ fontSize: '.85rem', color: '#888', marginTop: 4 }}>{st.label}</p>
          </div>
        ))}
      </div>

      {/* 3 PILARES */}
      <section style={{ padding: '80px 24px' }}>
        <p style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Os 3 Pilares do Food Marketing</p>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Tudo que seu negócio precisa numa única solução</h2>
        <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Automatize seu atendimento, aumente suas vendas e gerencie seu negócio em um único lugar.</p>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {pillars.map((p, i) => (
            <div key={p.title} style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', border: `2px solid ${activePillar === i ? '#e74c3c' : '#f0f0f0'}`, transition: '.3s', cursor: 'pointer', boxShadow: activePillar === i ? '0 8px 30px rgba(231,76,60,.12)' : 'none' }} onMouseEnter={() => setActivePillar(i)}>
              <div style={{ width: 80, height: 80, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2.5rem', background: p.bg }}>{p.icon}</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h3>
              <p style={{ fontSize: '.9rem', color: '#666', lineHeight: 1.6 }}>{p.desc}</p>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {p.items.map(item => (
                  <span key={item} style={{ fontSize: '.82rem', color: '#666', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <span style={{ color: '#e74c3c' }}>✓</span> {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* E-COMMERCE DOS RESTAURANTES */}
      <section style={{ padding: '80px 24px', background: '#f7f8fa' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#e74c3c', fontWeight: 700, fontSize: '.85rem', marginBottom: 8 }}>Canal Próprio de Vendas</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>O E-commerce dos Restaurantes</h2>
            <p style={{ color: '#666', lineHeight: 1.7, marginBottom: 24 }}>Oferecemos a infraestrutura digital definitiva para o seu food service. Muito além de um simples cardápio digital, nossa plataforma permite que você construa seu canal próprio de vendas, libertando seu delivery da dependência exclusiva e das altas taxas.</p>
            {['Venda direto para o consumidor', 'Recupere o controle sobre seus dados', 'Construa uma marca forte e independente'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ width: 24, height: 24, borderRadius: 12, background: '#eafaf1', color: '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: '.95rem', color: '#333', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 8px 30px rgba(0,0,0,.08)' }}>
            <div style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', borderRadius: 12, padding: 24, textAlign: 'center', color: '#fff' }}>
              <p style={{ fontSize: '3rem', marginBottom: 8 }}>🍔</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Seu Delivery Próprio</p>
              <p style={{ fontSize: '.85rem', opacity: .9, marginTop: 4 }}>Sem taxas de plataforma</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              {[
                { icon: '📱', label: 'Cardápio responsivo' },
                { icon: '💳', label: 'Pagamento online' },
                { icon: '📊', label: 'Relatórios tempo real' },
                { icon: '🔔', label: 'Notificações push' },
              ].map(f => (
                <div key={f.label} style={{ background: '#f9f9f9', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: '1.3rem' }}>{f.icon}</span>
                  <p style={{ fontSize: '.75rem', color: '#666', marginTop: 4 }}>{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AUTOMAÇÃO */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Atendimento Automatizado</p>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Automação de atendimento</h2>
          <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Ferramentas de cardápio digital e chatbot de WhatsApp para aumentar suas vendas reduzindo erros de atendimento.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: '🤖', title: 'Chatbot de WhatsApp', desc: 'Atenda seus clientes 24h com robô inteligente' },
              { icon: '📱', title: 'Cardápio Digital', desc: 'Site profissional para receber pedidos online' },
              { icon: '💳', title: 'Pagamento Online', desc: 'PIX e cartão direto pelo cardápio' },
              { icon: '📅', title: 'Agendamento', desc: 'Clientes escolhem data e horário de entrega' },
            ].map(f => (
              <div key={f.title} style={{ background: '#f9f9f9', borderRadius: 14, padding: 24, textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>{f.icon}</span>
                <h4 style={{ fontWeight: 700, marginTop: 10, marginBottom: 4 }}>{f.title}</h4>
                <p style={{ fontSize: '.85rem', color: '#666' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VENDAS */}
      <section style={{ padding: '80px 24px', background: '#f7f8fa' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Aumente Suas Vendas</p>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Ferramentas de vendas</h2>
          <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Soluções de disparo de mensagem no WhatsApp, fidelidade e integrações para crescer mais rápido.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: '📨', title: 'Disparador WhatsApp', desc: 'Mensagens em massa personalizadas' },
              { icon: '🎯', title: 'Programa de Fidelidade', desc: 'Pontos e recompensas automáticas' },
              { icon: '🎟️', title: 'Cupons Estratégicos', desc: 'Atraia e retenha clientes' },
              { icon: '💰', title: 'Cashback', desc: 'Devolva parte do valor como crédito' },
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', border: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '2rem' }}>{f.icon}</span>
                <h4 style={{ fontWeight: 700, marginTop: 10, marginBottom: 4 }}>{f.title}</h4>
                <p style={{ fontSize: '.85rem', color: '#666' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GESTÃO */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Gerencie Seu Negócio</p>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Sistema de gestão completo</h2>
          <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Integrado a outras plataformas. Profissionalize sua operação com eficiência e prontidão para escalar.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: '💰', title: 'Controle de Caixa', desc: 'Movimentações financeiras organizadas' },
              { icon: '📦', title: 'Gestão de Estoque', desc: 'Insumos, fichas técnicas e alertas' },
              { icon: '💸', title: 'Controle de Fiado', desc: 'Dívidas dos clientes organizadas' },
              { icon: '📄', title: 'Nota Fiscal', desc: 'Emissão e gestão de NF-e integrada' },
            ].map(f => (
              <div key={f.title} style={{ background: '#f9f9f9', borderRadius: 14, padding: 24, textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>{f.icon}</span>
                <h4 style={{ fontWeight: 700, marginTop: 10, marginBottom: 4 }}>{f.title}</h4>
                <p style={{ fontSize: '.85rem', color: '#666' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section style={{ padding: '80px 24px', background: '#f7f8fa' }}>
        <p style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Cases de Sucesso</p>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Marcas que cresceram com o CardápioPro</h2>
        <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Conheça histórias reais de restaurantes que aumentaram suas vendas.</p>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {testimonials.map(t => (
            <div key={t.name} style={{ background: '#fff', borderRadius: 14, padding: 28, border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: '.95rem', color: '#444', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 20 }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, background: 'linear-gradient(135deg, #e74c3c, #f39c12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>{t.letter}</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '.95rem' }}>{t.name}</p>
                  <p style={{ fontSize: '.82rem', color: '#999' }}>{t.store}</p>
                  <span style={{ display: 'inline-block', background: '#eafaf1', color: '#27ae60', padding: '4px 12px', borderRadius: 8, fontSize: '.8rem', fontWeight: 600, marginTop: 4 }}>{t.result}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" style={{ padding: '80px 24px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Conheça as funcionalidades</h2>
        <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Mais de 20 ferramentas integradas para automatizar, vender e gerenciar seu restaurante.</p>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 14, padding: 28, border: '1px solid #f0f0f0' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 14, background: f.bg }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: '.88rem', color: '#666', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section style={{ padding: '80px 24px', background: '#f7f8fa' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Como funciona</h2>
        <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Em 3 passos simples, seu restaurante já está no digital.</p>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
          {[
            { num: '1', title: 'Cadastre-se', desc: 'Crie sua conta gratuita em menos de 2 minutos. Sem cartão de crédito.' },
            { num: '2', title: 'Monte seu cardápio', desc: 'Adicione categorias, produtos, fotos e preços. Nossa equipe ajuda você.' },
            { num: '3', title: 'Comece a vender', desc: 'Compartilhe o link, WhatsApp ou QR Code e receba pedidos automaticamente.' },
          ].map(st => (
            <div key={st.num}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem', margin: '0 auto 16px' }}>{st.num}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>{st.title}</h3>
              <p style={{ fontSize: '.9rem', color: '#666', textAlign: 'center', lineHeight: 1.5 }}>{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS */}
      <section style={{ padding: '80px 24px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Conheça nossos planos</h2>
        <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Escolha o plano ideal para o tamanho do seu negócio. Teste grátis por 14 dias.</p>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {plans.map(p => (
            <div key={p.name} style={{ background: '#fff', borderRadius: 16, padding: 32, border: `2px solid ${p.popular ? '#e74c3c' : '#f0f0f0'}`, textAlign: 'center', position: 'relative' as const, transform: p.popular ? 'scale(1.04)' : 'none', boxShadow: p.popular ? '0 12px 40px rgba(231,76,60,.15)' : 'none' }}>
              {p.popular && <span style={{ position: 'absolute' as const, top: -14, left: '50%', transform: 'translateX(-50%)', background: '#e74c3c', color: '#fff', padding: '5px 20px', borderRadius: 20, fontSize: '.78rem', fontWeight: 700 }}>MAIS POPULAR</span>}
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>{p.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: '.9rem', color: '#999' }}>R$</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#e74c3c', lineHeight: 1 }}>{p.price}</span>
                <span style={{ fontSize: '.85rem', color: '#999' }}>/mês</span>
              </div>
              <p style={{ fontSize: '.88rem', color: '#666', margin: '12px 0 20px' }}>{p.desc}</p>
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '.88rem', color: '#444' }}>
                    <span style={{ color: '#27ae60', fontWeight: 700 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/cadastro" style={{ display: 'block', padding: '14px', borderRadius: 10, background: p.popular ? '#e74c3c' : '#fff', color: p.popular ? '#fff' : '#e74c3c', fontWeight: 700, textDecoration: 'none', border: p.popular ? 'none' : '2px solid #e74c3c', textAlign: 'center' }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* MATERIAIS */}
      <section id="materiais" style={{ padding: '80px 24px', background: '#f7f8fa' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Materiais gratuitos para você estudar</h2>
        <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Aprenda sobre o mercado de delivery com conteúdos exclusivos dos maiores especialistas.</p>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {materials.map(m => (
            <div key={m.title} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
              <div style={{ width: '100%', height: 160, background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2.5rem' }}>
                {m.emoji}
              </div>
              <div style={{ padding: 20 }}>
                <span style={{ display: 'inline-block', background: '#f0e6ff', color: '#8e44ad', padding: '3px 10px', borderRadius: 6, fontSize: '.72rem', fontWeight: 600, marginBottom: 8 }}>{m.tag}</span>
                <h4 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: 4 }}>{m.title}</h4>
                <p style={{ fontSize: '.82rem', color: '#999' }}>Com {m.author}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/materiais" style={{ background: '#e74c3c', color: '#fff', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: '1rem', textDecoration: 'none', display: 'inline-block' }}>Ver Todos os Materiais</Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 24px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>Perguntas frequentes</h2>
        <p style={{ fontSize: '1.05rem', textAlign: 'center', color: '#666', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>Tire suas dúvidas sobre o CardápioPro.</p>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {faqItems.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid #f0f0f0', padding: '18px 0', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item.q}</span>
                <span style={{ fontSize: '1.2rem', color: '#999', transition: '.3s', transform: openFaq === i ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
              </div>
              {openFaq === i && <p style={{ fontSize: '.9rem', color: '#666', lineHeight: 1.6, marginTop: 12 }}>{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', padding: '80px 24px', textAlign: 'center', color: '#fff' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 16 }}>Preparado para vender mais?</h2>
        <p style={{ fontSize: '1.1rem', opacity: .92, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
          Comece agora e automatize seus pedidos, aumente suas vendas e gerencie tudo em um só lugar.
        </p>
        <Link to="/cadastro" style={{ background: '#fff', color: '#e74c3c', padding: '16px 40px', borderRadius: 10, fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', display: 'inline-block' }}>
          Começar Agora Grátis
        </Link>
        <p style={{ marginTop: 16, opacity: .75, fontSize: '.85rem' }}>14 dias grátis • Sem cartão de crédito</p>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#1a1d23', color: '#fff', padding: '60px 24px 30px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: '#e74c3c' }}>🍔 CardápioPro</h3>
            <p style={{ color: '#888', fontSize: '.88rem', lineHeight: 1.7, maxWidth: 280 }}>
              A plataforma completa para gerenciar seu restaurante com cardápio digital, pedidos online e muito mais.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Funcionalidades</h4>
            <a href="#funcionalidades" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Cardápio Digital</a>
            <a href="#funcionalidades" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Chatbot WhatsApp</a>
            <a href="#funcionalidades" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Programa de Fidelidade</a>
            <a href="#funcionalidades" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Sistema de Gestão</a>
            <a href="#funcionalidades" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Módulo Financeiro</a>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Empresa</h4>
            <Link to="/about" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Sobre Nós</Link>
            <Link to="/blog" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Blog</Link>
            <Link to="/parceiros" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Parceiros</Link>
            <Link to="/materiais" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Materiais Gratuitos</Link>
            <a href="#funcionalidades" style={{ color: '#888', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>Central de Ajuda</a>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Suporte</h4>
            <p style={{ color: '#888', fontSize: '.85rem', lineHeight: 1.7 }}>
              Segunda a sábado: 09h às 22h<br />
              Domingo: 14h às 22h
            </p>
            <a href="mailto:suporte@cardapiopro.com" style={{ color: '#e74c3c', textDecoration: 'none', fontSize: '.88rem', lineHeight: 2, display: 'block' }}>suporte@cardapiopro.com</a>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #2a2d35', marginTop: 40, paddingTop: 20, textAlign: 'center', color: '#666', fontSize: '.82rem', maxWidth: 1100, margin: '40px auto 0' }}>
          <p>© {new Date().getFullYear()} CardápioPro. Todos os direitos reservados.</p>
          <div style={{ marginTop: 8 }}>
            <Link to="/termos" style={{ color: '#666', textDecoration: 'none', fontSize: '.8rem', marginRight: 16 }}>Termos de Uso</Link>
            <Link to="/privacidade" style={{ color: '#666', textDecoration: 'none', fontSize: '.8rem' }}>Política de Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
