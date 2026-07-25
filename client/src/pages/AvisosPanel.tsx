import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoreSettings, updateStoreSettings, uploadProductImage, type StoreSettings } from '../api/client'

interface Aviso {
  id: string
  title: string
  description: string
  imageUrl: string
  active: boolean
}

export default function AvisosPanel() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery<StoreSettings>({ queryKey: ['storeSettings'], queryFn: getStoreSettings })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '' })
  const [uploading, setUploading] = useState(false)

  const avisos: Aviso[] = (settings as any)?.avisos || []

  const updateMut = useMutation({
    mutationFn: (data: Partial<StoreSettings>) => updateStoreSettings(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['storeSettings'] }); setShowForm(false); setEditingId(null); setForm({ title: '', description: '', imageUrl: '' }) },
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
    const avisosList = [...avisos]
    if (editingId) {
      const idx = avisosList.findIndex(a => a.id === editingId)
      if (idx >= 0) avisosList[idx] = { ...avisosList[idx], ...form }
    } else {
      avisosList.push({ id: Date.now().toString(), ...form, active: true })
    }
    updateMut.mutate({ avisos: avisosList } as any)
  }

  const handleEdit = (aviso: Aviso) => {
    setEditingId(aviso.id)
    setForm({ title: aviso.title, description: aviso.description, imageUrl: aviso.imageUrl })
    setShowForm(true)
  }

  const handleToggle = (id: string) => {
    const avisosList = avisos.map(a => a.id === id ? { ...a, active: !a.active } : a)
    updateMut.mutate({ avisos: avisosList } as any)
  }

  const handleDelete = (id: string) => {
    const avisosList = avisos.filter(a => a.id !== id)
    updateMut.mutate({ avisos: avisosList } as any)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }

  return (
    <div className="panel-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-md">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📢 Avisos</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', imageUrl: '' }) }}>
          {showForm ? 'Fechar' : '+ Adicionar aviso'}
        </button>
      </div>
      <p className="text-sm text-muted mb-md">Crie avisos visíveis para seus clientes no cardápio digital.</p>

      {showForm && (
        <div className="dashboard-card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 className="font-semibold mb-sm">{editingId ? 'Editar aviso' : 'Novo aviso'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Imagem (720x450 recomendado) *</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '.85rem' }} />
              {uploading && <p className="text-xs text-muted mt-xs">Enviando...</p>}
              {form.imageUrl && <img src={form.imageUrl} alt="Preview" style={{ width: 200, borderRadius: 8, marginTop: 8, objectFit: 'cover', height: 120 }} />}
            </div>
            <input style={inputStyle} placeholder="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="Descrição do aviso..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!form.title || !form.imageUrl}>{editingId ? 'Salvar' : 'Criar'}</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {avisos.map((aviso: Aviso) => (
          <div key={aviso.id} className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
            {aviso.imageUrl && <img src={aviso.imageUrl} alt="" style={{ width: 80, height: 50, borderRadius: 6, objectFit: 'cover' }} />}
            <div style={{ flex: 1 }}>
              <span className="font-semibold">{aviso.title}</span>
              {aviso.description && <p className="text-xs text-muted mt-xs">{aviso.description.slice(0, 80)}...</p>}
            </div>
            <span className={`badge ${aviso.active ? 'badge-success' : 'badge-warning'}`}>{aviso.active ? 'Ativo' : 'Inativo'}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(aviso.id)}>{aviso.active ? '🙈 Ocultar' : '👁️ Mostrar'}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(aviso)}>✏️</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(aviso.id)}>🗑️</button>
          </div>
        ))}
        {avisos.length === 0 && <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>Nenhum aviso criado</p>}
      </div>
    </div>
  )
}
