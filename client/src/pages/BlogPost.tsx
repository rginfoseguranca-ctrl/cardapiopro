import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBlogPost } from '../api/client'

export default function BlogPost() {
  const { slug } = useParams()
  const { data: post } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => getBlogPost(slug!),
    enabled: !!slug,
  })

  if (!post) return <div className="container" style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>

  return (
    <div className="container" style={{ padding: '40px 16px', maxWidth: 700 }}>
      <Link to="/blog" className="btn btn-outline btn-sm" style={{ marginBottom: 24 }}>← Blog</Link>
      <article>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12 }}>{post.title}</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: '.85rem', color: 'var(--text-light)', marginBottom: 24 }}>
          {post.author && <span>✍️ {post.author}</span>}
          {post.published_at && <span>📅 {new Date(post.published_at).toLocaleDateString('pt-BR')}</span>}
        </div>
        <div style={{ lineHeight: 1.8, fontSize: '1.05rem' }}>
          {post.content?.split('\n').map((p: string, i: number) => <p key={i} style={{ marginBottom: 16 }}>{p}</p>)}
        </div>
      </article>
    </div>
  )
}
