import { Router, Request, Response } from 'express'
import { AuthRequest } from '../middleware'

const router = Router()

interface OrderStream { storeId?: string; set: Set<Response> }
const orderStreams: Map<string, OrderStream> = new Map()
const globalClients: Map<Response, string> = new Map() // res -> storeId (KDS escopado por loja)

function getOrderStream(orderId: string, storeId?: string): OrderStream {
  if (!orderStreams.has(orderId)) {
    orderStreams.set(orderId, { storeId, set: new Set() })
  }
  return orderStreams.get(orderId)!
}

function sanitizeForPublic(data: any) {
  if (!data || typeof data !== 'object' || !data.order || typeof data.order !== 'object') return data
  const { customerName, customerPhone, customer_id, delivery_address, notes, items, ...rest } = data.order
  return { ...data, order: rest }
}

function writeSafely(set: Set<Response>, msg: string) {
  set.forEach(res => {
    try { res.write(msg) } catch { set.delete(res) }
  })
}

export function notifyOrder(orderId: string, data: object, storeId?: string) {
  const msg = `data: ${JSON.stringify(data)}\n\n`
  const stream = getOrderStream(orderId, storeId)
  writeSafely(stream.set, msg)
}

export function notifyAll(data: object, storeId?: string) {
  // Todos os streams recebem o payload sanitizado (sem PII).
  const msg = `data: ${JSON.stringify(sanitizeForPublic(data))}\n\n`
  // Order-specific streams — filtrados por loja (null não recebe nada quando há contexto).
  orderStreams.forEach((stream) => {
    if (storeId == null || stream.storeId !== storeId) return
    writeSafely(stream.set, msg)
  })
  // Global stream clients (KDS) — escopados por loja.
  globalClients.forEach((resStoreId, res) => {
    if (storeId == null || resStoreId !== storeId) return
    try { res.write(msg) } catch { globalClients.delete(res) }
  })
}

router.get('/stream', (req: Request, res: Response) => {
  const storeId = (req as AuthRequest).storeId || 'main'
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

  globalClients.set(res, storeId)

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
  const storeId = (req as AuthRequest).storeId
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write(`data: ${JSON.stringify({ type: 'connected', orderId })}\n\n`)

  const stream = getOrderStream(orderId, storeId)
  stream.set.add(res)

  const keepAlive = setInterval(() => {
    try { res.write(': keepalive\n\n') } catch { clearInterval(keepAlive) }
  }, 30000)

  req.on('close', () => {
    clearInterval(keepAlive)
    stream.set.delete(res)
    if (stream.set.size === 0) {
      orderStreams.delete(orderId)
    }
  })
})

export default router
