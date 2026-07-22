import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'

interface IntegrationConfig {
  key: string
  label: string
  icon: string
  desc: string
  fields: { key: string; label: string; type: string; placeholder: string }[]
}

const integrationDefs: IntegrationConfig[] = [
  {
    key: 'ifood', label: 'iFood', icon: '🍕',
    desc: 'Receba pedidos do iFood automaticamente no painel',
    fields: [
      { key: 'ifood_merchant_id', label: 'ID do Merchant', type: 'text', placeholder: 'Ex: 12345' },
      { key: 'ifood_client_id', label: 'Client ID', type: 'text', placeholder: 'Client ID da API' },
      { key: 'ifood_client_secret', label: 'Client Secret', type: 'password', placeholder: '••••••••' },
    ]
  },
  {
    key: 'mercadopago', label: 'Mercado Pago', icon: '💳',
    desc: 'Pagamento online via Mercado Pago',
    fields: [
      { key: 'mp_access_token', label: 'Access Token', type: 'password', placeholder: 'Seu token de produção' },
      { key: 'mp_public_key', label: 'Public Key', type: 'text', placeholder: 'Chave pública' },
    ]
  },
  {
    key: 'cielo', label: 'Cielo', icon: '💳',
    desc: 'Pagamento via Cielo',
    fields: [
      { key: 'cielo_merchant_id', label: 'Merchant ID', type: 'text', placeholder: 'ID do estabelecimento' },
      { key: 'cielo_merchant_key', label: 'Merchant Key', type: 'password', placeholder: 'Chave da API' },
    ]
  },
  {
    key: 'whatsapp', label: 'WhatsApp Oficial', icon: '📱',
    desc: 'Envio de notificações via WhatsApp Business API',
    fields: [
      { key: 'wa_token', label: 'Token de Acesso', type: 'password', placeholder: 'Token da API' },
      { key: 'wa_phone_id', label: 'Phone Number ID', type: 'text', placeholder: 'ID do número' },
    ]
  },
  {
    key: 'google_analytics', label: 'Google Analytics', icon: '📊',
    desc: 'Rastreie tráfego e conversões',
    fields: [
      { key: 'ga_measurement_id', label: 'Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
    ]
  },
  {
    key: 'facebook_pixel', label: 'Facebook Pixel', icon: '📱',
    desc: 'Pixel para anúncios no Facebook/Instagram',
    fields: [
      { key: 'meta_pixel_id', label: 'Pixel ID', type: 'text', placeholder: '1234567890' },
    ]
  },
  {
    key: 'google_tag_manager', label: 'Google Tag Manager', icon: '🔧',
    desc: 'Gerenciamento de tags e scripts',
    fields: [
      { key: 'gtm_code', label: 'Container ID', type: 'text', placeholder: 'GTM-XXXXXXX' },
    ]
  },
  {
    key: 'bee_delivery', label: 'Bee Delivery', icon: '🐝',
    desc: 'Conecte com entregadores parceiros',
    fields: [
      { key: 'bee_api_key', label: 'API Key', type: 'password', placeholder: 'Chave da API' },
      { key: 'bee_store_id', label: 'Store ID', type: 'text', placeholder: 'ID da loja' },
    ]
  },
  {
    key: 'mottu', label: 'Mottu Entregas', icon: '🏍️',
    desc: 'Logística de entregas Mottu',
    fields: [
      { key: 'mottu_token', label: 'Token', type: 'password', placeholder: 'Token de integração' },
    ]
  },
  {
    key: 'saipos', label: 'Saipos', icon: '📋',
    desc: 'Integração ERP com Saipos',
    fields: [
      { key: 'saipos_token', label: 'Token', type: 'password', placeholder: 'Token da API' },
    ]
  },
  {
    key: 'sischef', label: 'Sischef', icon: '👨‍🍳',
    desc: 'Integração ERP com Sischef',
    fields: [
      { key: 'sischef_token', label: 'Token', type: 'password', placeholder: 'Token da API' },
    ]
  },
  {
    key: 'tef', label: 'TEF (Pagamento na maquininha)', icon: '💳',
    desc: 'Integração com TEF para maquininhas',
    fields: [
      { key: 'tef_endpoint', label: 'Endpoint TEF', type: 'text', placeholder: 'URL do servidor TEF' },
      { key: 'tef_terminal', label: 'Terminal ID', type: 'text', placeholder: 'ID do terminal' },
    ]
  },
]

// Admin router - protected by authMiddleware in index.ts
const adminRouter = Router()

adminRouter.get('/', (_req: Request, res: Response) => {
  const allKeys = integrationDefs.flatMap(i => i.fields.map(f => f.key))
  const rows = dbAll(`SELECT * FROM store_settings WHERE key IN (${allKeys.map(() => '?').join(',')})`, allKeys)
  const values: Record<string, string> = {}
  for (const row of rows) values[row.key] = row.value

  const result = integrationDefs.map(def => {
    const enabled = def.fields.every(f => values[f.key] && values[f.key].length > 0)
    return {
      key: def.key,
      label: def.label,
      icon: def.icon,
      desc: def.desc,
      enabled,
      fields: def.fields.map(f => ({
        ...f,
        value: values[f.key] || '',
      })),
    }
  })
  res.json(result)
})

adminRouter.post('/', (req: Request, res: Response) => {
  const { key, value } = req.body
  if (!key) { res.status(400).json({ error: 'Chave obrigatória' }); return }
  dbRun("INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)", [key, String(value)])
  res.json({ key, value })
})

adminRouter.get('/configs', (_req: Request, res: Response) => {
  res.json(integrationDefs)
})

// Webhook router - public, no auth
const webhookRouter = Router()

webhookRouter.post('/ifood/webhook', (req: Request, res: Response) => {
  const { event, payload } = req.body
  if (!event) { res.status(400).json({ error: 'Evento obrigatório' }); return }

  if (event === 'order.created') {
    const { id, customer, items, total, deliveryAddress } = payload
    const orderId = uuid()
    dbRun(`INSERT INTO orders (id, customer_name, customer_phone, items, subtotal, total, payment_method, payment_status, status, delivery_type, delivery_address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [orderId, customer?.name || 'iFood', customer?.phone || '00000000000',
        JSON.stringify(items.map((i: any) => ({ productId: i.id, productName: i.name, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice }))),
        total, total, 'pix', 'paid', 'pending', 'delivery', deliveryAddress || ''])
  }

  res.json({ received: true })
})

export { adminRouter, webhookRouter }
