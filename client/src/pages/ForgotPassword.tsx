import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📧</div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Email enviado!</h2>
          <p style={{ color: '#666', fontSize: '.9rem', marginBottom: 20 }}>
            Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
          <Link to="/login" className="btn btn-primary">Voltar ao Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Esqueceu a senha?</h1>
        <p style={{ color: '#666', fontSize: '.85rem', textAlign: 'center', marginBottom: 20 }}>
          Informe seu email para receber o link de recuperação.
        </p>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: '.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email" required placeholder="seu@email.com" value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '.9rem', outline: 'none', marginBottom: 12 }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login" style={{ color: '#e74c3c', textDecoration: 'none', fontSize: '.85rem' }}>← Voltar ao Login</Link>
        </div>
      </div>
    </div>
  )
}
