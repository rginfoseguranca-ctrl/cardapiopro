import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'

const router = Router()

const CASHBACK_PERCENTAGE = 5 // 5% de cashback por pedido

router.get('/balance/:customerId', (req: Request, res: Response) => {
  const rows = dbAll('SELECT amount FROM cashback_transactions WHERE customer_id = ?', [req.params.customerId])
  const available = rows
    .filter((r: any) => r.status === 'available')
    .reduce((s: number, r: any) => s + r.amount, 0)
  const total = rows.reduce((s: number, r: any) => s + r.amount, 0)
  res.json({ customerId: req.params.customerId, available, total })
})

router.get('/history/:customerId', (req: Request, res: Response) => {
  const rows = dbAll('SELECT * FROM cashback_transactions WHERE customer_id = ? ORDER BY created_at DESC', [req.params.customerId])
  res.json(rows)
})

router.get('/settings', (_req: Request, res: Response) => {
  const row = dbGet("SELECT value FROM store_settings WHERE key = 'cashback_percentage'")
  res.json({ percentage: row ? Number(row.value) : CASHBACK_PERCENTAGE })
})

router.post('/settings', (req: Request, res: Response) => {
  const { percentage } = req.body
  dbRun("INSERT OR REPLACE INTO store_settings (key, value) VALUES ('cashback_percentage', ?)", [String(percentage)])
  const row = dbGet("SELECT value FROM store_settings WHERE key = 'cashback_percentage'")
  res.json({ percentage: Number(row.value) })
})

export default router
