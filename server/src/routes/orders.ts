import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'
import { notifyAll, notifyOrder } from './notifications'
import { generateKitchenReceipt } from './printers'
import { authMiddleware, AuthRequest } from '../middleware'
import { escapeHtml } from '../database'

// Send WhatsApp confirmation (using wa.me link)
function sendWhatsAppConfirmation(order: any, store: any) {
  if (!store?.whatsapp) return
  
  const phone = store.whatsapp.replace(/\D/g, '')
  const itemsText = order.items.map((i: any) => `${i.quantity}x ${i.productName} - R$ ${(i.unitPrice * i.quantity).toFixed(2)}`).join('%0A')
  const message = encodeURIComponent(
    `Olá! Seu pedido foi confirmado!%0A%0A` +
    `📋 Pedido: #${order.id.slice(0, 8)}%0A` +
    `${itemsText}%0A` +
    `Total: R$ ${order.total.toFixed(2)}%0A` +
    `Pagamento: ${order.payment_method}%0A%0A` +
    `Obrigado pela preferência!`
  )
  
  const waLink = `https://wa.me/${phone}?text=${message}`
  return waLink
}

// Check if store is open based on opening_hours setting
function isStoreOpen(storeId: string = 'main'): boolean {
  const store = dbGet('SELECT opening_hours FROM company_settings WHERE id = ?', [storeId])
  if (!store || !store.opening_hours) return true // If not configured, assume open
  
  try {
    const hours = JSON.parse(store.opening_hours)
    if (Object.keys(hours).length === 0) return true
    
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = dayNames[now.getDay()]
    const todayHours = hours[today]
    
    if (!todayHours || todayHours.closed) return false
    
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [openH, openM] = todayHours.open.split(':').map(Number)
    const [closeH, closeM] = todayHours.close.split(':').map(Number)
    const openTime = openH * 60 + openM
    const closeTime = closeH * 60 + closeM
    
    return currentTime >= openTime && currentTime < closeTime
  } catch {
    return true
  }
}

const router = Router()

// Helper function to decrement inventory based on order items
function decrementInventory(items: any[]) {
  for (const item of items) {
    const recipeItems = dbAll('SELECT * FROM recipe_items WHERE product_id = ?', [item.productId])
    for (const recipeItem of recipeItems) {
      if (!recipeItem.supply_id) continue
      const quantityNeeded = recipeItem.quantity * item.quantity
      dbRun('UPDATE supplies SET quantity = quantity - ? WHERE id = ?', [quantityNeeded, recipeItem.supply_id])
      dbRun(
        'INSERT INTO supply_movements (id, supply_id, type, quantity, description) VALUES (?, ?, ?, ?, ?)',
        ['mov_' + uuid(), recipeItem.supply_id, 'out', quantityNeeded, `Pedido ${item.productName} x${item.quantity}`]
      )
    }
  }
}

router.get('/', authMiddleware, (_req: Request, res: Response) => {
  const orders = dbAll('SELECT * FROM orders ORDER BY created_at DESC')
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items), printed: !!o.printed })))
})

router.get('/:id', (req: Request, res: Response) => {
  const order = dbGet('SELECT * FROM orders WHERE id = ?', [req.params.id])
  if (!order) { res.status(404).json({ error: 'Pedido não encontrado' }); return }
  res.json({ ...order, items: JSON.parse(order.items), printed: !!order.printed })
})

