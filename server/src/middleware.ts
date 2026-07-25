import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import path from 'path'

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

    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthRequest).user
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito a administradores' })
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

const PLAN_LIMITS: Record<string, { maxProducts: number; maxOrdersMonth: number; maxUsers: number }> = {
  start:         { maxProducts: 100,  maxOrdersMonth: 2000,  maxUsers: 2 },
  profissional:  { maxProducts: 500,  maxOrdersMonth: 5000,  maxUsers: 5 },
  premium:       { maxProducts: -1,   maxOrdersMonth: -1,    maxUsers: -1 },
}

export function planLimitMiddleware(resource: 'products' | 'orders' | 'users') {
  return (req: Request, res: Response, next: NextFunction) => {
    const storeId = (req as AuthRequest).storeId || 'main'
    const sub = require('../database').dbGet('SELECT plan FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1', [storeId])
    const plan = sub?.plan || 'start'
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.start

    if (plan === 'premium') { next(); return }

    const db = require('../database')
    if (resource === 'products') {
      const count = db.dbGet('SELECT COUNT(*) as c FROM products WHERE store_id = ?', [storeId])
      if (count?.c >= limits.maxProducts) {
        res.status(403).json({ error: `Limite de ${limits.maxProducts} produtos atingido. Atualize seu plano.`, limitType: 'products' })
        return
      }
    } else if (resource === 'orders') {
      const count = db.dbGet("SELECT COUNT(*) as c FROM orders WHERE store_id = ? AND created_at >= DATE('now','start of month')", [storeId])
      if (count?.c >= limits.maxOrdersMonth) {
        res.status(403).json({ error: `Limite de ${limits.maxOrdersMonth} pedidos/mês atingido. Atualize seu plano.`, limitType: 'orders' })
        return
      }
    } else if (resource === 'users') {
      const count = db.dbGet('SELECT COUNT(*) as c FROM users WHERE store_id = ?', [storeId])
      if (count?.c >= limits.maxUsers) {
        res.status(403).json({ error: `Limite de ${limits.maxUsers} usuários atingido. Atualize seu plano.`, limitType: 'users' })
        return
      }
    }
    next()
  }
}
