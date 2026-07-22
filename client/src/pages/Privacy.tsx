import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="container" style={{ padding: '40px 16px', maxWidth: 700 }}>
      <Link to="/" style={{ color: 'var(--primary)', fontSize: '.9rem', textDecoration: 'none' }}>← Voltar</Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 16, marginBottom: 24 }}>Política de Privacidade</h1>

      <div style={{ fontSize: '.9rem', lineHeight: 1.8, color: 'var(--text)' }}>
        <p style={{ marginBottom: 16 }}>
          A sua privacidade é importante para nós. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>1. Dados Coletados</h2>
        <p style={{ marginBottom: 12 }}>Coletamos os seguintes dados quando você realiza um pedido:</p>
        <ul style={{ marginBottom: 16, paddingLeft: 24 }}>
          <li>Nome completo</li>
          <li>Número de telefone (WhatsApp)</li>
          <li>Endereço de entrega</li>
          <li>Referência do endereço (quando fornecido)</li>
          <li>Dados de pagamento (processados por parceiros de pagamento seguros)</li>
          <li>Histórico de pedidos</li>
        </ul>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>2. Finalidade do Tratamento</h2>
        <p style={{ marginBottom: 12 }}>Seus dados são utilizados exclusivamente para:</p>
        <ul style={{ marginBottom: 16, paddingLeft: 24 }}>
          <li>Processar e entregar seus pedidos</li>
          <li>Enviar notificações sobre o status do seu pedido</li>
          <li>Gerenciar seu saldo de fidelidade e cashback</li>
          <li>Melhorar a experiência de uso do cardápio digital</li>
          <li>Cumprir obrigações legais e fiscais</li>
        </ul>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>3. Compartilhamento de Dados</h2>
        <p style={{ marginBottom: 16 }}>
          Não vendemos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. Seus dados podem ser compartilhados apenas com: processadores de pagamento (para concretizar transações), serviços de entrega (para realização da entrega), e autoridades públicas (quando exigido por lei).
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>4. Armazenamento e Segurança</h2>
        <p style={{ marginBottom: 16 }}>
          Seus dados são armazenados em servidores seguros com criptografia. Adotamos medidas técnicas e administrativas para proteger suas informações contra acessos não autorizados, alterações, divulgações ou destruição não autorizada.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>5. Seus Direitos (LGPD)</h2>
        <p style={{ marginBottom: 12 }}>Conforme a LGPD, você tem direito a:</p>
        <ul style={{ marginBottom: 16, paddingLeft: 24 }}>
          <li><strong>Confirmação</strong> da existência de tratamento de dados</li>
          <li><strong>Acesso</strong> aos seus dados pessoais</li>
          <li><strong>Correção</strong> de dados incompletos ou desatualizados</li>
          <li><strong>Anonimização, bloqueio ou eliminação</strong> de dados desnecessários</li>
          <li><strong>Portabilidade</strong> dos dados</li>
          <li><strong>Eliminação</strong> dos dados tratados com consentimento</li>
          <li><strong>Revogação do consentimento</strong> a qualquer momento</li>
        </ul>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>6. Retenção de Dados</h2>
        <p style={{ marginBottom: 16 }}>
          Seus dados são retidos pelo tempo necessário para cumprir as finalidades para as quais foram coletados, ou pelo prazo exigido por lei.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>7. Cookies e Tecnologias Similares</h2>
        <p style={{ marginBottom: 16 }}>
          Utilizamos cookies e armazenamento local (localStorage) para manter sua sessão ativa, lembrar itens no carrinho e melhorar a experiência de uso.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>8. Alterações nesta Política</h2>
        <p style={{ marginBottom: 16 }}>
          Esta política pode ser atualizada periodicamente. Recomendamos que você revise esta página regularmente.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>9. Contato</h2>
        <p style={{ marginBottom: 16 }}>
          Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato com o estabelecimento através do canal de atendimento disponível no cardápio digital.
        </p>
      </div>
    </div>
  )
}