router.post('/', (req: Request, res: Response) => {
  const { customerName, customerPhone, items, paymentMethod, paymentStatus, deliveryType, deliveryAddress, deliveryFee, tableNumber, notes, scheduledAt, couponCode, couponDiscount } = req.body

  if (!customerName || !customerPhone || !items?.length || !paymentMethod) {
    res.status(400).json({ error: 'Dados obrigatórios faltando' })
    return
  }

  const storeId = (req as AuthRequest).storeId || 'main'

  // Check if store is open (except for scheduled orders)
  if (!scheduledAt && !isStoreOpen(storeId)) {
    res.status(400).json({ error: 'Loja fechada no momento. Pedidos só podem ser feitos no horário de funcionamento.' })
    return
  }

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0)
  const discount = couponDiscount || 0
  const fee = deliveryFee || 0
  const total = subtotal + fee - discount

  // Get or create customer first
  let customer = dbGet('SELECT id FROM customers WHERE phone = ?', [customerPhone])
  let customerId: string
  if (customer) {
    customerId = customer.id
    dbRun('UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ?, last_order_at = datetime("now") WHERE id = ?', [total, customerId])
  } else {
    customerId = uuid()
    dbRun('INSERT INTO customers (id, name, phone, total_orders, total_spent, last_order_at) VALUES (?, ?, ?, 1, ?, datetime("now"))', [customerId, customerName, customerPhone, total])
  }

  const id = uuid()
  const now = new Date().toISOString()

  dbRun(
    `INSERT INTO orders (id, customer_id, customer_name, customer_phone, items, subtotal, discount, delivery_fee, total, payment_method, payment_status, status, delivery_type, delivery_address, table_number, notes, scheduled_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, customerId, customerName, customerPhone, JSON.stringify(items), subtotal, discount, fee, total, paymentMethod, paymentStatus || 'pending', 'pending', deliveryType || 'pickup', deliveryAddress || '', tableNumber || null, notes || '', scheduledAt || null, now, now]
  )

  const order = dbGet('SELECT * FROM orders WHERE id = ?', [id])

  // Decrement inventory
  try {
    decrementInventory(items)
  } catch (err) {
    console.error('Error decrementing inventory:', err)
  }

  notifyAll({ type: 'new_order', order: { id, customerName, total, paymentMethod, deliveryType } })

  // Send WhatsApp confirmation
  try {
    const store = dbGet('SELECT * FROM company_settings WHERE id = ?', [storeId])
    if (store?.whatsapp) {
      const itemsText = items.map((i: any) => `${i.quantity}x ${i.productName} - R$ ${(i.unitPrice * i.quantity).toFixed(2)}`).join('\n')
      const msg = encodeURIComponent(
        `Olá ${customerName}! Seu pedido foi confirmado. 🎉\n\n` +
        `📋 Pedido: #${id.slice(0, 8).toUpperCase()}\n` +
        `${itemsText}\n` +
        `\n💰 Total: R$ ${total.toFixed(2)}\n` +
        `💳 Pagamento: ${paymentMethod}\n` +
        `\nObrigado pela preferência! ${store.store_name || ''}`
      )
      const waLink = `https://wa.me/${store.whatsapp.replace(/\D/g, '')}?text=${msg}`
    }
  } catch (err) {
    console.error('WhatsApp confirmation error:', err)
  }

  // Award loyalty points on order creation
  try {
    const loyaltySetting = dbGet("SELECT value FROM store_settings WHERE key = 'loyalty_points_per_real'")
    const pointsPerReal = loyaltySetting ? parseFloat(loyaltySetting.value) : 1
    const pointsEarned = Math.floor(total * pointsPerReal)
    
    if (pointsEarned > 0 && customerId) {
      dbRun('INSERT INTO loyalty_points (id, customer_id, order_id, points, description) VALUES (?, ?, ?, ?, ?)',
        ['lp_' + uuid(), customerId, id, pointsEarned, `Pedido #${id.slice(0,8)}`])
    }
  } catch (err) {
    console.error('Loyalty points error:', err)
  }

  // Award cashback on order creation (configurable)
  try {
    const cashbackSetting = dbGet("SELECT value FROM store_settings WHERE key = 'cashback_on_create'")
    const cashbackOnCreate = cashbackSetting ? parseInt(cashbackSetting.value) === 1 : false
    
    if (cashbackOnCreate && customerId) {
      const cashbackPctRow = dbGet("SELECT value FROM store_settings WHERE key = 'cashback_percentage'")
      const pct = cashbackPctRow ? parseFloat(cashbackPctRow.value) : 5
      const cashbackAmount = total * (pct / 100)
      
      dbRun('INSERT INTO cashback_transactions (id, customer_id, order_id, amount, status) VALUES (?, ?, ?, ?, ?)',
          ['cb_' + uuid(), customerId, id, cashbackAmount, 'available'])
    }
  } catch (err) {
    console.error('Cashback error:', err)
  }

  // Auto-print to kitchen printer
  try {
    const kitchenPrinter = dbGet("SELECT id, name FROM printers WHERE sector = 'cozinha' AND is_active = 1 LIMIT 1")
      if (kitchenPrinter) {
      const store = dbGet('SELECT * FROM company_settings WHERE id = ?', [storeId])
      const receiptHtml = generateKitchenReceipt(order, store, kitchenPrinter.name)
      dbRun('UPDATE orders SET printed = 1 WHERE id = ?', [id])
    }
  } catch (err) {
    console.error('Auto-print error:', err)
  }

  res.status(201).json({ ...order, items: JSON.parse(order.items), printed: !!order.printed })
})

