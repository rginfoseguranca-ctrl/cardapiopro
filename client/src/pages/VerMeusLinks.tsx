import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getStoreSettings, type StoreSettings } from '../api/client'

export default function VerMeusLinks() {
  const { data: settings } = useQuery<StoreSettings>({
    queryKey: ['storeSettings'],
    queryFn: getStoreSettings,
  })

  const [copied, setCopied] = useState(false)

  const storeName = settings?.storeName || 'Minha Loja'
  const slug = storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const publicUrl = `${window.location.origin}/menu/${slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappMsg = encodeURIComponent(`Confira nosso cardápio: ${publicUrl}`)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🔗 Meus Links</h1>
        <Link to="/dashboard" style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Link do Cardápio</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            flex: 1,
            padding: '12px 16px',
            background: '#f9fafb',
            borderRadius: 8,
            border: '1px solid #eee',
            fontSize: '0.9rem',
            color: '#333',
            wordBreak: 'break-all',
          }}>
            {publicUrl}
          </div>
          <button
            onClick={handleCopy}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: copied ? '#27ae60' : '#e74c3c',
              color: '#fff',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background .2s',
            }}
          >
            {copied ? '✓ Copiado!' : '📋 Copiar'}
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, marginBottom: 16, textAlign: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>QR Code</h3>
        <div style={{
          width: 200,
          height: 200,
          margin: '0 auto',
          background: '#f9fafb',
          borderRadius: 12,
          border: '2px dashed #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div>
            <p style={{ fontSize: '2.5rem', marginBottom: 4 }}>📱</p>
            <p style={{ fontSize: '0.78rem', color: '#999' }}>QR Code</p>
            <p style={{ fontSize: '0.75rem', color: '#ccc' }}>Em breve</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: 16 }}>Compartilhar</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <a
            href={`https://wa.me/?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 20px',
              borderRadius: 8,
              background: '#25D366',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            💬 WhatsApp
          </a>
          <a
            href={`https://www.instagram.com/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 20px',
              borderRadius: 8,
              background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            📸 Instagram
          </a>
        </div>
      </div>
    </div>
  )
}
