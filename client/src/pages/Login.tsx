import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { loginAuth } from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuth(s => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await loginAuth(email, password)
      if (data.error) {
        setError(data.error)
      } else {
        login(data.token, data.user, data.mustChangePassword)
        navigate('/dashboard')
      }
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #a93226 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: 40, color: '#fff', position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, color: '#fff', textDecoration: 'none' }}>
            <span style={{ fontSize: '2rem' }}>🍔</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>CardápioPro</span>
          </Link>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Entrar no Painel</h1>
          <p style={{ opacity: .85, marginBottom: 32, fontSize: '1rem', lineHeight: 1.6 }}>
            Acesse o painel de controle para gerenciar seu restaurante.
          </p>

          <div style={{
            background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>E-mail</label>
                <input
                  type="email" placeholder="seu@email.com" required
                  style={inputStyle}
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Senha</label>
                <input
                  type="password" placeholder="••••••••" required
                  style={inputStyle}
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <div style={{
                  background: '#fef5f5', border: '1px solid #f5c6cb', borderRadius: 8,
                  padding: '10px 14px', fontSize: '.85rem', color: '#c0392b',
                }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{
                width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, borderRadius: 10,
              }} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/esqueci-senha" style={{ fontSize: '.85rem', color: '#e74c3c', fontWeight: 500 }}>
                Esqueci minha senha
              </Link>
              <Link to="/cadastro" style={{ fontSize: '.85rem', color: '#666' }}>
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 40, color: '#fff', position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 400 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 24, lineHeight: 1.3 }}>
            O cardápio digital mais completo do Brasil
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📱', text: 'Cardápio online responsivo e bonito' },
              { icon: '🛒', text: 'Pedidos automáticos via WhatsApp' },
              { icon: '📊', text: 'Dashboard completo com métricas' },
              { icon: '💳', text: 'Pagamento online (PIX, cartão)' },
              { icon: '🤖', text: 'Chatbot IA para WhatsApp' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span style={{ opacity: .9, fontSize: '.95rem' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '2px solid #e0e0e0', fontSize: '.95rem', outline: 'none',
  transition: 'border-color .2s',
  boxSizing: 'border-box',
}
