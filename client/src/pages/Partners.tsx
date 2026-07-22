import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { registerPartner } from '../api/client'

export default function Partners() {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', city: '' })
  const [done, setDone] = useState(false)

  const mut = useMutation({
    mutationFn: registerPartner,
    onSuccess: () => { setDone(true); setForm({ name: '', company: '', email: '', phone: '', city: '' }) }
  })

  return (
    <div className="container" style={{ padding: '40px 16px', maxWidth: 600 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>🤝 Seja um Parceiro</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 32 }}>
        Faça parte do nosso programa de parcerias. Comissões atrativas, exclusividade e mentoria com especialistas.
      </p>

      {done ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🎉</span>
          <h2 style={{ marginTop: 16 }}>Recebemos sua solicitação!</h2>
          <p style={{ color: 'var(--text-light)', marginTop: 8 }}>Entraremos em contato em breve.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setDone(false)}>Nova solicitação</button>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); mut.mutate(form) }} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input placeholder="Seu nome *" required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input placeholder="Empresa" style={inputStyle} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          <input placeholder="E-mail" type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input placeholder="WhatsApp" style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <input placeholder="Cidade" style={inputStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={mut.isPending}>
            {mut.isPending ? 'Enviando...' : 'Quero ser Parceiro'}
          </button>
          {mut.isSuccess && <p style={{ color: 'var(--success)', textAlign: 'center' }}>Solicitação enviada!</p>}
          {mut.isError && <p style={{ color: 'var(--primary)', textAlign: 'center' }}>Erro ao enviar. Tente novamente.</p>}
        </form>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)',
  fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
}
