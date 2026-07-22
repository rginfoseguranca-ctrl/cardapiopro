import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'

const router = Router()

// ─── Drivers ───
router.get('/', (_req: Request, res: Response) => {
  res.json(dbAll('SELECT * FROM drivers ORDER BY name'))
})

router.get('/available', (_req: Request, res: Response) => {
  res.json(dbAll("SELECT * FROM drivers WHERE status = 'available' AND is_active = 1 ORDER BY name"))
})

router.post('/', (req: Request, res: Response) => {
  const { name, phone, email, vehicle, plate, document, pixKey, notes } = req.body
  if (!name || !phone) { res.status(400).json({ error: 'Nome e telefone são obrigatórios' }); return }
  const id = uuid()
  dbRun(`INSERT INTO drivers (id, name, phone, email, vehicle, plate, document, pix_key, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, phone, email || '', vehicle || '', plate || '', document || '', pixKey || '', notes || ''])
  const driver = dbGet('SELECT * FROM drivers WHERE id = ?', [id])
  res.status(201).json(driver)
})

router.put('/:id', (req: Request, res: Response) => {
  const { name, phone, email, vehicle, plate, document, pixKey, status, notes } = req.body
  dbRun(`UPDATE drivers SET name=?, phone=?, email=?, vehicle=?, plate=?, document=?, pix_key=?, status=?, notes=? WHERE id=?`,
    [name, phone, email || '', vehicle || '', plate || '', document || '', pixKey || '', status || 'available', notes || '', req.params.id])
  res.json({ success: true })
})

router.delete('/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM drivers WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

// ─── Driver Deliveries ───
router.get('/deliveries', (req: Request, res: Response) => {
  const { driverId, status } = req.query as any
  let sql = `SELECT dr.*, d.name as driver_name, d.phone as driver_phone_orig, d.vehicle
    FROM delivery_routes dr
    LEFT JOIN drivers d ON d.name = dr.driver
    WHERE 1=1`
  const params: any[] = []
  if (driverId) { sql += ' AND d.id = ?'; params.push(driverId) }
  if (status) { sql += ' AND dr.status = ?'; params.push(status) }
  sql += ' ORDER BY dr.created_at DESC'
  res.json(dbAll(sql, params))
})

router.patch('/deliveries/:id/status', (req: Request, res: Response) => {
  const { status, driver } = req.body
  const now = new Date().toISOString()
  let updates = 'status = ?'
  const params: any[] = [status]
  if (status === 'in_progress') { updates += ', started_at = ?'; params.push(now) }
  if (status === 'delivered') { updates += ', delivered_at = ?'; params.push(now) }
  if (driver) { updates += ', driver = ?'; params.push(driver) }
  params.push(req.params.id)
  dbRun(`UPDATE delivery_routes SET ${updates} WHERE id = ?`, params)
  res.json({ success: true })
})

router.get('/performance', (_req: Request, res: Response) => {
  const drivers = dbAll('SELECT * FROM drivers WHERE is_active = 1')
  const result = drivers.map((d: any) => {
    const stats = dbGet(`SELECT COUNT(*) as total, SUM(fee) as total_fee, AVG(distance) as avg_distance FROM delivery_routes WHERE driver = ? AND status = 'delivered'`, [d.name])
    return { ...d, stats }
  })
  res.json(result)
})

export default router