import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, getCategories, api, uploadProductImage, type Product } from '../api/client'

interface Combo {
  id: string
  name: string
  description: string
  price: number
  image: string
  items: { productId: string; name: string; quantity: number }[]
  isAvailable: boolean
}

export default function CombosPanel() {
  const queryClient = useQueryClient()
  const { data: products } = useQuery<Product[]>({ queryKey: ['products'], queryFn: getProducts })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', image: '' })
  const [comboItems, setComboItems] = useState<{ productId: string; quantity: number }[]>([])
  const [uploading, setUploading] = useState(false)

  const combos: Combo[] = products?.filter((p: any) => p.ingredients?.some((i: any) => i.type === 'combo'))?.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    items: p.ingredients?.filter((i: any) => i.type === 'combo').map((i: any) => ({ productId: i.productId || '', name: i.name || '', quantity: i.quantity || 1 })) || [],
    isAvailable: p.isAvailable,
  })) || []

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/products', data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setShowForm(false); resetForm() },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/products/${id}`, data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setShowForm(false); setEditingId(null); resetForm() },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const resetForm = () => { setForm({ name: '', description: '', price: '', image: '' }); setComboItems([]); setEditingId(null) }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { imageUrl } = await uploadProductImage(file)
      setForm(f => ({ ...f, image: imageUrl }))
    } catch { alert('Erro ao enviar imagem') }
    setUploading(false)
  }

  const addItem = () => setComboItems(items => [...items, { productId: '', quantity: 1 }])
  const removeItem = (idx: number) => setComboItems(items => items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, value: any) => setComboItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const handleSave = () => {
    const ingredients = comboItems.map(item => ({ type: 'combo', productId: item.productId, name: products?.find(p => p.id === item.productId)?.name || '', quantity: item.quantity }))
    const data = { name: form.name, description: form.description, price: Number(form.price) || 0, image: form.image, ingredients, isAvailable: true, categoryId: categories?.[0]?.id }
    if (editingId) {
      updateMut.mutate({ id: editingId, ...data })
    } else {
      createMut.mutate(data)
    }
  }

  const handleEdit = (combo: Combo) => {
    setEditingId(combo.id)
    setForm({ name: combo.name, description: combo.description, price: String(combo.price), image: combo.image })
    setComboItems(combo.items.map(i => ({ productId: i.productId, quantity: i.quantity })))
    setShowForm(true)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }

  return (
    <div className="panel-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-md">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>🎁 Combos</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); resetForm() }}>
          {showForm ? 'Fechar' : '+ Novo Combo'}
        </button>
      </div>
      <p className="text-sm text-muted mb-md">Crie combos agregando vários produtos em uma venda única com preço especial.</p>

      {showForm && (
        <div className="dashboard-card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 className="font-semibold mb-sm">{editingId ? 'Editar combo' : 'Novo combo'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={inputStyle} placeholder="Nome do combo *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input style={inputStyle} type="number" step="0.10" placeholder="Preço do combo *" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div>
              <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Imagem do combo</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '.85rem' }} />
              {uploading && <p className="text-xs text-muted mt-xs">Enviando...</p>}
              {form.image && <img src={form.image} alt="Preview" style={{ width: 100, borderRadius: 8, marginTop: 8 }} />}
            </div>

            <div>
              <div className="flex justify-between items-center mb-sm">
                <label style={{ fontSize: '.85rem', fontWeight: 600 }}>Produtos no combo</label>
                <button className="btn btn-outline btn-sm" onClick={addItem}>+ Adicionar produto</button>
              </div>
              {comboItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <select style={{ ...inputStyle, flex: 1 }} value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
                    <option value="">Selecione o produto...</option>
                    {products?.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
                  </select>
                  <input style={{ width: 60, padding: '8px', borderRadius: 8, border: '1px solid #ddd', fontSize: '.85rem', textAlign: 'center' }} type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeItem(idx)}>✕</button>
                </div>
              ))}
              {comboItems.length === 0 && <p className="text-xs text-muted">Nenhum produto adicionado ao combo</p>}
            </div>

            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!form.name || !form.price}>{editingId ? 'Salvar' : 'Criar'}</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {combos.map(combo => (
          <div key={combo.id} className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
            {combo.image && <img src={combo.image} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />}
            <div style={{ flex: 1 }}>
              <span className="font-semibold">{combo.name}</span>
              <span className="text-sm text-muted ml-sm">R$ {combo.price.toFixed(2)}</span>
              {combo.items.length > 0 && <p className="text-xs text-muted mt-xs">{combo.items.length} produto(s)</p>}
            </div>
            <span className={`badge ${combo.isAvailable ? 'badge-success' : 'badge-warning'}`}>{combo.isAvailable ? 'Ativo' : 'Inativo'}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(combo)}>✏️</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteMut.mutate(combo.id)}>🗑️</button>
          </div>
        ))}
        {combos.length === 0 && <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>Nenhum combo criado</p>}
      </div>
    </div>
  )
}
