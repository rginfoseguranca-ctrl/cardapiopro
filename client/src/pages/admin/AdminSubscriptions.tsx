import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSAASSubscriptions, type SAASSubscription } from '../../api/client'

const statusBadge = (status: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: 'rgba(0,184,148,.1)', color: '#00b894', label: 'Ativa' },
    trialing: { bg: 'rgba(253,203,110,.15)', color: '#e17055', label: 'Trial' },
    canceled: { bg: 'rgba(214,48,49,.1)', color: '#d63031', label: 'Cancelada' },
    past_due: { bg: 'rgba(214,48,49,.1)', color: '#d63031', label: 'Atrasada' },
  }
  const s = map[status] || { bg: 'rgba(99,110,114,.1)', color: '#636e72', label: status }
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: '.72rem',
    fontWeight: 700,
    background: s.bg,
    color: s.color,
  }
}

const planBadge = (plan: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    pro: { bg: 'rgba(108,92,231,.1)', color: '#6c5ce7' },
    enterprise: { bg: 'rgba(0,206,209,.1)', color: '#00cec9' },
    free: { bg: 'rgba(99,110,114,.1)', color: '#636e72' },
  }
  const p = map[plan] || map.free
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: '.72rem',
    fontWeight: 700,
    background: p.bg,
    color: p.color,
  }
}

export default function AdminSubscriptions() {
  const [filter, setFilter] = useState('all')

  const { data: subs = [], isLoading } = useQuery<SAASSubscription[]>({
    queryKey: ['saasSubscriptions'],
    queryFn: getSAASSubscriptions,
  })

  const filtered = filter === 'all' ? subs : subs.filter((s) => s.status === filter)

  if (isLoading)
    return <p style={{ color: '#666', padding: 40 }}>Carregando assinaturas...</p>

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h2
          style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}
        >
          Assinaturas ({filtered.length})
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: 'Todas' },
            { key: 'active', label: 'Ativas' },
            { key: 'trialing', label: 'Trial' },
            { key: 'canceled', label: 'Canceladas' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: 'none',
                fontSize: '.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: filter === f.key ? '#6c5ce7' : '#f0f0f0',
                color: filter === f.key ? '#fff' : '#666',
                transition: 'all .15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>
              {['Loja', 'Plano', 'Status', 'Início do Trial', 'Fim do Período', 'Criada em'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      fontSize: '.72rem',
                      fontWeight: 700,
                      color: '#999',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '.5px',
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '.85rem',
                  }}
                >
                  Nenhuma assinatura encontrada
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <tr
                  key={sub.id}
                  style={{ borderBottom: '1px solid #f8f8f8' }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: '.85rem',
                          color: '#1a1a2e',
                        }}
                      >
                        {sub.store_name || 'Loja'}
                      </p>
                      <p style={{ margin: 0, fontSize: '.72rem', color: '#999' }}>
                        /{sub.store_slug}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={planBadge(sub.plan)}>
                      {(sub.plan || 'free').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={statusBadge(sub.status)}>
                      {sub.status === 'active'
                        ? 'Ativa'
                        : sub.status === 'trialing'
                          ? 'Trial'
                          : sub.status === 'canceled'
                            ? 'Cancelada'
                            : sub.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '.82rem',
                      color: '#555',
                    }}
                  >
                    {sub.trial_ends_at
                      ? new Date(sub.trial_ends_at).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '.82rem',
                      color: '#555',
                    }}
                  >
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '.82rem',
                      color: '#999',
                    }}
                  >
                    {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
