import { useState } from 'react';

interface PlanFeature {
  name: string;
  start: string | boolean;
  pro: string | boolean;
  premium: string | boolean;
}

const features: PlanFeature[] = [
  { name: 'Cardápio digital', start: true, pro: true, premium: true },
  { name: 'Pedidos delivery', start: true, pro: true, premium: true },
  { name: 'Retirada', start: true, pro: true, premium: true },
  { name: 'Produtos ilimitados', start: '50', pro: '500', premium: 'Ilimitado' },
  { name: 'Categorias', start: '5', pro: '30', premium: 'Ilimitado' },
  { name: 'Complementos', start: false, pro: true, premium: true },
  { name: 'Impressão automática', start: false, pro: true, premium: true },
  { name: 'Integrações', start: false, pro: 'Básico', premium: 'Completo' },
  { name: 'Suporte prioritário', start: false, pro: false, premium: true },
  { name: 'Multi-loja', start: false, pro: false, premium: true },
];

const planPrices: Record<string, string> = {
  Start: 'R$ 49,90/mês',
  Profissional: 'R$ 99,90/mês',
  Premium: 'R$ 179,90/mês',
};

const planColors: Record<string, string> = {
  Start: '#60a5fa',
  Profissional: '#a78bfa',
  Premium: '#f59e0b',
};

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, sans-serif', background: '#f5f5f5', minHeight: '100vh' },
  title: { fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  planCard: { display: 'flex', alignItems: 'center', gap: 20, padding: 20, borderRadius: 12, border: '2px solid #2563eb' },
  planBadge: { padding: '6px 16px', borderRadius: 20, fontSize: 14, fontWeight: 700, color: '#fff' },
  planInfo: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  planName: { fontSize: 20, fontWeight: 700, color: '#1a1a1a' },
  planPrice: { fontSize: 14, color: '#666' },
  statsRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  statItem: { flex: '1 1 150px', padding: 16, background: '#f9fafb', borderRadius: 10, display: 'flex', flexDirection: 'column' as const, gap: 4 },
  statValue: { fontSize: 24, fontWeight: 700, color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#888', fontWeight: 500 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' as const, borderBottom: '1px solid #eee' },
  td: { padding: '10px 12px', fontSize: 14, color: '#333', borderBottom: '1px solid #f0f0f0' },
  check: { color: '#16a34a', fontWeight: 700 },
  cross: { color: '#dc2626', fontWeight: 700 },
  btn: { padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

export default function Assinaturas() {
  const currentPlan = 'Profissional';
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const renderValue = (val: string | boolean) => {
    if (val === true) return <span style={styles.check}>✓</span>;
    if (val === false) return <span style={styles.cross}>✗</span>;
    return <span>{val}</span>;
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Assinatura</h1>

      <div style={styles.card}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Plano Atual</h3>
        <div style={styles.planCard}>
          <span style={{ ...styles.planBadge, background: planColors[currentPlan] }}>{currentPlan}</span>
          <div style={styles.planInfo}>
            <span style={styles.planName}>Plano {currentPlan}</span>
            <span style={styles.planPrice}>{planPrices[currentPlan]} — Renova em 15/08/2026</span>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Uso Atual</h3>
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>24</span>
            <span style={styles.statLabel}>Produtos cadastrados</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>312</span>
            <span style={styles.statLabel}>Pedidos este mês</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>3</span>
            <span style={styles.statLabel}>Usuários ativos</span>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Comparar Planos</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Recurso</th>
              <th style={styles.th}>Start</th>
              <th style={styles.th}>Profissional</th>
              <th style={styles.th}>Premium</th>
            </tr>
          </thead>
          <tbody>
            {features.map(f => (
              <tr key={f.name}>
                <td style={styles.td}>{f.name}</td>
                <td style={styles.td}>{renderValue(f.start)}</td>
                <td style={styles.td}>{renderValue(f.pro)}</td>
                <td style={styles.td}>{renderValue(f.premium)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, marginTop: 8 }}>
          {['Start', 'Profissional', 'Premium'].map(p => (
            <button
              key={p}
              style={{
                ...styles.btn,
                background: p === currentPlan ? '#ccc' : selectedPlan === p ? planColors[p] : '#e5e7eb',
                color: p === currentPlan ? '#888' : selectedPlan === p ? '#fff' : '#333',
                cursor: p === currentPlan ? 'default' : 'pointer',
              }}
              disabled={p === currentPlan}
              onClick={() => setSelectedPlan(p)}
            >
              {p === currentPlan ? 'Plano Atual' : `Mudar para ${p}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
