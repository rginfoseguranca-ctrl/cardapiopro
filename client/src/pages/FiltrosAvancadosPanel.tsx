import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllProducts, updateProduct, type Product } from '../api/client'

export default function FiltrosAvancadosPanel() {
  const queryClient = useQueryClient()
  const { data: products, isLoading } = useQuery<Product[]>({ queryKey: ['allProducts'], queryFn: getAllProducts })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [bulkAction, setBulkAction] = useState<'price' | 'available' | 'highlight' | null>(null)
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkValue, setBulkValue] = useState(true)

  const bulkMut = useMutation({
    mutationFn: async () => {
      for (const id of selected) {
        if (bulkAction === 'price' && bulkPrice) {
          await updateProduct(id, { price: Number(bulkPrice) })
        } else if (bulkAction === 'available') {
          await updateProduct(id, { isAvailable: bulkValue })
        } else if (bulkAction === 'highlight') {
          await updateProduct(id, { isHighlighted: bulkValue })
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allProducts'] }); setSelected(new Set()); setBulkAction(null) },
  })

  const filtered = products?.filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase())) || []

  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
    }
  }

  return (
    <div className="panel-fadeIn" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>🔍 Filtros Avançados</h2>
      <p className="text-sm text-muted mb-md">Selecione vários produtos ao mesmo tempo para aplicar edição em massa: alteração de preço, ativação/desativação, alteração de disponibilidade e mais.</p>

      <div className="flex items-center gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
        <input
          style={{ width: 250, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '.85rem' }}
          placeholder="🔍 Filtrar produtos..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <label style={{ fontSize: '.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
          Selecionar todos ({filtered.length})
        </label>
        {selected.size > 0 && <span className="badge badge-primary">{selected.size} selecionados</span>}
      </div>

      {selected.size > 0 && (
        <div className="dashboard-card" style={{ padding: 16, marginBottom: 16 }}>
          <p className="font-semibold mb-sm">Ação em massa:</p>
          <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
            <button className={`btn btn-sm ${bulkAction === 'price' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBulkAction(bulkAction === 'price' ? null : 'price')}>💰 Alterar Preço</button>
            <button className={`btn btn-sm ${bulkAction === 'available' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setBulkAction(bulkAction === 'available' ? null : 'available'); setBulkValue(true) }}>{bulkAction === 'available' && !bulkValue ? '❌' : '✅'} Disponibilidade</button>
            <button className={`btn btn-sm ${bulkAction === 'highlight' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setBulkAction(bulkAction === 'highlight' ? null : 'highlight'); setBulkValue(true) }}>⭐ Destaque</button>
          </div>
          {bulkAction === 'price' && (
            <div className="flex items-center gap-sm mt-sm">
              <input style={{ width: 120, padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: '.85rem' }} type="number" step="0.10" placeholder="Novo preço" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={() => bulkMut.mutate()} disabled={!bulkPrice}>Aplicar</button>
            </div>
          )}
          {bulkAction === 'available' && (
            <div className="flex items-center gap-sm mt-sm">
              <select style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: '.85rem' }} value={bulkValue ? 'true' : 'false'} onChange={e => setBulkValue(e.target.value === 'true')}>
                <option value="true">Disponível</option>
                <option value="false">Indisponível</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => bulkMut.mutate()}>Aplicar</button>
            </div>
          )}
          {bulkAction === 'highlight' && (
            <div className="flex items-center gap-sm mt-sm">
              <select style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: '.85rem' }} value={bulkValue ? 'true' : 'false'} onChange={e => setBulkValue(e.target.value === 'true')}>
                <option value="true">Destacar</option>
                <option value="false">Remover destaque</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => bulkMut.mutate()}>Aplicar</button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(p => (
          <div key={p.id} className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
            {p.image && <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />}
            <div style={{ flex: 1 }}>
              <span className="font-semibold text-sm">{p.name}</span>
              <span className="text-xs text-muted ml-sm">R$ {p.price.toFixed(2)}</span>
              {p.pricePromotional && <span className="text-xs text-success ml-sm">R$ {p.pricePromotional.toFixed(2)}</span>}
            </div>
            <span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-danger'}`}>{p.isAvailable ? 'Ativo' : 'Inativo'}</span>
            {p.isHighlighted && <span className="badge badge-warning">⭐ Destaque</span>}
          </div>
        ))}
        {filtered.length === 0 && !isLoading && <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>Nenhum produto encontrado</p>}
        {isLoading && <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>Carregando produtos...</p>}
      </div>
    </div>
  )
}
