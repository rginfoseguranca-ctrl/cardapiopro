import { useState, useEffect } from 'react'
import type { Product } from '../api/client'
import { getComplementGroups } from '../api/client'
import { useCart } from '../hooks/useCart'
import { showToast } from './Toast'
import ProductDetailModal from './ProductDetailModal'

interface Props {
  product: Product
  hasComplements?: boolean
}

export default function ProductCard({ product, hasComplements: hasComplementsProp }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [hasComplementsLocal, setHasComplementsLocal] = useState<boolean | null>(null)
  const addItem = useCart(s => s.addItem)
  const hasPromo = product.pricePromotional && product.pricePromotional < product.price
  const isUnavailable = product.isAvailable === false

  const hasComplements = hasComplementsProp !== undefined ? hasComplementsProp : hasComplementsLocal

  useEffect(() => {
    if (hasComplementsProp !== undefined || modalOpen) return
    getComplementGroups(product.id).then(groups => {
      setHasComplementsLocal(groups && groups.length > 0)
    }).catch(() => setHasComplementsLocal(false))
  }, [product.id, hasComplementsProp, modalOpen])

  const handleDirectAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUnavailable) return
    const basePrice = hasPromo ? product.pricePromotional! : product.price
    addItem({
      productId: product.id,
      productName: product.name,
      description: product.description,
      unitPrice: basePrice,
    })
    showToast(`${product.name} adicionado ao carrinho!`, 'success')
  }

  const handleClick = () => {
    if (isUnavailable) return
    setModalOpen(true)
  }

  return (
    <>
      <div
        className={`card card-hover ${isUnavailable ? 'product-unavailable' : ''}`}
        style={{
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          cursor: isUnavailable ? 'default' : 'pointer', position: 'relative',
        }}
        onClick={handleClick}
      >
        {isUnavailable && <span className="product-unavailable-badge">Indisponível</span>}

        {product.isHighlighted && (
          <span style={{
            position: 'absolute', top: 8, left: 8, zIndex: 2,
            background: 'linear-gradient(135deg, #f39c12, #e67e22)',
            color: '#fff', fontSize: '.65rem', fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
            boxShadow: '0 2px 8px rgba(243,156,18,.4)',
          }}>
            🔥 Destaque
          </span>
        )}

        <div className="product-card-img" style={{
          width: '100%', height: 160,
          background: !imgLoaded ? 'linear-gradient(135deg, #f5f5f5, #e0e0e0)' : undefined,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative',
        }}>
          {product.image && !imgError ? (
            <img
              src={product.image}
              alt={product.name}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform .3s, opacity .3s',
                opacity: imgLoaded ? 1 : 0,
              }}
              className="product-image"
              loading="lazy"
            />
          ) : (
            <div style={{ fontSize: '3rem', opacity: .4 }}>🥪</div>
          )}

          {hasPromo && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8,
              background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
              color: '#fff', fontSize: '.65rem', fontWeight: 700,
              padding: '3px 10px', borderRadius: 20,
              boxShadow: '0 2px 8px rgba(39,174,96,.4)',
            }}>
              {Math.round((1 - product.pricePromotional! / product.price) * 100)}% OFF
            </div>
          )}
        </div>

        <div className="product-card-body" style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '.95rem', fontWeight: 700, lineHeight: 1.3 }}>{product.name}</h3>
            {product.ingredients.length > 0 && (
              <p style={{
                fontSize: '.75rem', color: 'var(--text-light)', marginTop: 4,
                lineHeight: 1.4, display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {product.ingredients.join(', ')}
              </p>
            )}
          </div>

          <div className="product-card-price" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 10, gap: 8,
          }}>
            <div>
              {hasPromo ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '.7rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                    R$ {product.price.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2 }}>
                    R$ {product.pricePromotional!.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  R$ {product.price.toFixed(2)}
                </span>
              )}
            </div>

            {hasComplements === false ? (
              <button className="btn-add-direct" onClick={handleDirectAdd}>+</button>
            ) : (
              <span
                className="btn btn-primary"
                style={{
                  padding: '8px 14px', fontSize: '.8rem', borderRadius: 10,
                  minWidth: 90, textAlign: 'center', flexShrink: 0,
                }}
                onClick={e => { e.stopPropagation(); setModalOpen(true) }}
              >
                +
              </span>
            )}
          </div>
        </div>
      </div>

      <ProductDetailModal
        product={product}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
