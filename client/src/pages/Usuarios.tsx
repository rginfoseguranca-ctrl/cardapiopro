import { useState } from 'react';

interface StoreUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const initialUsers: StoreUser[] = [
  { id: '1', name: 'Admin Loja', email: 'admin@loja.com', role: 'admin', created_at: '2025-01-15' },
  { id: '2', name: 'Atendente Maria', email: 'maria@loja.com', role: 'atendente', created_at: '2025-03-20' },
  { id: '3', name: 'Cozinheiro João', email: 'joao@loja.com', role: 'cozinha', created_at: '2025-06-10' },
];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, sans-serif', background: '#f5f5f5', minHeight: '100vh' },
  title: { fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  formRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const, alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6, flex: '1 1 180px' },
  label: { fontSize: 13, fontWeight: 600, color: '#555' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  select: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  btnAdd: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' as const, borderBottom: '1px solid #eee' },
  td: { padding: '12px', fontSize: 14, color: '#333', borderBottom: '1px solid #f0f0f0' },
  badge: { padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  btnDelete: { padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  modalOverlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 16, maxWidth: 400, width: '100%' },
  modalBtns: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  btnCancel: { padding: '8px 16px', background: '#eee', color: '#333', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnConfirm: { padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

const roleColors: Record<string, string> = {
  admin: '#ede9fe',
  atendente: '#dbeafe',
  cozinha: '#fef3c7',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  atendente: 'Atendente',
  cozinha: 'Cozinha',
};

export default function Usuarios() {
  const [users, setUsers] = useState<StoreUser[]>(initialUsers);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('atendente');
  const [deleteTarget, setDeleteTarget] = useState<StoreUser | null>(null);

  const handleInvite = () => {
    if (!name || !email) return;
    setUsers([...users, {
      id: Date.now().toString(),
      name,
      email,
      role,
      created_at: new Date().toISOString().split('T')[0],
    }]);
    setName('');
    setEmail('');
    setRole('atendente');
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      setUsers(users.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Usuários</h1>

      <div style={styles.card}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Convidar Usuário</h3>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Nome</label>
            <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>E-mail</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Função</label>
            <select style={styles.select} value={role} onChange={e => setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="atendente">Atendente</option>
              <option value="cozinha">Cozinha</option>
            </select>
          </div>
          <button style={styles.btnAdd} onClick={handleInvite}>Convidar</button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Usuários da Loja</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>E-mail</th>
              <th style={styles.th}>Função</th>
              <th style={styles.th}>Criado em</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={styles.td}>{user.name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, background: roleColors[user.role] || '#f3f4f6', color: '#333' }}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </td>
                <td style={styles.td}>{user.created_at}</td>
                <td style={styles.td}>
                  <button style={styles.btnDelete} onClick={() => setDeleteTarget(user)}>Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div style={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Confirmar Remoção</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
              Deseja remover <strong>{deleteTarget.name}</strong> da loja?
            </p>
            <div style={styles.modalBtns}>
              <button style={styles.btnCancel} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button style={styles.btnConfirm} onClick={confirmDelete}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
