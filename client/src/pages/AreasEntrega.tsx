import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

interface DeliveryArea {
  id: string
  name: string
  baseFee: number
  freeDeliveryFrom: number
  radius: number
  active: boolean
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, sans-serif', background: '#f5f5f5', minHeight: '100vh' },
  title: { fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  formRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const, alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6, flex: '1 1 180px' },
  label: { fontSize: 13, fontWeight: 600, color: '#555' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border .2s' },
  btn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' as const, borderBottom: '1px solid #eee' },
  td: { padding: '12px', fontSize: 14, color: '#333', borderBottom: '1px solid #f0f0f0' },
  badge: { padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  badgeActive: { background: '#dcfce7', color: '#16a34a' },
  badgeInactive: { background: '#fee2e2', color: '#dc2626' },
}

export default function AreasEntrega() {
  const queryClient = useQueryClient()
  const { data: areas = [], isLoading } = useQuery<DeliveryArea[]>({
    queryKey: ['deliveryAreas'],
    queryFn: async () => { const { data } = await api.get('/delivery-areas'); return data },
  })

  const [name, setName] = useState('')
  const [baseFee, setBaseFee] = useState('')
  const [freeFrom, setFreeFrom] = useState('')
  const [radius, setRadius] = useState('')

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/delivery-areas', data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deliveryAreas'] }); setName(''); setBaseFee(''); setFreeFrom(''); setRadius('') },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.put(`/delivery-areas/${id}`, { active }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveryAreas'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/delivery-areas/${id}`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveryAreas'] }),
  })

  const handleAdd = () => {
    if (!name) return
    createMut.mutate({ name, baseFee: parseFloat(baseFee) || 0, freeDeliveryFrom: parseFloat(freeFrom) || 0, radius: parseFloat(radius) || 0 })
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Áreas de Entrega</h1>

      <div style={styles.card}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Nova Área</h3>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Nome</label>
            <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Centro" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Taxa Base (R$)</label>
            <input style={styles.input} type="number" step="0.50" value={baseFee} onChange={e => setBaseFee(e.target.value)} placeholder="0.00" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Entrega Grátis Acima de (R$)</label>
            <input style={styles.input} type="number" step="1" value={freeFrom} onChange={e => setFreeFrom(e.target.value)} placeholder="0.00" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Raio (km)</label>
            <input style={styles.input} type="number" step="0.5" value={radius} onChange={e => setRadius(e.target.value)} placeholder="0" />
          </div>
          <button style={styles.btn} onClick={handleAdd} disabled={createMut.isPending || !name}>{createMut.isPending ? 'Salvando...' : 'Adicionar'}</button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Áreas Configuradas</h3>
        {isLoading ? <p style={{ color: '#888', fontSize: 14 }}>Carregando...</p> : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Área</th>
                <th style={styles.th}>Taxa Base</th>
                <th style={styles.th}>Entrega Grátis Acima de</th>
                <th style={styles.th}>Raio</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {areas.map(area => (
                <tr key={area.id}>
                  <td style={styles.td}>{area.name}</td>
                  <td style={styles.td}>R$ {area.baseFee.toFixed(2)}</td>
                  <td style={styles.td}>R$ {area.freeDeliveryFrom.toFixed(2)}</td>
                  <td style={styles.td}>{area.radius} km</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(area.active ? styles.badgeActive : styles.badgeInactive) }}>
                      {area.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' }}
                        onClick={() => toggleMut.mutate({ id: area.id, active: !area.active })}
                      >
                        {area.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#dc2626' }}
                        onClick={() => { if (confirm(`Remover área "${area.name}"?`)) deleteMut.mutate(area.id) }}
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {areas.length === 0 && (
                <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#888', padding: 40 }}>Nenhuma área de entrega configurada</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
