import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProducts, getCategories, getHighlightedProducts, getStoreSettings, getAllComplementGroups } from '../api/client'
import ProductCard from './ProductCard'
import ProductDetailModal from './ProductDetailModal'
import { LoadingScreen } from './Loading'
import ErrorState from './ErrorState'
import { useOrderMode } from '../hooks/useOrderMode'

interface MenuViewProps {
  mode: 'delivery' | 'mesa' | 'balcao'
  tableNumber?: number
  onCartClick?: () => void
  headerTitle?: string
  headerSubtitle?: string
  headerTheme?: 'primary' | 'dark'
  storeSlug?: string
}

function isStoreOpen(openingHours: Record<string, { open: string; close: string; closed: boolean }> | undefined): boolean {
  if (!openingHours || Object.keys(openingHours).length === 0) return true
  const now = new Date()
  const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
  const today = dayNames[now.getDay()]
  const todayHours = openingHours[today]
  if (!todayHours || todayHours.closed) return false
  const [openH, openM] = todayHours.open.split(':').map(Number)
  const [closeH, closeM] = todayHours.close.split(':').map(Number)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
}

export default function MenuView({ mode, tableNumber, headerTitle, headerSubtitle, headerTheme = 'primary', storeSlug }: MenuViewProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [highlightModal, setHighlightModal] = useState<{ product: any } | null>(null)
  const setMode = useOrderMode(s => s.setMode)

  useEffect(() => { setMode(mode, mode === 'mesa' ? tableNumber : undefined) }, [mode, tableNumber, setMode])

  const { data: products, isLoading, isError, refetch } = useQuery({ queryKey: ['products', storeSlug ?? 'main'], queryFn: getProducts })
  const { data: categories } = useQuery({ queryKey: ['categories', storeSlug ?? 'main'], queryFn: getCategories })
  const { data: highlights } = useQuery({ queryKey: ['highlights', storeSlug ?? 'main'], queryFn: getHighlightedProducts })
  const { data: storeSettings } = useQuery({ queryKey: ['storeSettings', storeSlug ?? 'main'], queryFn: getStoreSettings })
  const { data: complementGroupsMap } = useQuery({ queryKey: ['complementGroupsMap', storeSlug ?? 'main'], queryFn: getAllComplementGroups })

  const storeOpen = storeSettings?.isOpen === false ? false : isStoreOpen(storeSettings?.openingHours)

  const filtered = useMemo(() => {
    let list = activeCategory === 'all' ? products : products?.filter(p => p.categoryId === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list?.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.ingredients.some(i => i.toLowerCase().includes(q))
      )
    }
    return list
  }, [products, activeCategory, search])

  if (isLoading) return <LoadingScreen />
  if (isError) return <ErrorState onRetry={refetch} />

  const themeBg = headerTheme === 'dark'
    ? 'linear-gradient(135deg, #1a1a2e, #16213e)'
    : 'linear-gradient(135deg, #e74c3c, #c0392b)'

  const categoryName = activeCategory === 'all'
    ? `Todos os Produtos (${products?.length || 0})`
    : `${categories?.find(c => c.id === activeCategory)?.name || ''}`

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      {/* Hero Header */}
      <div style={{
        background: storeSettings?.logoUrl
          ? `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url(${storeSettings.logoUrl}) center/cover`
          : themeBg,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: .08,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="container-lg" style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 16px 20px', position: 'relative' }}>
          {tableNumber && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
              padding: '4px 14px', borderRadius: 20, marginBottom: 8,
              fontSize: '.8rem', color: '#fff',
            }}>
              🍽️ Mesa {tableNumber}
            </div>
          )}
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 900, color: '#fff',
            lineHeight: 1.2, letterSpacing: '-.5px',
          }}>
            {headerTitle || 'Cardápio Digital'}
          </h1>
          {headerSubtitle && (
            <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.75)', marginTop: 4 }}>
              {headerSubtitle}
            </p>
          )}
          <div style={{ marginTop: 10 }}>
            <span className={`store-status ${storeOpen ? 'open' : 'closed'}`}>
              <span className="store-status-dot" />
              {storeOpen ? 'Aberto agora' : 'Fechado'}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container-lg" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          marginTop: -20, position: 'relative', zIndex: 10,
          background: '#fff', borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,.1)',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px',
        }}>
          <span style={{ fontSize: '1.1rem', opacity: .4 }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar no cardápio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none', padding: '14px 0',
              fontSize: '.95rem', background: 'transparent',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ fontSize: '1rem', opacity: .3, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="container-lg" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>
        {/* Highlights */}
        {highlights && highlights.length > 0 && !search && (
          <section className="mt-xl mb-lg animate-slideUp">
            <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>
              🔥 Destaques
            </h2>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
              {highlights.map(p => (
                <div
                  key={p.id}
                  className="card card-hover"
                  style={{
                    padding: 0, minWidth: 200, maxWidth: 240, flexShrink: 0, scrollSnapAlign: 'start',
                    overflow: 'hidden', borderRadius: 14, cursor: 'pointer',
                  }}
                  onClick={() => setHighlightModal({ product: p })}
                >
                  <div style={{
                    width: '100%', height: 120,
                    background: `url(${p.image || ''}) center/cover`,
                    backgroundColor: '#f0f0f0',
                  }} />
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ fontSize: '.85rem', fontWeight: 700 }}>{p.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {p.pricePromotional ? (
                        <>
                          <span style={{ fontSize: '.7rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                            R$ {p.price.toFixed(2)}
                          </span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                            R$ {p.pricePromotional.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '1rem', fontWeight: 800 }}>
                          R$ {p.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Category Tabs - Sticky */}
        {categories && !search && (
          <div className="category-tabs-sticky animate-fadeIn" style={{ marginTop: highlights?.length ? 0 : 24 }}>
            <div style={{
              display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8,
            }}>
              <button
                className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setActiveCategory('all')}
                style={{ borderRadius: 20, flexShrink: 0, fontSize: '.8rem' }}
              >
                📋 Todos
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  className={`btn ${activeCategory === c.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
                  onClick={() => setActiveCategory(c.id)}
                  style={{ borderRadius: 20, flexShrink: 0, fontSize: '.8rem' }}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Title */}
        <div className="animate-fadeIn" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 20, marginBottom: 14,
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {search ? `Resultados para "${search}"` : categoryName}
          </h2>
          <span style={{ fontSize: '.8rem', color: 'var(--text-light)' }}>
            {filtered?.length || 0} {filtered?.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {/* Product Grid */}
        <section className="animate-fadeIn">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {filtered?.map((p, i) => (
              <div key={p.id} style={{ animation: `slideUp .3s ${i * 0.03}s both` }}>
                <ProductCard product={p} hasComplements={!!(complementGroupsMap && complementGroupsMap[p.id]?.length)} />
              </div>
            ))}
          </div>

          {filtered?.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p className="empty-state-title">Nenhum resultado</p>
              <p className="empty-state-text">
                {search ? `Nada encontrado para "${search}"` : 'Nenhum produto disponível nesta categoria'}
              </p>
              {search && (
                <button className="btn btn-outline btn-sm" onClick={() => setSearch('')} style={{ marginTop: 8 }}>
                  Limpar busca
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {highlightModal && (
        <ProductDetailModal
          product={highlightModal.product}
          open={true}
          onClose={() => setHighlightModal(null)}
        />
      )}
    </div>
  )
}
