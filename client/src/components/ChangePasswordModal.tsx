import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'

export default function ChangePasswordModal() {
  const { mustChangePassword, setMustChangePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!mustChangePassword) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPass.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (newPass !== confirm) { setError('As senhas não conferem'); return }
    setLoading(true)
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: newPass })
      setMustChangePassword(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }}>
      <div className="card" style={{ padding: 32, width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 48 }}>🔑</span>
          <h2 style={{ fontSize: '1.2rem', marginTop: 8 }}>Alterar Senha</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '.85rem', marginTop: 4 }}>
            Por segurança, altere sua senha padrão antes de continuar.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="password" placeholder="Senha atual" required
            style={inputStyle} value={current}
            onChange={e => setCurrent(e.target.value)}
          />
          <input
            type="password" placeholder="Nova senha (mínimo 6 caracteres)" required
            style={inputStyle} value={newPass}
            onChange={e => setNewPass(e.target.value)}
          />
          <input
            type="password" placeholder="Confirmar nova senha" required
            style={inputStyle} value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
          {error && <p style={{ color: 'var(--primary)', fontSize: '.85rem', textAlign: 'center' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: 8,
  border: '1px solid var(--border)', fontSize: '1rem', outline: 'none',
}
