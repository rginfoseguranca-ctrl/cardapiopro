import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getBlogPosts } from '../api/client'

export default function Blog() {
  const { data: posts } = useQuery({ queryKey: ['blog'], queryFn: () => getBlogPosts() })

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>📝 Blog</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 32 }}>Dicas e conteúdos para seu delivery</p>
      <div style={{ display: 'grid', gap: 20 }}>
        {posts?.map((post: any) => (
          <Link key={post.id} to={`/blog/${post.slug}`} className="card" style={{ padding: 24, display: 'block' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8 }}>{post.title}</h2>
            {post.excerpt && <p style={{ color: 'var(--text-light)', fontSize: '.9rem', marginBottom: 8 }}>{post.excerpt}</p>}
            <div style={{ display: 'flex', gap: 12, fontSize: '.8rem', color: 'var(--text-light)' }}>
              {post.author && <span>✍️ {post.author}</span>}
              {post.published_at && <span>📅 {new Date(post.published_at).toLocaleDateString('pt-BR')}</span>}
            </div>
          </Link>
        ))}
        {(!posts || posts.length === 0) && (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40 }}>Nenhum post publicado ainda</p>
        )}
      </div>
    </div>
  )
}
