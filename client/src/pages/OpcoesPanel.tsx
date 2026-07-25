import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getComplementGroups, type ComplementGroup, uploadProductImage } from '../api/client'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function apiRequest(method: string, path: string, body?: any) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export default function OpcoesPanel() {
  const queryClient = useQueryClient()
  const { data: groups } = useQuery<ComplementGroup[]>({ queryKey: ['complementGroups'], queryFn: () => getComplementGroups() })
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', description: '', imageUrl: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const options = groups?.find(g => g.id === selectedGroup)?.items || []

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/complements', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['complementGroups'] }); setShowForm(false); setForm({ name: '', price: '', description: '', imageUrl: '' }) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest('PUT', `/complements/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['complementGroups'] }); setShowForm(false); setEditingId(null); setForm({ name: '', price: '', description: '', imageUrl: '' }) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/complements/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complementGroups'] }),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { imageUrl } = await uploadProductImage(file)
      setForm(f => ({ ...f, imageUrl }))
    } catch { alert('Erro ao enviar imagem') }
    setUploading(false)
  }

  const handleSave = () => {
    if (!selectedGroup) return
    if (editingId) {
      updateMut.mutate({ id: editingId, name: form.name, price: Number(form.price) || 0, description: form.description, imageUrl: form.imageUrl })
    } else {
      createMut.mutate({ groupId: selectedGroup, name: form.name, price: Number(form.price) || 0 })
    }
  }

  const handleEdit = (opt: any) => {
    setEditingId(opt.id)
    setForm({ name: opt.name, price: String(opt.price || 0), description: opt.description || '', imageUrl: opt.imageUrl || '' })
    setShowForm(true)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }

  return (
    <div className="panel-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-md">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>⚙️ Opções</h2>
        {selectedGroup && (
          <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', price: '', description: '', imageUrl: '' }) }}>
            {showForm ? 'Fechar' : '+ Nova opção'}
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-md">Gerencie as opções utilizadas dentro dos complementos. Adicione imagens e descrições para cada opção.</p>

      <div className="mb-md">
        <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Selecione um grupo de complementos:</label>
        <select style={inputStyle} value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setShowForm(false); setEditingId(null) }}>
          <option value="">Selecione...</option>
          {groups?.map(g => <option key={g.id} value={g.id}>{g.name} ({g.items?.length || 0} opções)</option>)}
        </select>
      </div>

      {showForm && selectedGroup && (
        <div className="dashboard-card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 className="font-semibold mb-sm">{editingId ? 'Editar opção' : 'Nova opção'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={inputStyle} placeholder="Nome da opção *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input style={inputStyle} type="number" step="0.10" placeholder="Preço (0 = sem acréscimo)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <div>
              <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Imagem da opção</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '.85rem' }} />
              {uploading && <p className="text-xs text-muted mt-xs">Enviando...</p>}
              {form.imageUrl && <img src={form.imageUrl} alt="Preview" style={{ width: 100, borderRadius: 8, marginTop: 8 }} />}
            </div>
            <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Descrição da opção (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!form.name}>{editingId ? 'Salvar' : 'Criar'}</button>
          </div>
        </div>
      )}

      {selectedGroup && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((opt: any) => (
            <div key={opt.id} className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
              {opt.imageUrl && <img src={opt.imageUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />}
              <div style={{ flex: 1 }}>
                <span className="font-semibold">{opt.name}</span>
                {opt.price > 0 && <span className="text-sm text-muted ml-sm">+ R$ {Number(opt.price).toFixed(2)}</span>}
                {opt.description && <p className="text-xs text-muted mt-xs">{opt.description}</p>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(opt)}>✏️</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteMut.mutate(opt.id)}>🗑️</button>
            </div>
          ))}
          {options.length === 0 && <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>Nenhuma opção neste grupo</p>}
        </div>
      )}
      {!selectedGroup && <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>Selecione um grupo de complementos para ver as opções</p>}
    </div>
  )
}
