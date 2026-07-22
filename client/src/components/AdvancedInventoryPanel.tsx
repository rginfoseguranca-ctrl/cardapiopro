import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupplies, createSupply, deleteSupply, supplyMovement, getRecipes, createRecipeItem, deleteRecipeItem, getCostAnalysis, getAllProducts } from '../api/client'

export default function AdvancedInventoryPanel() {
  const [tab, setTab] = useState('supplies')

  return (
    <div className="panel-fadeIn">
      <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
        {[
          { key: 'supplies', label: '📦 Insumos' },
          { key: 'recipes', label: '📋 Fichas Técnicas' },
          { key: 'costs', label: '💰 Análise de Custo' },
        ].map(t => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {tab === 'supplies' && <SuppliesTab />}
      {tab === 'recipes' && <RecipesTab />}
      {tab === 'costs' && <CostsTab />}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: '.82rem',
  outline: 'none', background: '#fff',
}

function SuppliesTab() {
  const queryClient = useQueryClient()
  const { data: supplies } = useQuery({ queryKey: ['supplies'], queryFn: getSupplies })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', unit: 'un', cost: 0, quantity: 0, minQuantity: 0 })
  const createMut = useMutation({
    mutationFn: createSupply,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['supplies'] }); setShowForm(false); setForm({ name: '', unit: 'un', cost: 0, quantity: 0, minQuantity: 0 }) }
  })
  const deleteMut = useMutation({
    mutationFn: deleteSupply,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplies'] })
  })
  const movMut = useMutation({
    mutationFn: ({ id, type, quantity }: { id: string; type: 'in' | 'out'; quantity: number }) => supplyMovement(id, type, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplies'] })
  })
  const [movForm, setMovForm] = useState<{ id: string; type: string; qty: string }>({ id: '', type: 'in', qty: '' })

  return (
    <div>
      <button className="btn btn-primary btn-sm mb-md" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Novo Insumo'}</button>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Nome *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <select style={inputStyle} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            <option value="un">un</option><option value="kg">kg</option><option value="g">g</option><option value="l">L</option><option value="ml">ml</option><option value="pac">pacote</option>
          </select>
          <input style={{ ...inputStyle, width: 80 }} type="number" step="0.01" placeholder="Custo" value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
          <input style={{ ...inputStyle, width: 70 }} type="number" placeholder="Qtd" value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
          <input style={{ ...inputStyle, width: 70 }} type="number" placeholder="Mín" value={form.minQuantity || ''} onChange={e => setForm(f => ({ ...f, minQuantity: Number(e.target.value) }))} />
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {supplies?.map(s => (
          <div key={s.id} className="dashboard-card" style={{ padding: 14 }}>
            <div className="flex justify-between items-center mb-sm">
              <div>
                <span className="font-semibold">{s.name}</span>
                <span className="text-sm text-muted ml-sm">{s.quantity} {s.unit} • Custo: R$ {Number(s.cost).toFixed(2)}/{s.unit}</span>
                {Number(s.quantity) <= Number(s.min_quantity) && <span className="badge badge-danger ml-sm">Estoque baixo</span>}
              </div>
              <div className="flex items-center gap-sm">
                <input style={{ ...inputStyle, width: 60 }} type="number" placeholder="Qtd" value={movForm.id === s.id ? movForm.qty : ''} onChange={e => setMovForm({ id: s.id, type: movForm.type, qty: e.target.value })} />
                <select style={inputStyle} value={movForm.id === s.id ? movForm.type : 'in'} onChange={e => setMovForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="in">+</option><option value="out">-</option>
                </select>
                <button className="btn btn-outline btn-xs" onClick={() => movForm.qty && movMut.mutate({ id: s.id, type: movForm.type as 'in' | 'out', quantity: Number(movForm.qty) })}>Ok</button>
                <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteMut.mutate(s.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
        {(!supplies || supplies.length === 0) && <p className="text-muted text-sm">Nenhum insumo</p>}
      </div>
    </div>
  )
}

function RecipesTab() {
  const queryClient = useQueryClient()
  const { data: products } = useQuery({ queryKey: ['allProducts'], queryFn: getAllProducts })
  const { data: supplies } = useQuery({ queryKey: ['supplies'], queryFn: getSupplies })
  const { data: recipes } = useQuery({ queryKey: ['recipes'], queryFn: getRecipes })
  const [selectedProduct, setSelectedProduct] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ supplyId: '', quantity: 0 })
  const createMut = useMutation({
    mutationFn: createRecipeItem,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recipes'] }); setShowForm(false); setForm({ supplyId: '', quantity: 0 }) }
  })
  const deleteMut = useMutation({
    mutationFn: deleteRecipeItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] })
  })

  const filteredRecipes = selectedProduct ? recipes?.filter((r: any) => r.product_id === selectedProduct) : recipes

  return (
    <div>
      <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
        <select style={inputStyle} value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
          <option value="">Todos os produtos</option>
          {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {selectedProduct && !showForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Insumo</button>
        )}
      </div>

      {showForm && selectedProduct && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate({ productId: selectedProduct, supplyId: form.supplyId, quantity: form.quantity }) }} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <select style={inputStyle} value={form.supplyId} onChange={e => setForm(f => ({ ...f, supplyId: e.target.value }))} required>
            <option value="">Insumo *</option>
            {supplies?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
          </select>
          <input style={{ ...inputStyle, width: 80 }} type="number" step="0.01" placeholder="Qtd" required value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
          <button type="submit" className="btn btn-primary btn-sm">Adicionar</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredRecipes?.map((r: any) => (
          <div key={r.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, fontSize: '.85rem' }}>
            <div>
              <span className="font-semibold">{r.product_name}</span>
              <span className="text-muted ml-sm">
                → {r.supply_name} {r.quantity} {r.supply_unit} (R$ {Number(r.supply_cost).toFixed(2)}/{r.supply_unit})
              </span>
              <span className="text-xs text-muted ml-sm">= R$ {(r.quantity * r.supply_cost).toFixed(2)}</span>
            </div>
            <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteMut.mutate(r.id)}>✕</button>
          </div>
        ))}
        {(!filteredRecipes || filteredRecipes.length === 0) && <p className="text-muted text-sm">Nenhum item na ficha técnica</p>}
      </div>
    </div>
  )
}

function CostsTab() {
  const { data: costs } = useQuery({ queryKey: ['costAnalysis'], queryFn: getCostAnalysis })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {costs?.map((c: any) => {
          const marginColor = c.margin >= 50 ? 'var(--success)' : c.margin >= 30 ? 'var(--warning)' : 'var(--danger)'
          return (
            <div key={c.id} className="dashboard-card" style={{ padding: 16 }}>
              <div className="flex justify-between items-center mb-sm">
                <span className="font-semibold">{c.name}</span>
                <span style={{ color: marginColor, fontWeight: 700 }}>{c.margin}%</span>
              </div>
              <div className="text-sm">
                <div className="flex justify-between"><span className="text-muted">Preço venda:</span><span>R$ {Number(c.price).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Custo total:</span><span>R$ {Number(c.cost).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Lucro:</span><span>R$ {(Number(c.price) - Number(c.cost)).toFixed(2)}</span></div>
              </div>
            </div>
          )
        })}
        {(!costs || costs.length === 0) && <p className="text-muted text-sm">Nenhum dado. Cadastre insumos e fichas técnicas primeiro.</p>}
      </div>
    </div>
  )
}