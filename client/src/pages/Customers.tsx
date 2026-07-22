import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCustomers } from '../api/client'

export default function Customers() {
  const [search, setSearch] = useState('')
  const { data: customers } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => getCustomers(search),
  })

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>👥 Clientes</h1>
        <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
      </div>

      <input
        placeholder="Buscar por nome ou telefone..."
        style={{
          width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)',
          fontSize: '1rem', marginBottom: 16, outline: 'none'
        }}
        value={search} onChange={e => setSearch(e.target.value)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {customers?.map(c => (
          <Link key={c.id} to={`/customers/${c.id}`} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600 }}>{c.name}</p>
              <p style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>{c.phone} {c.email ? `• ${c.email}` : ''}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 700, fontSize: '.9rem' }}>{c.total_orders} pedidos</p>
              <p style={{ fontSize: '.85rem', color: 'var(--success)', fontWeight: 600 }}>R$ {Number(c.total_spent).toFixed(2)}</p>
            </div>
          </Link>
        ))}
        {customers?.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40 }}>Nenhum cliente encontrado</p>
        )}
      </div>
    </div>
  )
}
