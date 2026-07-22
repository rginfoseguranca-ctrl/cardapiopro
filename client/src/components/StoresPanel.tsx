import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStores, createStore, deleteStore, getAllStoresSummary } from '../api/client'

export default function StoresPanel() {
  const queryClient = useQueryClient()
  const { data: stores } = useQuery({ queryKey: ['stores'], queryFn: getStores })
  const { data: summary } = useQuery({ queryKey: ['storesSummary'], queryFn: getAllStoresSummary })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', phone: '', address: '' })
  const createMut = useMutation({
    mutationFn: createStore,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stores'] }); setShowForm(false); setForm({ name: '', slug: '', phone: '', address: '' }) }
  })
  const deleteMut = useMutation({
    mutationFn: deleteStore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] })
  })

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: '.82rem',
    outline: 'none', background: '#fff',
  }

  return (
    <div className="panel-fadeIn">
      {summary && summary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {summary.map((s: any) => (
            <div key={s.id} className="dashboard-card" style={{ textAlign: 'center', padding: 16 }}>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-muted">{s.todayOrders} pedidos hoje</p>
              <p className="font-bold" style={{ color: 'var(--primary)' }}>R$ {Number(s.todayRevenue).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-sm mb-md" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Nova Loja'}</button>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Nome *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input style={inputStyle} placeholder="Slug *" required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))} />
          <input style={inputStyle} placeholder="Telefone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <input style={inputStyle} placeholder="Endereço" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stores?.map(s => (
          <div key={s.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <div>
              <span className="font-semibold">{s.name}</span>
              <span className="text-sm text-muted ml-sm">/{s.slug} • {s.phone} {s.address ? `• ${s.address}` : ''}</span>
              {s.isActive ? <span className="badge badge-success ml-sm">Ativa</span> : <span className="badge badge-danger ml-sm">Inativa</span>}
            </div>
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteMut.mutate(s.id)}>🗑️</button>
          </div>
        ))}
        {(!stores || stores.length === 0) && <p className="text-muted text-sm">Nenhuma loja cadastrada</p>}
      </div>
    </div>
  )
}