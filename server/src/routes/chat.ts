import { Router, Request, Response } from 'express'
import { getStoreSetting } from '../repositories/fixtures'

const router = Router()

const responses: { patterns: RegExp[]; reply: string }[] = [
  { patterns: [/oi|ola|olá|bom dia|boa tarde|boa noite|hey|e aí/i], reply: 'Olá! 👋 Bem-vindo ao CardápioPro! Como posso ajudar? Digite "cardápio" para ver nosso menu, "horário" para saber nosso funcionamento, ou "pedido" para acompanhar seu pedido.' },
  { patterns: [/cardapio|menu|o que tem|produtos|comidas|lanches/i], reply: '🍔 Confira nosso cardápio completo em: cardapiopro.com\nTemos hambúrgueres artesanais, acompanhamentos, bebidas e sobremesas!\nQuer ver uma categoria específica?' },
  { patterns: [/hamburguer|burger|x.?salada|x.?bacon|x.?tudo/i], reply: '🍔 Nossos hambúrgueres:\n• X-Burger Simples - R$ 18,90\n• X-Salada - R$ 22,90\n• X-Bacon - R$ 24,90\n• X-Tudo - R$ 32,90\nQual te interessou?' },
  { patterns: [/bebida|refri|coca|suco|agua|água/i], reply: '🥤 Bebidas disponíveis:\n• Coca-Cola Lata - R$ 6,90\n• Suco Natural - R$ 8,90\n• Água Mineral - R$ 4,90\n• Milk Shake - R$ 16,90' },
  { patterns: [/batata|frita|acompanhamento|cebola|cheddar/i], reply: '🍟 Acompanhamentos:\n• Batata Frita - R$ 14,90\n• Batata Cheddar Bacon - R$ 19,90\n• Anéis de Cebola - R$ 12,90' },
  { patterns: [/sobremesa|doce|petit|milk.?shake|sorvete/i], reply: '🍰 Sobremesas:\n• Milk Shake - R$ 16,90\n• Petit Gateau - R$ 22,90' },
  { patterns: [/promoção|promocao|desconto|oferta|combos|economizar/i], reply: '🔥 Promoções ativas!\n• X-Bacon de R$ 26,90 por R$ 24,90\n• Combos especiais com preços imperdíveis!\nAcesse nosso cardápio para ver todas as ofertas!' },
  { patterns: [/horario|funcionamento|aberto|abre|fecha|horas/i], reply: '⏰ Horário de funcionamento:\nSeg-Sáb: 18h às 23h\nDom: 18h às 22h\nFazemos delivery e retirada no balcão!' },
  { patterns: [/endereço|endereco|local|onde fica|fica aonde/i], reply: '📍 Estamos localizados na Rua Exemplo, 123 - Centro.\nTambém entregamos em toda a região!' },
  { patterns: [/entrega|delivery|taxa|frete|demora|tempo/i], reply: '🚚 Delivery:\n• Taxa de entrega: R$ 5,00\n• Grátis acima de R$ 50,00\n• Tempo médio: 30-50 min\n• Retirada no balcão sem taxa!' },
  { patterns: [/pagamento|pagar|pix|cartão|credito|credito|debito|dinheiro/i], reply: '💳 Formas de pagamento:\n• PIX (aprovação na hora ✅)\n• Cartão de Crédito\n• Cartão de Débito\n• Dinheiro' },
  { patterns: [/pedido|status|acompanhar|rastrear|meu pedido|onde esta/i], reply: '📦 Para acompanhar seu pedido, acesse o link enviado no WhatsApp ou nos informe o número do pedido.\nEm caso de dúvidas, chame no WhatsApp (11) 99999-8888!' },
  { patterns: [/contato|telefone|whats|zap|falar|suporte|ajuda/i], reply: '📞 Fale conosco:\nWhatsApp: (11) 99999-8888\nOu nos siga no Instagram @cardapiopro' },
  { patterns: [/fidelidade|pontos|programa|cashback/i], reply: '⭐ Programa de Fidelidade!\nA cada pedido você acumula pontos e cashback!\n• 5% de cashback em cada pedido\n• Troque pontos por recompensas exclusivas\n• Quanto mais pedir, mais vantagens!' },
  { patterns: [/obrigado|valeu|brigado|thanks|tks/i], reply: 'Por nada! 😊 É um prazer ajudar! Se precisar de mais alguma coisa, é só chamar. Bom apetite! 🍔' },
  { patterns: [/tchau|ate mais|ate logo|flw|falou|xau/i], reply: 'Até mais! 🚀 Volte sempre que precisar!' },
]

async function aiReply(message: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY || getStoreSetting(null, 'openai_api_key')
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um atendente de restaurante chamado Cardapinho. Responda de forma simpática e objetiva sobre cardápio, pedidos, horários, etc. Mantenha respostas curtas (máx 200 caracteres).' },
          { role: 'user', content: message }
        ],
        max_tokens: 150,
      }),
    })
    if (!res.ok) return null
    const data: any = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

async function getReply(msg: string): Promise<string> {
  for (const r of responses) {
    if (r.patterns.some(p => p.test(msg))) return r.reply
  }

  const words = msg.split(/\s+/)
  let bestScore = 0
  let bestReply = ''
  for (const r of responses) {
    const allPatterns = r.patterns.map(p => p.source.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)).flat()
    const matchCount = words.filter((w: string) => allPatterns.some((p: string) => p.includes(w) || w.includes(p))).length
    if (matchCount > bestScore) { bestScore = matchCount; bestReply = r.reply }
  }

  if (bestScore > 0) return bestReply

  const ai = await aiReply(msg)
  if (ai) return ai

  return 'Desculpe, não entendi 😅\n\nTente perguntar sobre:\n• 🍔 Cardápio\n• ⏰ Horários\n• 🚚 Delivery\n• 💳 Pagamentos\n• 📞 Contato\n• ⭐ Fidelidade'
}

router.post('/', async (req: Request, res: Response) => {
  const { message } = req.body
  if (!message) { res.status(400).json({ error: 'Mensagem obrigatória' }); return }
  const reply = await getReply(message.toLowerCase().trim())
  res.json({ reply })
})

export default router