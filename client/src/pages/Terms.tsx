import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="container" style={{ padding: '40px 16px', maxWidth: 700 }}>
      <Link to="/" style={{ color: 'var(--primary)', fontSize: '.9rem', textDecoration: 'none' }}>← Voltar</Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 16, marginBottom: 24 }}>Termos de Uso</h1>

      <div style={{ fontSize: '.9rem', lineHeight: 1.8, color: 'var(--text)' }}>
        <p style={{ marginBottom: 16 }}>
          Ao acessar e utilizar este cardápio digital, você concorda com os seguintes Termos de Uso. Caso não concorde com algum dos termos, por favor, não utilize o serviço.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>1. Descrição do Serviço</h2>
        <p style={{ marginBottom: 16 }}>
          Este é um cardápio digital que permite aos clientes visualizar produtos, realizar pedidos, efetuar pagamentos e acompanhar o status da entrega em tempo real. O serviço é fornecido pelo estabelecimento comercial responsável.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>2. Pedidos e Pagamentos</h2>
        <ul style={{ marginBottom: 16, paddingLeft: 24 }}>
          <li>Todos os preços exibidos incluem impostos quando aplicável</li>
          <li>O pedido só é confirmado após validação do pagamento</li>
          <li>O estabelecimento reserva-se o direito de cancelar pedidos em caso de indisponibilidade de ingredientes</li>
          <li>Formas de pagamento aceitas: PIX, cartão de crédito, cartão de débito, vale refeição/alimentação e dinheiro</li>
          <li>A taxa de entrega, quando aplicável, será informada antes da confirmação do pedido</li>
        </ul>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>3. Entregas</h2>
        <ul style={{ marginBottom: 16, paddingLeft: 24 }}>
          <li>O tempo estimado de entrega é uma approximação e pode variar</li>
          <li>A entrega é realizada dentro da área de cobertura definida pelo estabelecimento</li>
          <li>O cliente é responsável por fornecer dados de entrega corretos</li>
        </ul>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>4. Programa de Fidelidade</h2>
        <p style={{ marginBottom: 16 }}>
          O programa de pontos e cashback é um benefício oferecido pelo estabelecimento. Os pontos e saldo de cashback não têm valor monetário conversível em dinheiro e podem ser alterados ou descontinuados mediante aviso prévio.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>5. Conduta do Usuário</h2>
        <p style={{ marginBottom: 16 }}>
          Ao utilizar o serviço, o usuário compromete-se a: fornecer informações verdadeiras e atualizadas; não utilizar o serviço para fins ilícitos; não tentar comprometer a segurança do sistema.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>6. Limitação de Responsabilidade</h2>
        <p style={{ marginBottom: 16 }}>
          O estabelecimento não se responsabiliza por: falhas de conexão de internet do usuário; indisponibilidade temporária do serviço; erros em informações fornecidas pelo próprio usuário.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>7. Alterações nos Termos</h2>
        <p style={{ marginBottom: 16 }}>
          Estes termos podem ser atualizados a qualquer momento. As alterações entram em vigor imediatamente após a publicação. O uso continuado do serviço após alterações constitui aceitação dos novos termos.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 24, marginBottom: 8 }}>8. Legislação Aplicável</h2>
        <p style={{ marginBottom: 16 }}>
          Estes termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão resolvidas no foro da comarca do estabelecimento comercial.
        </p>

        <p style={{ marginTop: 32, color: 'var(--text-light)', fontSize: '.8rem' }}>
          Última atualização: Julho 2026
        </p>
      </div>
    </div>
  )
}
