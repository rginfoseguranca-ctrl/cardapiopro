import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware'
import { escapeHtml } from '../database'
import {
  createOrder, listOrders, getOrderById, getOrderReceipt,
  updateOrderStatus, markPrinted, updatePaymentStatus,
} from '../services/OrderService'

const router = Router()

function storeId(req: Request): string {
  return (req as AuthRequest).storeId || 'main'
}

function param(req: Request, name: string): string {
  return String((req.params as Record<string, string | undefined>)[name] ?? '')
}

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const since = req.query.since as string | undefined
  res.json(listOrders(storeId(req), since))
})

router.get('/:id', (req: Request, res: Response) => {
  const order = getOrderById(storeId(req), param(req, 'id'))
  if (!order) { res.status(404).json({ error: 'Pedido não encontrado' }); return }
  const { id, status, payment_method, payment_status, delivery_type, table_number, subtotal, discount, delivery_fee, total, scheduled_at, created_at, updated_at, items, printed } = order
  res.json({
    id, status, payment_method, payment_status, delivery_type, table_number, subtotal,
    discount, delivery_fee, total, scheduled_at, created_at, updated_at, items: JSON.parse(order.items || '[]'), printed: !!printed,
  })
})

router.post('/', (req: Request, res: Response) => {
  let order
  try {
    order = createOrder(storeId(req), req.body)
  } catch (err: any) {
    if (err.limitType) {
      res.status(err.statusCode || 403).json({ error: err.message, limitType: err.limitType })
      return
    }
    throw err
  }
  res.status(201).json(order)
})

router.patch('/:id/status', authMiddleware, (req: Request, res: Response) => {
  const { status } = req.body
  const order = updateOrderStatus(storeId(req), param(req, 'id'), status)
  res.json(order)
})

router.patch('/:id/print', authMiddleware, (req: Request, res: Response) => {
  markPrinted(storeId(req), param(req, 'id'))
  res.json({ success: true })
})

router.get('/:id/receipt', (req: Request, res: Response) => {
  const receipt = getOrderReceipt(storeId(req), param(req, 'id'))
  if (!receipt) { res.status(404).json({ error: 'Pedido não encontrado' }); return }

  const { order, store } = receipt
  const storeName = store?.store_name || 'Minha Loja'
  const storeIcon = store?.store_icon || ''
  const items = JSON.parse(order.items || '[]')
  const subtotal = items.reduce((s: number, i: any) => s + (i.unitPrice * i.quantity), 0)
  const total = order.total || subtotal
  const now = new Date(order.created_at).toLocaleString('pt-BR')

  let itemsHtml = items.map((i: any) => {
    let compHtml = ''
    if (i.complements && i.complements.length > 0) {
      compHtml = i.complements.map((g: any) =>
        g.items.map((ci: any) => `<tr><td colspan="3" style="padding-left: 10px; font-size: 10px;">  + ${escapeHtml(ci.name)}${ci.price > 0 ? ` (+R$ ${Number(ci.price).toFixed(2)})` : ''}</td></tr>`).join('')
      ).join('')
    }
    return `<tr><td>${escapeHtml(i.productName)}</td><td class="r">${String(i.quantity).padStart(3, '0')}</td><td class="r">R$ ${(Number(i.unitPrice) * Number(i.quantity)).toFixed(2)}</td></tr>${compHtml}`
  }).join('')

  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comanda - ${storeName}</title><style>
    @page { margin: 0; width: 80mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 11px; width: 80mm; padding: 6px 8px; margin: 0; color: #000; }
    h2 { text-align: center; font-size: 15px; margin: 4px 0; font-weight: 700; }
    .center { text-align: center; }
    .line { border-top: 1px dashed #000; margin: 5px 0; }
    .line-solid { border-top: 1px solid #000; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; vertical-align: top; }
    .r { text-align: right; white-space: nowrap; }
    .total { font-size: 13px; font-weight: bold; }
    .info { font-size: 10px; margin: 2px 0; }
    .no-print { text-align: center; margin-top: 10px; }
    .no-print button { padding: 8px 24px; font-size: 14px; cursor: pointer; background: #e74c3c; color: #fff; border: none; border-radius: 6px; }
    .badge { display: inline-block; padding: 1px 6px; font-size: 9px; font-weight: 700; border-radius: 3px; }
    .badge-pending { background: #fef9e7; color: #d68910; }
    .badge-paid { background: #d5f5e3; color: #27ae60; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style></head><body>
    <h2>${storeIcon} ${escapeHtml(storeName)}</h2>
    <p class="center" style="font-size:10px;margin:2px 0">${order.delivery_type === 'delivery' ? 'ENTREGA' : order.delivery_type === 'mesa' ? 'MESA' : 'BALCÃO'}</p>
    <div class="line"></div>
    <p><strong>Pedido:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
    <p><strong>Cliente:</strong> ${escapeHtml(order.customer_name)}</p>
    <p><strong>Telefone:</strong> ${escapeHtml(order.customer_phone)}</p>
    ${order.delivery_address ? `<p><strong>Endereço:</strong> ${escapeHtml(order.delivery_address)}</p>` : ''}
    ${order.table_number ? `<p><strong>Mesa:</strong> ${order.table_number}</p>` : ''}
    ${order.scheduled_at ? `<p><strong>Agendado:</strong> ${new Date(order.scheduled_at).toLocaleString('pt-BR')}</p>` : ''}
    <p><strong>Pagamento:</strong> ${escapeHtml(order.payment_method)} <span class="badge ${order.payment_status === 'paid' ? 'badge-paid' : 'badge-pending'}">${escapeHtml(order.payment_status)}</span></p>
    ${order.notes ? `<p><strong>Obs:</strong> ${escapeHtml(order.notes)}</p>` : ''}
    <div class="line"></div>
    <table><tr><td><strong>Item</strong></td><td class="r"><strong>Qtd</strong></td><td class="r"><strong>Valor</strong></td></tr>
    ${itemsHtml}
    </table>
    <div class="line-solid"></div>
    <table>
      <tr><td>Subtotal</td><td class="r">R$ ${subtotal.toFixed(2)}</td></tr>
      ${order.discount > 0 ? `<tr><td>Desconto</td><td class="r">-R$ ${Number(order.discount).toFixed(2)}</td></tr>` : ''}
      <tr class="total"><td>TOTAL</td><td class="r">R$ ${total.toFixed(2)}</td></tr>
    </table>
    <div class="line"></div>
    <p class="center" style="font-size:10px">Obrigado pela preferência!</p>
    <p class="center" style="font-size:9px">${now}</p>
    <div class="no-print"><button onclick="window.print()">🖨️ Imprimir Comanda</button></div>
  </body></html>`)
})

router.patch('/:id/payment', authMiddleware, (req: Request, res: Response) => {
  const { paymentStatus } = req.body
  const order = updatePaymentStatus(storeId(req), param(req, 'id'), paymentStatus)
  res.json(order)
})

export default router
