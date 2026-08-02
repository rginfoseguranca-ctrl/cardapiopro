import { Router, Request, Response } from 'express'
import { printersRepository } from '../repositories/printers'
import { ordersRepository } from '../repositories/orders'
import { companySettingsRepository } from '../repositories/fixtures'
import { AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

// Generate kitchen receipt HTML for an order - exported for use in other routes
export function generateKitchenReceipt(order: any, store: any, printerName: string): string {
  const storeName = store?.store_name || 'Minha Loja'
  const storeIcon = store?.store_icon || ''
  const now = new Date(order.created_at).toLocaleString('pt-BR')
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items

  let itemsHtml = items.map((i: any) => {
    let compHtml = ''
    if (i.complements && i.complements.length > 0) {
      compHtml = i.complements.map((g: any) =>
        g.items.map((ci: any) => `<tr><td colspan="3" style="padding-left: 10px; font-size: 10px;">  + ${ci.name}${ci.price > 0 ? ` (+R$ ${ci.price.toFixed(2)})` : ''}</td></tr>`).join('')
      ).join('')
    }
    return `<tr><td>${i.productName}</td><td class="right">${String(i.quantity).padStart(3, '0')}</td><td class="right">R$ ${(i.unitPrice * i.quantity).toFixed(2)}</td></tr>${compHtml}`
  }).join('')

  const typeLabel = order.delivery_type === 'delivery' ? 'ENTREGA' : order.delivery_type === 'mesa' ? `MESA ${order.table_number}` : 'BALCÃO'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comanda Cozinha</title><style>
    @page { margin: 0; width: 80mm; }
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 8px; margin: 0; }
    h2 { text-align: center; font-size: 16px; margin: 4px 0; font-weight: 700; }
    .center { text-align: center; }
    .line { border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 2px 0; text-align: left; }
    .right { text-align: right; }
    .total { font-size: 14px; font-weight: bold; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 3px; background: #e74c3c; color: white; }
    @media print { .no-print { display: none; } }
  </style></head><body>
    <h2>${storeIcon} ${storeName}</h2>
    <p class="center"><span class="badge">${typeLabel}</span></p>
    <div class="line"></div>
    <p><strong>Pedido:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
    <p><strong>Cliente:</strong> ${order.customer_name}</p>
    <p><strong>Telefone:</strong> ${order.customer_phone}</p>
    ${order.delivery_address ? `<p><strong>Endereço:</strong> ${order.delivery_address}</p>` : ''}
    ${order.notes ? `<p><strong>Obs:</strong> ${order.notes}</p>` : ''}
    <div class="line"></div>
    <table><tr><th>Item</th><th class="right">Qtd</th><th class="right">Valor</th></tr>
    ${itemsHtml}
    </table>
    <div class="line"></div>
    <table>
      <tr><td>Subtotal</td><td class="right">R$ ${order.subtotal.toFixed(2)}</td></tr>
      ${order.discount > 0 ? `<tr><td>Desconto</td><td class="right">-R$ ${Number(order.discount).toFixed(2)}</td></tr>` : ''}
      <tr class="total"><td>TOTAL</td><td class="right">R$ ${order.total.toFixed(2)}</td></tr>
    </table>
    <div class="line"></div>
    <p class="center" style="font-size:10px">${now}</p>
    <p class="center no-print" style="margin-top:12px"><button onclick="window.print()">🖨️ Imprimir</button></p>
  </body></html>`
}

router.get('/', (req: Request, res: Response) => {
  const printers = printersRepository.findAll(storeId(req), undefined, [], 'name ASC')
  res.json(printers.map((p: any) => ({ ...p, isActive: !!p.is_active })))
})

router.post('/', (req: Request, res: Response) => {
  const { name, sector } = req.body
  if (!name) { res.status(400).json({ error: 'Nome obrigatório' }); return }
  const printer = printersRepository.insert(storeId(req), {
    id: 'prn_' + Date.now(), name, sector: sector || 'cozinha',
  })
  res.status(201).json({ ...printer, isActive: !!printer.is_active })
})

router.delete('/:id', (req: Request, res: Response) => {
  printersRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

// Print order to kitchen printer
router.post('/order/:orderId/print', (req: Request, res: Response) => {
  const { printerId } = req.body
  if (!printerId) { res.status(400).json({ error: 'ID da impressora obrigatório' }); return }

  const printer = printersRepository.findOne(storeId(req), 'id = ? AND is_active = 1', [String(printerId)])
  if (!printer) { res.status(404).json({ error: 'Impressora não encontrada ou inativa' }); return }

  const order = ordersRepository.findById(storeId(req), String(req.params.orderId))
  if (!order) { res.status(404).json({ error: 'Pedido não encontrado' }); return }

  const store = companySettingsRepository.findById(null, (order as any).store_id || 'main')
  const html = generateKitchenReceipt(order, store, printer.name)

  res.send(html)
})

// Test print endpoint
router.post('/test/:id', (req: Request, res: Response) => {
  const printer = printersRepository.findById(storeId(req), String(req.params.id))
  if (!printer) { res.status(404).json({ error: 'Impressora não encontrada' }); return }

  const sid = storeId(req)
  const store = companySettingsRepository.findById(null, sid ?? 'main')
  const storeName = store?.store_name || 'Minha Loja'
  const storeIcon = store?.store_icon || ''

  const cupom = `
${'='.repeat(32)}
${storeIcon}  ${storeName}
${'='.repeat(32)}

TESTE DE IMPRESSÃO
Impressora: ${printer.name}
Setor: ${printer.sector}

Item                Qtd  Preço
--------------------------------
X-Bacon Simples     001  26,90
Coca-Cola Lata      002   6,90
Batata Frita        001  14,90
--------------------------------
Subtotal:               48,70
Desconto:                0,00
Total:                R$ 48,70
Forma: Dinheiro
Troco: R$ 50,00 - R$ 1,30

${'='.repeat(32)}
Obrigado pela preferência!
${'='.repeat(32)}
Data: ${new Date().toLocaleString('pt-BR')}
  `.trim()

  res.set('Content-Type', 'text/plain; charset=utf-8')
  res.send(cupom)
})

export default router
