import { Request } from 'express'
import { AuthRequest } from '../middleware'

export function storeId(req: Request): string {
  return (req as AuthRequest).storeId || 'main'
}

export function param(req: Request, name: string): string {
  return String((req.params as Record<string, string | undefined>)[name] ?? '')
}