router.patch('/:id/status', authMiddleware, (req: Request, res: Response) => {
  const { status } = req.body
  const valid = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
  if (!valid.includes(status)) {
    res.status(400).json({ error: 'Status inválido' }); return
  }
  dbRun('UPDATE orders SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, req.params.id])

  // Award cashback when delivered
  if (status === 'delivered') {
    const row = dbGet("SELECT value FROM store_settings WHERE key = 'cashback_percentage'")
    const pct = row ? Number(row.value) : 5
    const order = dbGet('SELECT * FROM orders WHERE id = ?', [req.params.id])
    if (order) {
      const customer = dbGet('SELECT id FROM customers WHERE phone = ?', [order.customer_phone])
      if (customer) {
        const cashbackAmount = order.total * (pct / 100)
        dbRun('INSERT INTO cashback_transactions (id, customer_id, order_id, amount, status) VALUES (?, ?, ?, ?, ?)',
          ['cb_' + uuid(), customer.id, req.params.id, cashbackAmount, 'available'])
      }
    }
  }

  const order = dbGet('SELECT * FROM orders WHERE id = ?', [req.params.id])
  if (!order) { res.status(404).json({ error: 'Pedido não encontrado' }); return }
  
  // Notify real-time clients
  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  notifyOrder(orderId, { type: 'status_update', order: { ...order, items: JSON.parse(order.items), printed: !!order.printed } })
  
  res.json({ ...order, items: JSON.parse(order.items), printed: !!order.printed })
})

router.patch('/:id/print', authMiddleware, (req: Request, res: Response) => {
  dbRun('UPDATE orders SET printed = 1 WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

router.get('/:id/receipt', (req: Request, res: Response) => {
  const order = dbGet('SELECT * FROM orders WHERE id = ?', [req.params.id])
  if (!order) { res.status(404).json({ error: 'Pedido não encontrado' }); return }

  const store = dbGet('SELECT * FROM company_settings WHERE id = ?', [(req as AuthRequest).storeId || 'main'])
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
        g.items.map((ci: any) => `<tr><td colspan="3" style="padding-left: 10px; font-size: 10px;">  + ${ci.name}${ci.price > 0 ? ` (+R$ ${ci.price.toFixed(2)})` : ''}</td></tr>`).join('')
      ).join('')
    }
    return `<tr><td>${i.productName}</td><td class="r">${String(i.quantity).padStart(3, '0')}</td><td class="r">R$ ${(i.unitPrice * i.quantity).toFixed(2)}</td></tr>${compHtml}`
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
    <p><strong>Pagamento:</strong> ${escapeHtml(order.payment_method)} <span class="badge ${order.payment_status === 'paid' ? 'badge-paid' : 'badge-pending'}">${order.payment_status}</span></p>
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
  dbRun('UPDATE orders SET payment_status = ?, updated_at = datetime("now") WHERE id = ?', [paymentStatus, req.params.id])
  const order = dbGet('SELECT * FROM orders WHERE id = ?', [req.params.id])
  if (!order) { res.status(404).json({ error: 'Pedido não encontrado' }); return }
  res.json({ ...order, items: JSON.parse(order.items), printed: !!order.printed })
})

export default router
