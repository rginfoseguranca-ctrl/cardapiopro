import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não coincidem'); return }
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 400, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 12 }}>Link inválido</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>O link de redefinição de senha é inválido.</p>
          <Link to="/esqueci-senha" className="btn btn-primary">Solicitar novo link</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
          <h2 style={{ marginBottom: 8 }}>Senha redefinida!</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>Agora você pode acessar com sua nova senha.</p>
          <Link to="/login" className="btn btn-primary">Ir para o Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, textAlign: 'center', marginBottom: 20 }}>Redefinir Senha</h1>
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: '.85rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="password" required placeholder="Nova senha (mín. 8 caracteres)" value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '.9rem', outline: 'none', marginBottom: 12 }} />
          <input type="password" required placeholder="Confirmar nova senha" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '.9rem', outline: 'none', marginBottom: 12 }} />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
