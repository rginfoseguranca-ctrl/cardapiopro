import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDrivers, createDriver, deleteDriver, getDriverPerformance, getDeliveryRoutes, updateDriverDeliveryStatus } from '../api/client'

export default function DriversPanel() {
  const [tab, setTab] = useState('drivers')

  return (
    <div className="panel-fadeIn">
      <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
        {[
          { key: 'drivers', label: '🚚 Entregadores' },
          { key: 'deliveries', label: '📦 Entregas' },
          { key: 'performance', label: '📊 Desempenho' },
        ].map(t => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {tab === 'drivers' && <DriversList />}
      {tab === 'deliveries' && <DeliveriesList />}
      {tab === 'performance' && <PerformanceView />}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: '.82rem',
  outline: 'none', background: '#fff',
}

function DriversList() {
  const queryClient = useQueryClient()
  const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: getDrivers })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', vehicle: '', plate: '', pixKey: '', notes: '' })
  const createMut = useMutation({
    mutationFn: createDriver,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); setShowForm(false); setForm({ name: '', phone: '', email: '', vehicle: '', plate: '', pixKey: '', notes: '' }) }
  })
  const deleteMut = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] })
  })

  return (
    <div>
      <button className="btn btn-primary btn-sm mb-md" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Novo Entregador'}</button>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Nome *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input style={inputStyle} placeholder="Telefone *" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <input style={inputStyle} placeholder="E-mail" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input style={inputStyle} placeholder="Veículo" value={form.vehicle} onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))} />
          <input style={{ ...inputStyle, width: 80 }} placeholder="Placa" value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} />
          <input style={inputStyle} placeholder="Chave PIX" value={form.pixKey} onChange={e => setForm(f => ({ ...f, pixKey: e.target.value }))} />
          <button type="submit" className="btn btn-primary btn-sm">Adicionar</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {drivers?.map(d => (
          <div key={d.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <div className="flex-1">
              <span className="font-semibold">{d.name}</span>
              <span className="text-sm text-muted ml-sm">
                📞 {d.phone} {d.vehicle && `• 🚗 ${d.vehicle} ${d.plate ? `(${d.plate})` : ''}`}
              </span>
              <span className={`badge ml-sm ${d.status === 'available' ? 'badge-success' : d.status === 'busy' ? 'badge-warning' : 'badge-danger'}`}>
                {d.status === 'available' ? 'Disponível' : d.status === 'busy' ? 'Em entrega' : 'Offline'}
              </span>
              <span className="text-xs text-muted ml-sm">📦 {d.total_deliveries} entregas</span>
            </div>
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteMut.mutate(d.id)}>🗑️</button>
          </div>
        ))}
        {(!drivers || drivers.length === 0) && <p className="text-muted text-sm">Nenhum entregador cadastrado</p>}
      </div>
    </div>
  )
}

function DeliveriesList() {
  const queryClient = useQueryClient()
  const { data: routes } = useQuery({ queryKey: ['deliveryRoutes'], queryFn: getDeliveryRoutes })
  const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: getDrivers })
  const [filter, setFilter] = useState('all')
  const updateMut = useMutation({
    mutationFn: ({ id, status, driver }: { id: string; status: string; driver?: string }) => updateDriverDeliveryStatus(id, status, driver),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveryRoutes'] })
  })

  const filtered = filter === 'all' ? routes : routes?.filter((r: any) => r.status === filter)

  return (
    <div>
      <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
        {['all', 'pending', 'in_progress', 'delivered'].map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setFilter(s)}>
            {s === 'all' ? '📋 Todas' : s === 'in_progress' ? '🔵 Em andamento' : s === 'delivered' ? '✅ Entregues' : '⏳ Pendentes'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered?.map((r: any) => (
          <div key={r.id} className="dashboard-card" style={{ padding: 14 }}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-sm">{r.address}</p>
                <p className="text-xs text-muted">{r.customer_name} • {r.customer_phone}</p>
                {r.driver && <p className="text-xs text-muted">🚚 {r.driver}</p>}
                {r.distance > 0 && <p className="text-xs text-muted">📏 {r.distance}km</p>}
              </div>
              <div className="flex items-center gap-sm">
                <span className={`badge ${r.status === 'delivered' ? 'badge-success' : r.status === 'in_progress' ? 'badge-info' : 'badge-warning'}`}>
                  {r.status === 'pending' ? 'Pendente' : r.status === 'in_progress' ? 'Em andamento' : 'Entregue'}
                </span>
                {r.status !== 'delivered' && (
                  <>
                    {!r.driver && drivers && (
                      <select style={inputStyle} onChange={e => e.target.value && updateMut.mutate({ id: r.id, status: 'in_progress', driver: e.target.value })}>
                        <option value="">Atribuir...</option>
                        {drivers.filter((d: any) => d.status === 'available').map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => updateMut.mutate({ id: r.id, status: r.status === 'pending' ? 'in_progress' : 'delivered' })}>
                      {r.status === 'pending' ? '🔵 Iniciar' : '✅ Entregue'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {(!filtered || filtered.length === 0) && <p className="text-muted text-sm">Nenhuma entrega</p>}
      </div>
    </div>
  )
}

function PerformanceView() {
  const { data: perf } = useQuery({ queryKey: ['driverPerformance'], queryFn: getDriverPerformance })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        {perf?.map((d: any) => (
          <div key={d.id} className="dashboard-card" style={{ padding: 16 }}>
            <div className="flex justify-between items-center mb-sm">
              <span className="font-semibold">{d.name}</span>
              <span className={`badge ${d.status === 'available' ? 'badge-success' : 'badge-warning'}`}>{d.status}</span>
            </div>
            <div className="text-sm">
              <div className="flex justify-between"><span className="text-muted">Entregas:</span><span>{d.stats?.total || 0}</span></div>
              <div className="flex justify-between"><span className="text-muted">Taxas recebidas:</span><span>R$ {Number(d.stats?.total_fee || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Distância média:</span><span>{Number(d.stats?.avg_distance || 0).toFixed(1)} km</span></div>
              <div className="flex justify-between"><span className="text-muted">Total entregas:</span><span>{d.total_deliveries}</span></div>
              <div className="flex justify-between"><span className="text-muted">Veículo:</span><span>{d.vehicle || '-'} {d.plate ? `(${d.plate})` : ''}</span></div>
            </div>
          </div>
        ))}
        {(!perf || perf.length === 0) && <p className="text-muted text-sm">Nenhum entregador cadastrado</p>}
      </div>
    </div>
  )
}