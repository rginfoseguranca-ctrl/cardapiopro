import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ storeName: '', name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    if (form.password.length < 8) {
      setError('Senha deve ter no mínimo 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: form.storeName,
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar')

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/admin')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#333' }}>🍽️ CardápioPro</h1>
          <p style={{ color: '#666', fontSize: '.9rem' }}>Crie sua conta gratuita</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Nome do Restaurante</label>
            <input
              type="text" required placeholder="Ex: Lanchonete do Zé"
              value={form.storeName} onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '.9rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Seu Nome</label>
            <input
              type="text" required placeholder="Nome completo"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '.9rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Email</label>
            <input
              type="email" required placeholder="seu@email.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '.9rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Senha</label>
            <input
              type="password" required placeholder="Mínimo 8 caracteres"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '.9rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Confirmar Senha</label>
            <input
              type="password" required placeholder="Repita a senha"
              value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '.9rem', outline: 'none' }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginTop: 8 }}
          >
            {loading ? 'Criando conta...' : 'Criar Conta Gratuita'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '.8rem', color: '#888', marginTop: 4 }}>
            Trial gratuito de 14 dias. Sem cartão de crédito.
          </p>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #eee' }}>
          <Link to="/login" style={{ color: '#e74c3c', textDecoration: 'none', fontSize: '.85rem' }}>
            Já tem conta? Entrar
          </Link>
        </div>
      </div>
    </div>
  )
}
