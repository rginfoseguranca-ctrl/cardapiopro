import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export default function LoyaltyDashboard() {
  const [phone, setPhone] = useState('')
  const [searched, setSearched] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['customerLoyalty', searched],
    queryFn: async () => {
      const clean = searched.replace(/\D/g, '')
      const r = await api.get(`/customers/public/phone/${clean}/loyalty`)
      return r.data
    },
    enabled: !!searched,
  })

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(phone)
  }

  return (
    <div className="container" style={{ padding: '40px 16px', maxWidth: 600 }}>
      <Link to="/" style={{ color: 'var(--primary)', fontSize: '.9rem', textDecoration: 'none' }}>← Voltar ao Cardápio</Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 16, marginBottom: 8 }}>⭐ Minha Fidelidade</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 24, fontSize: '.9rem' }}>
        Consulte seus pontos, recompensas e cashback
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <input
          type="tel" placeholder="(11) 99999-8888" value={phone}
          onChange={e => setPhone(formatPhone(e.target.value))}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 8,
            border: '1px solid var(--border)', fontSize: '1rem', outline: 'none',
          }}
        />
        <button type="submit" className="btn btn-primary">Buscar</button>
      </form>

      {isLoading && <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>Carregando...</p>}

      {data && !data.points && !data.cashback && searched && !isLoading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <p style={{ marginTop: 8 }}>Nenhum registro encontrado para este telefone.</p>
          <p style={{ fontSize: '.8rem' }}>Faça um pedido para começar a acumular pontos!</p>
        </div>
      )}

      {data && (data.points > 0 || data.cashback > 0) && (
        <>
          {/* Cards de resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <div style={{
              background: 'linear-gradient(135deg, #f39c12, #e67e22)',
              color: '#fff', borderRadius: 12, padding: 20,
            }}>
              <p style={{ fontSize: '.8rem', opacity: .9 }}>Pontos</p>
              <p style={{ fontSize: '2rem', fontWeight: 900 }}>{data.points}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
              color: '#fff', borderRadius: 12, padding: 20,
            }}>
              <p style={{ fontSize: '.8rem', opacity: .9 }}>Cashback</p>
              <p style={{ fontSize: '2rem', fontWeight: 900 }}>R$ {data.cashback.toFixed(2)}</p>
            </div>
          </div>

          {/* Recompensas disponíveis */}
          {data.rewards && data.rewards.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>🎁 Recompensas Disponíveis</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.rewards.map((r: any) => (
                  <div key={r.id} style={{
                    padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: data.points >= r.points_required ? 1 : 0.5,
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '.9rem' }}>{r.name}</p>
                      {r.description && <p style={{ fontSize: '.8rem', color: 'var(--text-light)' }}>{r.description}</p>}
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '.75rem', fontWeight: 700,
                      background: data.points >= r.points_required ? 'var(--primary-light)' : 'var(--bg)',
                      color: data.points >= r.points_required ? 'var(--primary)' : 'var(--text-light)',
                    }}>
                      {r.points_required} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de pontos */}
          {data.history && data.history.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>📊 Histórico de Pontos</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.history.map((h: any) => (
                  <div key={h.id} style={{
                    padding: '10px 14px', borderRadius: 8, background: 'var(--bg)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ fontSize: '.85rem', fontWeight: 500 }}>{h.description}</p>
                      <p style={{ fontSize: '.75rem', color: 'var(--text-light)' }}>
                        {new Date(h.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: '.9rem',
                      color: h.points > 0 ? '#27ae60' : 'var(--primary)',
                    }}>
                      {h.points > 0 ? '+' : ''}{h.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de cashback */}
          {data.cashbackHistory && data.cashbackHistory.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>💰 Histórico de Cashback</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.cashbackHistory.map((c: any) => (
                  <div key={c.id} style={{
                    padding: '10px 14px', borderRadius: 8, background: 'var(--bg)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ fontSize: '.85rem', fontWeight: 500 }}>
                        {c.status === 'available' ? 'Disponível' : c.status === 'used' ? 'Utilizado' : 'Expirado'}
                      </p>
                      <p style={{ fontSize: '.75rem', color: 'var(--text-light)' }}>
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: '.9rem', color: '#27ae60',
                    }}>
                      +R$ {c.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
