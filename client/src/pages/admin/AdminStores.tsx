import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSaaSStores,
  getSaaSStore,
  updateSaaSStore,
  deleteSaaSStore,
  type SaaSStore,
} from '../../api/client'

const badge = (active: number): React.CSSProperties => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: '.72rem',
  fontWeight: 700,
  background: active ? 'rgba(0,184,148,.1)' : 'rgba(214,48,49,.1)',
  color: active ? '#00b894' : '#d63031',
})

const planBadge = (plan?: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: '.72rem',
  fontWeight: 700,
  background:
    plan === 'pro'
      ? 'rgba(108,92,231,.1)'
      : plan === 'enterprise'
        ? 'rgba(0,206,209,.1)'
        : 'rgba(99,110,114,.1)',
  color:
    plan === 'pro'
      ? '#6c5ce7'
      : plan === 'enterprise'
        ? '#00cec9'
        : '#636e72',
})

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e0e0e0',
  fontSize: '.85rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const btn = (color: string, _hover: string): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: color,
  color: '#fff',
  fontWeight: 700,
  fontSize: '.8rem',
  cursor: 'pointer',
  transition: 'background .15s',
})

export default function AdminStores() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: stores = [], isLoading } = useQuery<SaaSStore[]>({
    queryKey: ['saasStores'],
    queryFn: getSaaSStores,
  })

  const { data: detail } = useQuery({
    queryKey: ['saasStoreDetail', selectedId],
    queryFn: () => getSaaSStore(selectedId!),
    enabled: !!selectedId,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateSaaSStore(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saasStores'] })
      qc.invalidateQueries({ queryKey: ['saasStoreDetail', selectedId] })
      setEditForm(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteSaaSStore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saasStores'] })
      setSelectedId(null)
      setConfirmDelete(null)
    },
  })

  const toggleActive = (store: SaaSStore) => {
    updateMut.mutate({ id: store.id, data: { is_active: store.is_active ? 0 : 1 } })
  }

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()),
  )

  if (isLoading)
    return <p style={{ color: '#666', padding: 40 }}>Carregando lojas...</p>

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h2
          style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}
        >
          Lojas ({filtered.length})
        </h2>
        <input
          type="text"
          placeholder="Buscar por nome ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...inputStyle,
            width: 280,
            background: '#f8f9fa',
          }}
        />
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid #f0f0f0',
                textAlign: 'left',
              }}
            >
              {['Loja', 'Plano', 'Status', 'Usuários', 'Pedidos', 'Ações'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      fontSize: '.72rem',
                      fontWeight: 700,
                      color: '#999',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '.5px',
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((store) => (
              <tr
                key={store.id}
                style={{
                  borderBottom: '1px solid #f8f8f8',
                  cursor: 'pointer',
                  background:
                    selectedId === store.id ? 'rgba(108,92,231,.03)' : undefined,
                }}
                onClick={() => {
                  setSelectedId(selectedId === store.id ? null : store.id)
                  setEditForm(null)
                }}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: store.primary_color || '#6c5ce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: '.85rem',
                          color: '#1a1a2e',
                        }}
                      >
                        {store.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '.72rem', color: '#999' }}>
                        /{store.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={planBadge(store.sub_plan)}>
                    {(store.sub_plan || 'free').toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={badge(store.is_active)}>
                    {store.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: '.85rem',
                    fontWeight: 700,
                    color: '#333',
                  }}
                >
                  {store.user_count ?? 0}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: '.85rem',
                    fontWeight: 700,
                    color: '#333',
                  }}
                >
                  {store.order_count ?? 0}
                </td>
                <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setSelectedId(store.id)
                        setEditForm({
                          name: store.name,
                          phone: store.phone,
                          address: store.address,
                          primary_color: store.primary_color,
                        })
                      }}
                      style={{
                        ...btn('#0984e3', '#0770c2'),
                        padding: '5px 10px',
                        fontSize: '.72rem',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActive(store)}
                      style={{
                        ...btn(
                          store.is_active ? '#e17055' : '#00b894',
                          store.is_active ? '#d35400' : '#00a381',
                        ),
                        padding: '5px 10px',
                        fontSize: '.72rem',
                      }}
                    >
                      {store.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(store.id)}
                      style={{
                        ...btn('#d63031', '#b71c1c'),
                        padding: '5px 10px',
                        fontSize: '.72rem',
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 28,
              maxWidth: 400,
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}
            >
              Excluir loja?
            </h3>
            <p style={{ fontSize: '.85rem', color: '#666', margin: '0 0 20px' }}>
              Esta ação não pode ser desfeita. Todos os dados da loja serão removidos.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  ...btn('#eee', '#ddd'),
                  color: '#333',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMut.mutate(confirmDelete)}
                disabled={deleteMut.isPending}
                style={btn('#d63031', '#b71c1c')}
              >
                {deleteMut.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedId && detail && (
        <div
          style={{
            marginTop: 20,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,.06)',
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: detail.store?.primary_color || '#6c5ce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                }}
              >
                {(detail.store?.name || '').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#1a1a2e',
                    margin: 0,
                  }}
                >
                  {detail.store?.name}
                </h3>
                <p style={{ fontSize: '.78rem', color: '#999', margin: 0 }}>
                  Criada em{' '}
                  {new Date(detail.store?.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedId(null)
                setEditForm(null)
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#999',
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: 'Usuários',
                value: detail.users?.length ?? 0,
                icon: '👥',
                color: '#6c5ce7',
              },
              {
                label: 'Pedidos',
                value: detail.orders?.length ?? 0,
                icon: '📋',
                color: '#0984e3',
              },
              {
                label: 'Assinatura',
                value: (detail.subscription?.status || 'Nenhuma').toUpperCase(),
                icon: '💳',
                color: '#00b894',
              },
              {
                label: 'Plano',
                value: (detail.subscription?.plan || 'Free').toUpperCase(),
                icon: '📦',
                color: '#e17055',
              },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  padding: '16px',
                  borderRadius: 10,
                  background: `${c.color}08`,
                  border: `1px solid ${c.color}18`,
                }}
              >
                <p
                  style={{
                    fontSize: '.72rem',
                    color: '#888',
                    margin: '0 0 4px',
                  }}
                >
                  {c.icon} {c.label}
                </p>
                <p
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: c.color,
                    margin: 0,
                  }}
                >
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          {editForm && (
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: 10,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <h4
                style={{
                  fontSize: '.85rem',
                  fontWeight: 700,
                  color: '#1a1a2e',
                  margin: '0 0 14px',
                }}
              >
                Editar Loja
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '.72rem',
                      fontWeight: 600,
                      color: '#666',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Nome
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '.72rem',
                      fontWeight: 600,
                      color: '#666',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Telefone
                  </label>
                  <input
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      fontSize: '.72rem',
                      fontWeight: 600,
                      color: '#666',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Endereço
                  </label>
                  <input
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '.72rem',
                      fontWeight: 600,
                      color: '#666',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Cor Principal
                  </label>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <input
                      type="color"
                      value={editForm.primary_color || '#6c5ce7'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          primary_color: e.target.value,
                        })
                      }
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                    <input
                      value={editForm.primary_color}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          primary_color: e.target.value,
                        })
                      }
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '.72rem',
                      fontWeight: 600,
                      color: '#666',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Status
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => toggleActive(detail.store)}
                      style={{
                        ...btn(
                          detail.store?.is_active ? '#00b894' : '#d63031',
                          detail.store?.is_active ? '#00a381' : '#b71c1c',
                        ),
                        flex: 1,
                      }}
                    >
                      {detail.store?.is_active ? 'Ativa' : 'Inativa'}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => setEditForm(null)}
                  style={{ ...btn('#eee', '#ddd'), color: '#333' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    updateMut.mutate({ id: selectedId!, data: editForm })
                  }
                  disabled={updateMut.isPending}
                  style={btn('#6c5ce7', '#5a4bd1')}
                >
                  {updateMut.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}

          {detail.users && detail.users.length > 0 && (
            <div>
              <h4
                style={{
                  fontSize: '.85rem',
                  fontWeight: 700,
                  color: '#1a1a2e',
                  margin: '0 0 12px',
                }}
              >
                Usuários ({detail.users.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detail.users.map((u: any) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: '#f8f9fa',
                      fontSize: '.82rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: '#6c5ce715',
                          color: '#6c5ce7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '.72rem',
                        }}
                      >
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 600,
                            color: '#333',
                          }}
                        >
                          {u.name}
                        </p>
                        <p style={{ margin: 0, fontSize: '.7rem', color: '#999' }}>
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '.7rem',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background:
                          u.role === 'owner'
                            ? 'rgba(108,92,231,.1)'
                            : 'rgba(99,110,114,.1)',
                        color:
                          u.role === 'owner' ? '#6c5ce7' : '#636e72',
                        fontWeight: 600,
                      }}
                    >
                      {u.role || 'user'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
