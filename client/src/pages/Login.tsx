import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'

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
      const { data } = await api.post('/auth/login', { email, password })
      login(data.token, data.user, data.mustChangePassword)
      navigate('/dashboard')
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ padding: 32, width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: '2.5rem' }}>🔐</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 8 }}>Acesso Administrativo</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email" placeholder="Email" required
            style={inputStyle}
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password" placeholder="Senha" required
            style={inputStyle}
            value={password} onChange={e => setPassword(e.target.value)}
          />
          {error && <p style={{ color: 'var(--primary)', fontSize: '.85rem', textAlign: 'center' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/')} style={{ width: '100%' }}>
            ← Voltar ao Cardápio
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)',
  fontSize: '1rem', outline: 'none',
}
