import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import path from 'path'
import { dbGet, dbRun } from './database'

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

const _secret = process.env.JWT_SECRET
if (!_secret) {
  console.error('FATAL: JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET no arquivo .env')
  process.exit(1)
}
export const JWT_SECRET: string = _secret

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; storeId?: string }
  storeId?: string
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ error: 'Token não fornecido' }); return }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any
    ;(req as AuthRequest).user = decoded
    ;(req as AuthRequest).storeId = decoded.storeId || 'main'

    if (decoded.must_change_password === 1) {
      const url = req.originalUrl || req.url
      if (!url.includes('/api/auth/change-password')) {
        res.status(403).json({ error: 'Senha temporária. Altere sua senha para continuar.', mustChangePassword: true })
        return
      }
    }

    // Super admin opera globalmente; lojistas ficam escopados à própria loja.
    // O escopo agora é resolvido pelos repositories via req.storeId (sem reescritor SQL).
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthRequest).user
  if (!user || user.role !== 'super_admin') {
    res.status(403).json({ error: 'Acesso restrito ao operador da plataforma' })
    return
  }
  next()
}

// Resolves store context for public routes: valid JWT (non-blocking) wins, then
// x-store-slug header, then store_slug/storeId query params. Leaves global when
// there is no context — repositories default to the legacy 'main' store on writes.
export function resolveStoreScope(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (auth) {
    try {
      const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any
      ;(req as AuthRequest).user = decoded
      ;(req as AuthRequest).storeId = decoded.storeId || 'main'
      next()
      return
    } catch {
      // Invalid token on a public route → treat as unauthenticated
    }
  }

  const slug = (req.headers['x-store-slug'] as string) || (req.query.store_slug as string)
  if (slug) {
    const store = dbGet('SELECT id FROM stores WHERE slug = ?', [slug])
    if (store) {
      ;(req as AuthRequest).storeId = store.id
      next()
      return
    }
  }

  const storeId = (req.query.storeId as string)
  if (storeId) {
    ;(req as AuthRequest).storeId = storeId
    next()
    return
  }

  next()
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => void | Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = fn(req, res, next)
      if (result instanceof Promise) result.catch(next)
    } catch (err) {
      next(err)
    }
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[ERROR]', err.stack || err.message || err)
  const status = (err as any).statusCode || 500
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message || 'Erro interno do servidor'
  })
}

const _idempotencyCache = new Map<string, number>()
setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of _idempotencyCache) {
    if (now - ts > 86400000) _idempotencyCache.delete(key)
  }
}, 600000)

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-idempotency-key'] as string | undefined
  if (!key) { next(); return }

  if (_idempotencyCache.has(key)) {
    res.status(409).json({ error: 'Operação já processada', duplicate: true })
    return
  }

  const originalSend = res.send.bind(res)
  res.send = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      _idempotencyCache.set(key, Date.now())
    }
    return originalSend(body)
  }

  next()
}

const PLAN_LIMITS: Record<string, { maxProducts: number; maxOrdersMonth: number; maxUsers: number }> = {
  start:         { maxProducts: 100,  maxOrdersMonth: 2000,  maxUsers: 2 },
  profissional:  { maxProducts: 500,  maxOrdersMonth: 5000,  maxUsers: 5 },
  premium:       { maxProducts: -1,   maxOrdersMonth: -1,    maxUsers: -1 },
}

export function planLimitMiddleware(resource: 'products' | 'orders' | 'users') {
  return (req: Request, res: Response, next: NextFunction) => {
    const storeId = (req as AuthRequest).storeId || 'main'
    const sub = dbGet('SELECT plan FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1', [storeId])
    const plan = sub?.plan || 'start'
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.start

    if (plan === 'premium') { next(); return }

    if (resource === 'products') {
      const count = dbGet('SELECT COUNT(*) as c FROM products WHERE store_id = ?', [storeId])
      if (count?.c >= limits.maxProducts) {
        res.status(403).json({ error: `Limite de ${limits.maxProducts} produtos atingido. Atualize seu plano.`, limitType: 'products' })
        return
      }
    } else if (resource === 'orders') {
      const count = dbGet("SELECT COUNT(*) as c FROM orders WHERE store_id = ? AND created_at >= DATE('now','start of month')", [storeId])
      if (count?.c >= limits.maxOrdersMonth) {
        res.status(403).json({ error: `Limite de ${limits.maxOrdersMonth} pedidos/mês atingido. Atualize seu plano.`, limitType: 'orders' })
        return
      }
    } else if (resource === 'users') {
      const count = dbGet('SELECT COUNT(*) as c FROM users WHERE store_id = ?', [storeId])
      if (count?.c >= limits.maxUsers) {
        res.status(403).json({ error: `Limite de ${limits.maxUsers} usuários atingido. Atualize seu plano.`, limitType: 'users' })
        return
      }
    }
    next()
  }
}
