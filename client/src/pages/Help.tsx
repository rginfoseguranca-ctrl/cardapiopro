import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStoreSettings, type StoreSettings } from '../api/client'

export default function Help() {
  const { data: settings } = useQuery<StoreSettings>({ queryKey: ['storeSettings'], queryFn: getStoreSettings })
  const whatsapp = settings?.whatsapp || '(11) 99999-8888'
  const instagram = settings?.storeName || 'CardápioPro'

  return (
    <div className="container" style={{ padding: '32px 0' }}>
      <Link to="/" className="btn btn-outline btn-sm" style={{ marginBottom: 20 }}>← Cardápio</Link>

      <div className="card" style={{ padding: 32 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>❓ Ajuda</h1>

        {[
          {
            q: 'Como faço um pedido?',
            a: 'Navegue pelo cardápio, adicione os produtos desejados à sacola e clique em "Finalizar Pedido". Preencha seus dados e escolha a forma de pagamento.'
          },
          {
            q: 'Quanto tempo demora?',
            a: 'O preparo leva em média 20 a 30 minutos. Você pode acompanhar o status do seu pedido em tempo real pela página de acompanhamento.'
          },
          {
            q: 'Como funciona a retirada?',
            a: 'Selecione "Retirada" no checkout. Seu pedido ficará pronto na loja e você será notificado quando estiver disponível.'
          },
          {
            q: 'Fazem delivery?',
            a: 'Sim! Entregamos em toda a região central. A taxa de entrega varia dependendo da distância.'
          },
          {
            q: 'Quais formas de pagamento?',
            a: 'Aceitamos PIX, cartão de crédito, débito e dinheiro. No PIX, o pagamento é confirmado na hora!'
          },
          {
            q: 'Como funciona o PIX?',
            a: 'Após finalizar o pedido, você receberá a chave PIX para pagamento. Assim que confirmado, seu pedido entra em preparo.'
          },
          {
            q: 'Posso cancelar um pedido?',
            a: 'Sim, entre em contato conosco pelo WhatsApp para solicitar o cancelamento. Pedidos já em preparo não podem ser cancelados.'
          },
          {
            q: 'Como falar com a gente?',
            a: `Use o chat no canto inferior direito, nos envie uma mensagem no WhatsApp (${whatsapp}) ou entre em contato peloInstagram @${instagram}.`
          }
        ].map((faq, i) => (
          <details key={i} style={{ marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <summary style={{ fontWeight: 600, cursor: 'pointer', padding: '8px 0', fontSize: '.95rem' }}>
              {faq.q}
            </summary>
            <p style={{ padding: '8px 0 12px', color: 'var(--text-light)', lineHeight: 1.6, fontSize: '.9rem' }}>
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  )
}
