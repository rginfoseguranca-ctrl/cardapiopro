import { useState } from 'react';

interface Printer {
  id: string;
  name: string;
  sector: string;
  ip: string;
  active: boolean;
}

const sectors = ['Cozinha', 'Balcão', 'Bar'];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, sans-serif', background: '#f5f5f5', minHeight: '100vh' },
  title: { fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  tabs: { display: 'flex', gap: 0, borderBottom: '2px solid #eee' },
  tab: { padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#888', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -2, transition: 'all .2s' },
  tabActive: { color: '#2563eb', borderBottomColor: '#2563eb' },
  formRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const, alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6, flex: '1 1 180px' },
  label: { fontSize: 13, fontWeight: 600, color: '#555' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  select: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  btn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' },
  printerList: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  printerItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f9fafb', borderRadius: 10 },
  printerInfo: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  printerName: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
  printerSector: { fontSize: 12, color: '#888' },
  btnDelete: { padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  sectorList: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  sectorItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f9fafb', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#333' },
  sectorBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#dbeafe', color: '#2563eb' },
  toggleRow: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  toggleItem: { display: 'flex', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 14, color: '#444', fontWeight: 500 },
  toggle: { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative' as const, transition: 'background .2s' },
  toggleOn: { background: '#2563eb' },
  toggleOff: { background: '#ccc' },
  toggleCircle: { width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute' as const, top: 3, transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.15)' },
};

const initialPrinters: Printer[] = [
  { id: '1', name: 'Epson Térmica', sector: 'Cozinha', ip: '192.168.1.100', active: true },
  { id: '2', name: 'Bematech', sector: 'Balcão', ip: '192.168.1.101', active: true },
];

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div style={styles.toggleItem}>
      <button style={{ ...styles.toggle, ...(checked ? styles.toggleOn : styles.toggleOff) }} onClick={onChange}>
        <div style={{ ...styles.toggleCircle, left: checked ? 23 : 3 }} />
      </button>
      <span style={styles.toggleLabel}>{label}</span>
    </div>
  );
}

export default function ImpressoraConfig() {
  const [activeTab, setActiveTab] = useState<'vincular' | 'setores' | 'config'>('vincular');
  const [printers, setPrinters] = useState<Printer[]>(initialPrinters);
  const [printerName, setPrinterName] = useState('');
  const [printerSector, setPrinterSector] = useState('Cozinha');
  const [printerIp, setPrinterIp] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showCustomerName, setShowCustomerName] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [autoPrint, setAutoPrint] = useState(true);
  const [printCopies, setPrintCopies] = useState('1');

  const handleAddPrinter = () => {
    if (!printerName) return;
    setPrinters([...printers, {
      id: Date.now().toString(),
      name: printerName,
      sector: printerSector,
      ip: printerIp,
      active: true,
    }]);
    setPrinterName('');
    setPrinterIp('');
    setPrinterSector('Cozinha');
  };

  const handleRemovePrinter = (id: string) => {
    setPrinters(printers.filter(p => p.id !== id));
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Configuração de Impressão</h1>

      <div style={styles.card}>
        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(activeTab === 'vincular' ? styles.tabActive : {}) }} onClick={() => setActiveTab('vincular')}>Vincular</button>
          <button style={{ ...styles.tab, ...(activeTab === 'setores' ? styles.tabActive : {}) }} onClick={() => setActiveTab('setores')}>Setores de Impressão</button>
          <button style={{ ...styles.tab, ...(activeTab === 'config' ? styles.tabActive : {}) }} onClick={() => setActiveTab('config')}>Configurações</button>
        </div>

        {activeTab === 'vincular' && (
          <>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Adicionar Impressora</h3>
            <div style={styles.formRow}>
              <div style={styles.field}>
                <label style={styles.label}>Nome</label>
                <input style={styles.input} value={printerName} onChange={e => setPrinterName(e.target.value)} placeholder="Ex: Epson Térmica" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Setor</label>
                <select style={styles.select} value={printerSector} onChange={e => setPrinterSector(e.target.value)}>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>IP</label>
                <input style={styles.input} value={printerIp} onChange={e => setPrinterIp(e.target.value)} placeholder="192.168.1.100" />
              </div>
              <button style={styles.btn} onClick={handleAddPrinter}>Adicionar</button>
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Impressoras Vinculadas</h3>
            <div style={styles.printerList}>
              {printers.map(p => (
                <div key={p.id} style={styles.printerItem}>
                  <div style={styles.printerInfo}>
                    <span style={styles.printerName}>{p.name}</span>
                    <span style={styles.printerSector}>{p.sector} — {p.ip}</span>
                  </div>
                  <button style={styles.btnDelete} onClick={() => handleRemovePrinter(p.id)}>Remover</button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'setores' && (
          <>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Setores de Impressão</h3>
            <div style={styles.sectorList}>
              {sectors.map(s => {
                const count = printers.filter(p => p.sector === s).length;
                return (
                  <div key={s} style={styles.sectorItem}>
                    <span>{s}</span>
                    <span style={styles.sectorBadge}>{count} impressora{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'config' && (
          <>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Opções de Impressão</h3>
            <div style={styles.toggleRow}>
              <Toggle label="Imprimir logo" checked={showLogo} onChange={() => setShowLogo(!showLogo)} />
              <Toggle label="Imprimir QR Code" checked={showQr} onChange={() => setShowQr(!showQr)} />
              <Toggle label="Exibir nome do cliente" checked={showCustomerName} onChange={() => setShowCustomerName(!showCustomerName)} />
              <Toggle label="Exibir itens do pedido" checked={showItems} onChange={() => setShowItems(!showItems)} />
              <Toggle label="Impressão automática" checked={autoPrint} onChange={() => setAutoPrint(!autoPrint)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Número de Cópias</label>
              <input style={{ ...styles.input, maxWidth: 100 }} type="number" min="1" max="5" value={printCopies} onChange={e => setPrintCopies(e.target.value)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
