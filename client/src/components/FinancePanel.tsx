import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFinanceAccounts, createFinanceAccount, deleteFinanceAccount, getFinanceCategories, createFinanceCategory, deleteFinanceCategory, getFinanceTransactions, createFinanceTransaction, deleteFinanceTransaction, payFinanceTransaction, getFinanceRecurring, createFinanceRecurring, deleteFinanceRecurring, getFinanceSummary } from '../api/client'
import { exportToCSV, financialToCSV } from '../utils/export'

export default function FinancePanel() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="panel-fadeIn">
      <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard', label: '📊 Resumo' },
          { key: 'transactions', label: '📋 Lançamentos' },
          { key: 'accounts', label: '🏦 Contas' },
          { key: 'categories', label: '🏷️ Categorias' },
          { key: 'recurring', label: '🔄 Recorrentes' },
        ].map(t => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'dashboard' && <FinanceDashboard />}
      {tab === 'transactions' && <FinanceTransactions />}
      {tab === 'accounts' && <FinanceAccounts />}
      {tab === 'categories' && <FinanceCategories />}
      {tab === 'recurring' && <FinanceRecurring />}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: '.82rem',
  outline: 'none', background: '#fff',
}

function FinanceDashboard() {
  const { data } = useQuery({ queryKey: ['financeSummary'], queryFn: getFinanceSummary, refetchInterval: 15000 })

  if (!data) return <p className="text-muted text-sm">Carregando...</p>

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: 20 }}>
          <span style={{ fontSize: '1.5rem' }}>💰</span>
          <p className="font-bold" style={{ fontSize: '1.3rem', color: data.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            R$ {Number(data.balance).toFixed(2)}
          </p>
          <p className="text-xs text-muted">Saldo do Período</p>
        </div>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: 20 }}>
          <span style={{ fontSize: '1.5rem' }}>📈</span>
          <p className="font-bold" style={{ fontSize: '1.3rem', color: 'var(--success)' }}>R$ {Number(data.totalIncome).toFixed(2)}</p>
          <p className="text-xs text-muted">Receitas</p>
        </div>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: 20 }}>
          <span style={{ fontSize: '1.5rem' }}>📉</span>
          <p className="font-bold" style={{ fontSize: '1.3rem', color: 'var(--danger)' }}>R$ {Number(data.totalExpense).toFixed(2)}</p>
          <p className="text-xs text-muted">Despesas</p>
        </div>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: 20 }}>
          <span style={{ fontSize: '1.5rem' }}>⏳</span>
          <p className="font-bold" style={{ fontSize: '1.3rem' }}>R$ {Number(data.pendingIncome).toFixed(2)}</p>
          <p className="text-xs text-muted">A Receber</p>
        </div>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: 20 }}>
          <span style={{ fontSize: '1.5rem' }}>⏳</span>
          <p className="font-bold" style={{ fontSize: '1.3rem' }}>R$ {Number(data.pendingExpense).toFixed(2)}</p>
          <p className="text-xs text-muted">A Pagar</p>
        </div>
      </div>

      <h4 className="font-semibold mb-sm">🏦 Contas</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.accounts?.map((a: any) => (
          <div key={a.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', padding: 14 }}>
            <span>{a.name} {a.bank && <span className="text-muted text-xs">• {a.bank}</span>}</span>
            <span className="font-semibold" style={{ color: a.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              R$ {Number(a.balance).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinanceAccounts() {
  const queryClient = useQueryClient()
  const { data: accounts } = useQuery({ queryKey: ['financeAccounts'], queryFn: getFinanceAccounts })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'checking', bank: '' })
  const createMut = useMutation({
    mutationFn: createFinanceAccount,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financeAccounts'] }); queryClient.invalidateQueries({ queryKey: ['financeSummary'] }); setShowForm(false); setForm({ name: '', type: 'checking', bank: '' }) }
  })
  const deleteMut = useMutation({
    mutationFn: deleteFinanceAccount,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financeAccounts'] }); queryClient.invalidateQueries({ queryKey: ['financeSummary'] }) }
  })

  return (
    <div>
      <button className="btn btn-primary btn-sm mb-md" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Nova Conta'}</button>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Nome *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="checking">Conta Corrente</option>
            <option value="savings">Poupança</option>
            <option value="cash">Caixa</option>
            <option value="credit">Cartão Crédito</option>
          </select>
          <input style={inputStyle} placeholder="Banco" value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} />
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {accounts?.map(a => (
          <div key={a.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <div>
              <span className="font-semibold">{a.name}</span>
              <span className="text-sm text-muted ml-sm">{a.bank} • {a.type}</span>
            </div>
            <div className="flex items-center gap-sm">
              <span className="font-bold">R$ {Number(a.balance).toFixed(2)}</span>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteMut.mutate(a.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {(!accounts || accounts.length === 0) && <p className="text-muted text-sm">Nenhuma conta</p>}
      </div>
    </div>
  )
}

function FinanceCategories() {
  const queryClient = useQueryClient()
  const { data: cats } = useQuery({ queryKey: ['financeCategories'], queryFn: getFinanceCategories })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'expense', icon: '📂', color: '#6c757d' })
  const createMut = useMutation({
    mutationFn: createFinanceCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financeCategories'] }); setShowForm(false); setForm({ name: '', type: 'expense', icon: '📂', color: '#6c757d' }) }
  })
  const deleteMut = useMutation({
    mutationFn: deleteFinanceCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financeCategories'] })
  })

  return (
    <div>
      <button className="btn btn-primary btn-sm mb-md" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Nova Categoria'}</button>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Nome *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="expense">Despesa</option><option value="income">Receita</option>
          </select>
          <input style={{ ...inputStyle, width: 50 }} placeholder="Ícone" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
          <input style={{ ...inputStyle, width: 80 }} type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {cats?.map(c => (
          <div key={c.id} className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
            <span>{c.icon}</span>
            <span className="text-sm">{c.name}</span>
            <span className={`badge ${c.type === 'income' ? 'badge-success' : 'badge-danger'}`}>{c.type === 'income' ? 'Receita' : 'Despesa'}</span>
            <button className="btn-ghost" style={{ color: 'var(--danger)', fontSize: '.75rem' }} onClick={() => deleteMut.mutate(c.id)}>✕</button>
          </div>
        ))}
        {(!cats || cats.length === 0) && <p className="text-muted text-sm">Nenhuma categoria</p>}
      </div>
    </div>
  )
}

function FinanceTransactions() {
  const queryClient = useQueryClient()
  const { data: txs } = useQuery({ queryKey: ['financeTransactions'], queryFn: () => getFinanceTransactions() })
  const { data: accounts } = useQuery({ queryKey: ['financeAccounts'], queryFn: getFinanceAccounts })
  const { data: cats } = useQuery({ queryKey: ['financeCategories'], queryFn: getFinanceCategories })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ accountId: '', categoryId: '', type: 'expense', description: '', amount: '', paymentMethod: '', notes: '' })
  const createMut = useMutation({
    mutationFn: createFinanceTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] })
      queryClient.invalidateQueries({ queryKey: ['financeAccounts'] })
      setShowForm(false)
      setForm({ accountId: '', categoryId: '', type: 'expense', description: '', amount: '', paymentMethod: '', notes: '' })
    }
  })
  const deleteMut = useMutation({
    mutationFn: deleteFinanceTransaction,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financeTransactions'] }); queryClient.invalidateQueries({ queryKey: ['financeSummary'] }); queryClient.invalidateQueries({ queryKey: ['financeAccounts'] }) }
  })
  const payMut = useMutation({
    mutationFn: (id: string) => payFinanceTransaction(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financeTransactions'] }); queryClient.invalidateQueries({ queryKey: ['financeSummary'] }); queryClient.invalidateQueries({ queryKey: ['financeAccounts'] }) }
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Novo Lançamento'}</button>
        {txs && txs.length > 0 && (
          <button className="btn btn-outline btn-sm" onClick={() => exportToCSV(financialToCSV(txs), 'financeiro')}>📥 Exportar CSV</button>
        )}
      </div>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate({ ...form, amount: Number(form.amount), accountId: form.accountId, categoryId: form.categoryId || undefined }) }}
          style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <select style={inputStyle} value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} required>
            <option value="">Conta *</option>
            {accounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="expense">Despesa</option><option value="income">Receita</option>
          </select>
          <input style={inputStyle} placeholder="Descrição *" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input style={{ ...inputStyle, width: 100 }} type="number" step="0.01" placeholder="Valor" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <select style={inputStyle} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Categoria</option>
            {cats?.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select style={inputStyle} value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
            <option value="">Forma</option><option value="pix">PIX</option><option value="credit">Crédito</option><option value="debit">Débito</option><option value="cash">Dinheiro</option><option value="transfer">Transferência</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm">Adicionar</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {txs?.map(tx => (
          <div key={tx.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', fontSize: '.85rem' }}>
            <div className="flex-1">
              <span className="font-semibold">{tx.description}</span>
              <span className="text-muted text-xs ml-sm">
                {tx.category_icon} {tx.category_name || 'Sem categoria'} • {tx.account_name} • {tx.payment_method}
              </span>
              <div className="text-xs text-muted">{new Date(tx.date).toLocaleDateString('pt-BR')}</div>
            </div>
            <div className="flex items-center gap-sm">
              <span className={`badge ${tx.status === 'paid' || tx.status === 'received' ? 'badge-success' : tx.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                {tx.status === 'paid' ? 'Pago' : tx.status === 'received' ? 'Recebido' : 'Pendente'}
              </span>
              <span className="font-bold" style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', minWidth: 80, textAlign: 'right' }}>
                {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
              </span>
              {tx.status === 'pending' && (
                <button className="btn btn-outline btn-xs" onClick={() => payMut.mutate(tx.id)}>✓ Pago</button>
              )}
              <button className="btn-ghost" style={{ color: 'var(--danger)', fontSize: '.75rem' }} onClick={() => deleteMut.mutate(tx.id)}>✕</button>
            </div>
          </div>
        ))}
        {(!txs || txs.length === 0) && <p className="text-muted text-sm">Nenhum lançamento</p>}
      </div>
    </div>
  )
}

function FinanceRecurring() {
  const queryClient = useQueryClient()
  const { data: recs } = useQuery({ queryKey: ['financeRecurring'], queryFn: getFinanceRecurring })
  const { data: accounts } = useQuery({ queryKey: ['financeAccounts'], queryFn: getFinanceAccounts })
  const { data: cats } = useQuery({ queryKey: ['financeCategories'], queryFn: getFinanceCategories })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense', categoryId: '', accountId: '', frequency: 'monthly', intervalDays: 30 })
  const createMut = useMutation({
    mutationFn: createFinanceRecurring,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financeRecurring'] }); setShowForm(false); setForm({ description: '', amount: '', type: 'expense', categoryId: '', accountId: '', frequency: 'monthly', intervalDays: 30 }) }
  })
  const deleteMut = useMutation({
    mutationFn: deleteFinanceRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financeRecurring'] })
  })

  return (
    <div>
      <button className="btn btn-primary btn-sm mb-md" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Nova Recorrente'}</button>
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); createMut.mutate({ ...form, amount: Number(form.amount), categoryId: form.categoryId || undefined, accountId: form.accountId || undefined }) }}
          style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Descrição *" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input style={{ ...inputStyle, width: 100 }} type="number" placeholder="Valor" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="expense">Despesa</option><option value="income">Receita</option>
          </select>
          <select style={inputStyle} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
            <option value="monthly">Mensal</option><option value="weekly">Semanal</option><option value="yearly">Anual</option><option value="custom">Personalizado</option>
          </select>
          <select style={inputStyle} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Categoria</option>
            {cats?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={inputStyle} value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
            <option value="">Conta</option>
            {accounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {recs?.map(r => (
          <div key={r.id} className="dashboard-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <div>
              <span className="font-semibold">{r.description}</span>
              <span className="text-sm text-muted ml-sm">
                {r.frequency} • {r.category_name || 'Sem categoria'} • {r.account_name || 'Sem conta'}
                {r.next_due && ` • Próximo: ${new Date(r.next_due).toLocaleDateString('pt-BR')}`}
              </span>
            </div>
            <div className="flex items-center gap-sm">
              <span className="font-bold" style={{ color: r.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                R$ {Number(r.amount).toFixed(2)}
              </span>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteMut.mutate(r.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {(!recs || recs.length === 0) && <p className="text-muted text-sm">Nenhuma recorrência</p>}
      </div>
    </div>
  )
}