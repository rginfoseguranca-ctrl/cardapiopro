import { useEffect, useState } from 'react'

interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error' | 'info'
}

let toastId = 0
const listeners: Set<(msg: ToastMessage) => void> = new Set()

export function showToast(text: string, type: ToastMessage['type'] = 'info') {
  const msg: ToastMessage = { id: ++toastId, text, type }
  listeners.forEach(fn => fn(msg))
}

export default function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setMessages(prev => [...prev, msg])
      setTimeout(() => setMessages(prev => prev.filter(m => m.id !== msg.id)), 3000)
    }
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])

  if (messages.length === 0) return null

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {messages.map(msg => (
        <div key={msg.id} className="animate-slideUp" style={{
          padding: '12px 20px', borderRadius: 8, color: '#fff', fontSize: '.9rem', fontWeight: 600,
          background: msg.type === 'success' ? 'var(--success)' : msg.type === 'error' ? 'var(--danger)' : 'var(--info)',
          boxShadow: '0 4px 12px rgba(0,0,0,.2)', maxWidth: 320,
        }}>
          {msg.text}
        </div>
      ))}
    </div>
  )
}
