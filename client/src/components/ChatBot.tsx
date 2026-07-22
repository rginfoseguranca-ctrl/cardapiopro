import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../api/client'

interface Message {
  text: string
  isUser: boolean
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { text: 'Olá! 🎉 Como posso ajudar? Pergunte sobre horários, endereço, entregas, pagamentos ou promoções!', isUser: false }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { text: userMsg, isUser: true }])
    setLoading(true)
    try {
      const reply = await sendChatMessage(userMsg)
      setMessages(prev => [...prev, { text: reply, isUser: false }])
    } catch {
      setMessages(prev => [...prev, { text: 'Desculpe, ocorreu um erro. Tente novamente!', isUser: false }])
    }
    setLoading(false)
  }

  return (
    <>
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 16, width: 340, maxHeight: 480,
          background: '#fff', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,.15)',
          display: 'flex', flexDirection: 'column', zIndex: 300, overflow: 'hidden'
        }}>
          <div style={{
            background: 'var(--primary)', color: '#fff', padding: '14px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontWeight: 600
          }}>
            <span>💬 Chat CardápioPro</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', color: '#fff', fontSize: '1.2rem' }}>✕</button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                background: msg.isUser ? 'var(--primary)' : '#f0f0f0',
                color: msg.isUser ? '#fff' : 'var(--text)',
                padding: '10px 14px', borderRadius: 16, maxWidth: '85%',
                fontSize: '.9rem', lineHeight: 1.4
              }}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#f0f0f0', padding: '10px 14px', borderRadius: 16, fontSize: '.9rem' }}>
                🤔 Pensando...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..."
              style={{
                flex: 1, padding: '10px', borderRadius: 20, border: '1px solid var(--border)',
                fontSize: '.9rem', outline: 'none'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              style={{
                background: 'var(--primary)', color: '#fff', borderRadius: '50%',
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0
              }}
            >➤</button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 300,
          background: 'var(--primary)', color: '#fff', borderRadius: '50%',
          width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,.3)'
        }}
      >💬</button>
    </>
  )
}
