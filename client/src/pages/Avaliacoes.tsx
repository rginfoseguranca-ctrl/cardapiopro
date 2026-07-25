import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProducts, getProductReviews } from '../api/client'

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: '1.1rem', letterSpacing: 2 }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  )
}

export default function Avaliacoes() {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const { data: allReviewsData, isLoading } = useQuery({
    queryKey: ['allReviews'],
    queryFn: async () => {
      const reviews: { id: string; product_id: string; product_name: string; customer_name: string; rating: number; comment: string; created_at: string }[] = []
      for (const p of products) {
        try {
          const res = await getProductReviews(p.id)
          if (res.reviews) {
            res.reviews.forEach((r: any) => reviews.push({ ...r, product_name: p.name }))
          }
        } catch {}
      }
      return reviews
    },
    enabled: products.length > 0,
  })

  const reviews = allReviewsData || []
  const total = reviews.length
  const avgRating = total > 0 ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total).toFixed(1) : '0.0'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>⭐ Avaliações</h1>
        <Link to="/dashboard" style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 4 }}>Total de Avaliações</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#333' }}>{total}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 4 }}>Nota Média</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#333' }}>{avgRating}</p>
          <Stars rating={Number(avgRating)} />
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 4 }}>Melhores Avaliações</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{reviews.filter((r: any) => r.rating === 5).length}</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Avaliações dos Clientes</h3>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>Carregando...</p>
        ) : reviews.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>Nenhuma avaliação ainda</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map((review: any) => (
              <div key={review.id} style={{ padding: '16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, color: '#333', fontSize: '0.9rem' }}>{review.customer_name}</p>
                    <p style={{ fontSize: '0.78rem', color: '#999' }}>{review.product_name}</p>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#999' }}>
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <Stars rating={review.rating} />
                {review.comment && (
                  <p style={{ marginTop: 8, fontSize: '0.88rem', color: '#555', lineHeight: 1.5 }}>{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
