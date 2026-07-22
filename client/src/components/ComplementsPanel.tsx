import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllProducts, getComplementGroups, createComplementGroup, deleteComplementGroup, createComplement, deleteComplement } from '../api/client'
import type { Product } from '../api/client'

export default function ComplementsPanel() {
  const queryClient = useQueryClient()
  const { data: products } = useQuery({ queryKey: ['allProducts'], queryFn: getAllProducts })
  const { data: groups } = useQuery({ queryKey: ['allCompGroups'], queryFn: () => getComplementGroups() })

  const [selectedProduct, setSelectedProduct] = useState('')
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupForm, setGroupForm] = useState({ name: '', type: 'checkbox' as 'radio' | 'checkbox', min: 0, max: 0, isRequired: false })

  const createGroupMut = useMutation({
    mutationFn: createComplementGroup,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allCompGroups'] }); setShowGroupForm(false); setGroupForm({ name: '', type: 'checkbox', min: 0, max: 0, isRequired: false }) }
  })

  const deleteGroupMut = useMutation({
    mutationFn: deleteComplementGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allCompGroups'] })
  })

  const [addingItem, setAddingItem] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({ name: '', price: 0, maxExtra: 0 })
  const createItemMut = useMutation({
    mutationFn: createComplement,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allCompGroups'] }); setAddingItem(null); setItemForm({ name: '', price: 0, maxExtra: 0 }) }
  })
  const deleteItemMut = useMutation({
    mutationFn: deleteComplement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allCompGroups'] })
  })

  const handleCreateGroup = (productId: string) => {
    createGroupMut.mutate({ ...groupForm, productId })
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: '.82rem',
    outline: 'none', background: '#fff',
  }

  return (
    <div className="panel-fadeIn">
      <div className="flex justify-between items-center mb-md">
        <p className="font-semibold">🧩 Gerenciar Complementos</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select style={inputStyle} value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
            <option value="">Selecione um produto...</option>
            {products?.map((p: Product) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {selectedProduct && !showGroupForm && (
            <button className="btn btn-primary btn-sm" onClick={() => { setShowGroupForm(true); setGroupForm({ name: '', type: 'checkbox', min: 0, max: 0, isRequired: false }) }}>
              + Novo Grupo
            </button>
          )}
        </div>
      </div>

      {showGroupForm && selectedProduct && (
        <div className="dashboard-card mb-md" style={{ padding: 16 }}>
          <h4 className="font-semibold mb-sm">📦 Novo Grupo de Complementos</h4>
          <form onSubmit={e => { e.preventDefault(); handleCreateGroup(selectedProduct) }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
            <input style={inputStyle} placeholder="Nome do grupo *" required value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} />
            <select style={inputStyle} value={groupForm.type} onChange={e => setGroupForm(f => ({ ...f, type: e.target.value as 'radio' | 'checkbox' }))}>
              <option value="radio">Seleção única (1 opção)</option>
              <option value="checkbox">Múltipla escolha (várias)</option>
            </select>
            <label className="text-xs">Mín: <input type="number" style={{ ...inputStyle, width: 50 }} value={groupForm.min} onChange={e => setGroupForm(f => ({ ...f, min: Number(e.target.value) }))} /></label>
            <label className="text-xs">Máx: <input type="number" style={{ ...inputStyle, width: 50 }} value={groupForm.max} onChange={e => setGroupForm(f => ({ ...f, max: Number(e.target.value) }))} /></label>
            <label className="text-xs"><input type="checkbox" checked={groupForm.isRequired} onChange={e => setGroupForm(f => ({ ...f, isRequired: e.target.checked }))} /> Obrigatório</label>
            <button type="submit" className="btn btn-primary btn-sm" disabled={createGroupMut.isPending}>Criar</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowGroupForm(false)}>Cancelar</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups?.map((g: any) => (
          <div key={g.id} className="dashboard-card" style={{ padding: 16 }}>
            <div className="flex justify-between items-center mb-sm">
              <div>
                <span className="font-semibold">{g.name}</span>
                <span className="text-sm text-muted ml-sm">
                  ({g.type}) • {g.productName} • min {g.min} • máx {g.max} • {g.isRequired ? 'obrigatório' : 'opcional'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setAddingItem(g.id); setItemForm({ name: '', price: 0, maxExtra: 0 }) }}>+ Item</button>
                <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteGroupMut.mutate(g.id)}>🗑️</button>
              </div>
            </div>

            {addingItem === g.id && (
              <form onSubmit={e => { e.preventDefault(); createItemMut.mutate({ ...itemForm, groupId: g.id }) }} style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <input style={inputStyle} placeholder="Nome *" required value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
                <input style={{ ...inputStyle, width: 80 }} type="number" step="0.1" placeholder="Preço" value={itemForm.price || ''} onChange={e => setItemForm(f => ({ ...f, price: Number(e.target.value) }))} />
                <button type="submit" className="btn btn-primary btn-sm">Adicionar</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddingItem(null)}>Cancelar</button>
              </form>
            )}

            <div className="flex flex-wrap gap-sm">
              {g.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-sm" style={{ background: '#f8f9fa', borderRadius: 6, padding: '4px 10px', fontSize: '.82rem' }}>
                  <span>{item.name}</span>
                  {item.price > 0 && <span className="text-primary font-semibold">+R$ {item.price.toFixed(2)}</span>}
                  <button className="btn-ghost" style={{ color: 'var(--danger)', fontSize: '.75rem', padding: 0 }} onClick={() => deleteItemMut.mutate(item.id)}>✕</button>
                </div>
              ))}
              {(!g.items || g.items.length === 0) && <span className="text-xs text-muted">Nenhum item</span>}
            </div>
          </div>
        ))}
        {(!groups || groups.length === 0) && <p className="text-muted text-sm">Nenhum grupo de complementos</p>}
      </div>
    </div>
  )
}