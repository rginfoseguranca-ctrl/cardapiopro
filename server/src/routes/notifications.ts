import { Router, Request, Response } from 'express'

const router = Router()

const clients: Map<string, Set<Response>> = new Map()
const globalClients: Set<Response> = new Set()

function getClients(orderId: string): Set<Response> {
  if (!clients.has(orderId)) {
    clients.set(orderId, new Set())
  }
  return clients.get(orderId)!
}

function sanitizeForPublic(data: any) {
  if (!data || typeof data !== 'object' || !data.order || typeof data.order !== 'object') return data
  const { customerName, customerPhone, customer_id, delivery_address, notes, items, ...rest } = data.order
  return { ...data, order: rest }
}

export function notifyOrder(orderId: string, data: object) {
  const msg = `data: ${JSON.stringify(data)}\n\n`
  const orderClients = getClients(orderId)
  orderClients.forEach(res => {
    try { res.write(msg) } catch { orderClients.delete(res) }
  })
}

export function notifyAll(data: object) {
  const msg = `data: ${JSON.stringify(data)}\n\n`
  // Send to order-specific clients
  clients.forEach((orderClients) => {
    orderClients.forEach(res => {
      try { res.write(msg) } catch { orderClients.delete(res) }
    })
  })
  // Send to global stream clients (KDS) — PII redacted
  const sanitized = sanitizeForPublic(data)
  const sanitizedMsg = `data: ${JSON.stringify(sanitized)}\n\n`
  globalClients.forEach(res => {
    try { res.write(sanitizedMsg) } catch { globalClients.delete(res) }
  })
}

router.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

  globalClients.add(res)

  const keepAlive = setInterval(() => {
    try { res.write(': keepalive\n\n') } catch { clearInterval(keepAlive) }
  }, 30000)

  req.on('close', () => {
    clearInterval(keepAlive)
    globalClients.delete(res)
  })
})

router.get('/order/:id/stream', (req: Request, res: Response) => {
  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write(`data: ${JSON.stringify({ type: 'connected', orderId })}\n\n`)
  
  const orderClients = getClients(orderId)
  orderClients.add(res)
  
  const keepAlive = setInterval(() => {
    try { res.write(': keepalive\n\n') } catch { clearInterval(keepAlive) }
  }, 30000)

  req.on('close', () => {
    clearInterval(keepAlive)
    orderClients.delete(res)
    if (orderClients.size === 0) {
      clients.delete(orderId)
    }
  })
})

export default router
