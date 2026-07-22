import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 32, marginBottom: 8, color: '#2c3e50' }}>404</h1>
        <p style={{ color: '#7f8c8d', marginBottom: 24, fontSize: 18 }}>
          Página não encontrada
        </p>
        <Link to="/" style={{
          padding: '12px 32px',
          fontSize: 16,
          background: 'var(--primary, #e74c3c)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          textDecoration: 'none',
          display: 'inline-block',
        }}>
          Voltar ao Cardápio
        </Link>
      </div>
    </div>
  )
}
