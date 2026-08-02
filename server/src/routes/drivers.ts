import { Router, Request, Response } from 'express'
import { deliveryRoutesRepository, driversRepository } from '../repositories/delivery'
import { storeId } from './helpers'

const router = Router()

// ─── Drivers ───
router.get('/', (req: Request, res: Response) => {
  res.json(driversRepository.findAll(storeId(req), undefined, [], 'name'))
})

router.get('/available', (req: Request, res: Response) => {
  res.json(driversRepository.findAll(storeId(req), "status = 'available' AND is_active = 1", [], 'name'))
})

router.post('/', (req: Request, res: Response) => {
  const { name, phone, email, vehicle, plate, document, pixKey, notes } = req.body
  if (!name || !phone) { res.status(400).json({ error: 'Nome e telefone são obrigatórios' }); return }
  const driver = driversRepository.insert(storeId(req), {
    name, phone, email: email || '', vehicle: vehicle || '', plate: plate || '',
    document: document || '', pix_key: pixKey || '', notes: notes || '',
  })
  res.status(201).json(driver)
})

router.put('/:id', (req: Request, res: Response) => {
  const { name, phone, email, vehicle, plate, document, pixKey, status, notes } = req.body
  driversRepository.update(storeId(req), String(req.params.id), {
    name, phone, email: email || '', vehicle: vehicle || '', plate: plate || '',
    document: document || '', pix_key: pixKey || '', status: status || 'available', notes: notes || '',
  })
  res.json({ success: true })
})

router.delete('/:id', (req: Request, res: Response) => {
  driversRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

// ─── Driver Deliveries ───
router.get('/deliveries', (req: Request, res: Response) => {
  const { driverId, status } = req.query as any
  const sid = storeId(req)
  let sql = `SELECT dr.*, d.name as driver_name, d.phone as driver_phone_orig, d.vehicle
    FROM delivery_routes dr
    LEFT JOIN drivers d ON d.name = dr.driver
    WHERE dr.store_id = ?`
  const params: any[] = [sid ?? 'main']
  if (driverId) { sql += ' AND d.id = ?'; params.push(driverId) }
  if (status) { sql += ' AND dr.status = ?'; params.push(status) }
  sql += ' ORDER BY dr.created_at DESC'
  res.json(deliveryRoutesRepository.raw(sid, sql, params))
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
  const sid = storeId(req)
  params.push(sid ?? 'main')
  deliveryRoutesRepository.raw(sid, `UPDATE delivery_routes SET ${updates} WHERE id = ? AND store_id = ?`, params)
  res.json({ success: true })
})

router.get('/performance', (req: Request, res: Response) => {
  const sid = storeId(req)
  const drivers = driversRepository.findAll(sid, 'is_active = 1')
  const statsByDriver = new Map<string, any>()
  for (const row of deliveryRoutesRepository.raw(
    sid,
    `SELECT driver, COUNT(*) as total, SUM(fee) as total_fee, AVG(distance) as avg_distance
     FROM delivery_routes WHERE status = 'delivered' AND store_id = ?
     GROUP BY driver`,
    [sid ?? 'main']
  )) {
    statsByDriver.set(row.driver, { total: row.total, total_fee: row.total_fee, avg_distance: row.avg_distance })
  }
  const result = drivers.map((d: any) => ({ ...d, stats: statsByDriver.get(d.name) || null }))
  res.json(result)
})

export default router
