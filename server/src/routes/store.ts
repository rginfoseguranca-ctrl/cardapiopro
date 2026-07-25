import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { dbGet, dbRun } from '../database'
import { authMiddleware, AuthRequest } from '../middleware'

const router = Router()

// Generate BR Code (PIX) payload
function generatePixPayload(pixKey: string, merchantName: string, merchantCity: string, amount: number, txid: string): string {
  // BR Code format (simplified EMVCo)
  const format = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0')
    return `${id}${len}${value}`
  }
  
  const crc16 = (str: string): string => {
    let crc = 0xFFFF
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) crc = (crc << 1) ^ 0x1021
        else crc <<= 1
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
  }

  const payload = 
    format('00', '01') + // Payload Format Indicator
    format('26', // Merchant Account Information
      format('00', 'br.gov.bcb.pix') + // GUI
      format('01', pixKey) // PIX Key
    ) +
    format('52', '0000') + // Merchant Category Code
    format('53', '986') + // Transaction Currency (BRL)
    format('54', amount.toFixed(2)) + // Transaction Amount
    format('58', 'BR') + // Country Code
    format('59', merchantName.slice(0, 25)) + // Merchant Name
    format('60', merchantCity.slice(0, 15)) + // Merchant City
    format('62', format('05', txid)) + // Additional Data Field (txid)
    '6304' // CRC placeholder
  
  const crc = crc16(payload + '6304')
  return payload + crc
}

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', '..', 'client', 'dist', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `logo_${Date.now()}${ext}`)
  }
})
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_EXTS.includes(ext)) { cb(new Error('Tipo de arquivo não permitido. Use: jpg, png, gif, webp') as any); return }
  if (!file.mimetype.startsWith('image/')) { cb(new Error('Apenas imagens são permitidas') as any); return }
  cb(null, true)
} })

router.get('/', (req: Request, res: Response) => {
  const storeId = (req as AuthRequest).storeId || (req.query.storeId as string) || 'main'
  const settings = dbGet('SELECT * FROM company_settings WHERE id = ?', [storeId])
  if (!settings) {
    res.json({
      storeName: 'Minha Loja', storeIcon: '🍔',
      primaryColor: '#e74c3c', primaryDark: '#c0392b',
      paymentPixKey: '', paymentPixName: '', paymentCardInfo: '', paymentCashInfo: '',
      footerText: '', schedulingEnabled: false,
      logoUrl: '', whatsapp: '', openingHours: {},
      deliveryFee: 0, freeDeliveryFrom: 0, avisos: [],
    })
    return
  }
  let openingHours = {}
  try { openingHours = JSON.parse(settings.opening_hours || '{}') } catch { /* ignore */ }
  res.json({
    storeName: settings.store_name,
    storeIcon: settings.store_icon,
    primaryColor: settings.primary_color,
    primaryDark: settings.primary_dark,
    paymentPixKey: settings.payment_pix_key,
    paymentPixName: settings.payment_pix_name,
    paymentCardInfo: settings.payment_card_info,
    paymentCashInfo: settings.payment_cash_info,
    footerText: settings.footer_text,
    schedulingEnabled: !!settings.scheduling_enabled,
    logoUrl: settings.logo_url || '',
    whatsapp: settings.whatsapp || '',
    openingHours,
    deliveryFee: settings.delivery_fee || 0,
    freeDeliveryFrom: settings.free_delivery_from || 0,
    avisos: (() => { try { return JSON.parse(settings.avisos || '[]') } catch { return [] } })(),
  })
})

router.put('/', authMiddleware, (req: Request, res: Response) => {
  const storeId = (req as AuthRequest).storeId || 'main'
  const mapping: Record<string, [string, any?]> = {
    storeName: ['store_name'], storeIcon: ['store_icon'], primaryColor: ['primary_color'],
    primaryDark: ['primary_dark'], paymentPixKey: ['payment_pix_key'],
    paymentPixName: ['payment_pix_name'], paymentCardInfo: ['payment_card_info'],
    paymentCashInfo: ['payment_cash_info'], footerText: ['footer_text'],
    whatsapp: ['whatsapp'], deliveryFee: ['delivery_fee'], freeDeliveryFrom: ['free_delivery_from'],
    logoUrl: ['logo_url'],
    avisos: ['avisos', (v: any) => JSON.stringify(v)],
  }
  const fields: string[] = []
  const values: any[] = []
  for (const [key, [col, transform]] of Object.entries(mapping)) {
    if (req.body[key] !== undefined) {
      fields.push(`${col} = ?`)
      values.push(transform ? transform(req.body[key]) : req.body[key])
    }
  }
  if (req.body.schedulingEnabled !== undefined) {
    fields.push('scheduling_enabled = ?')
    values.push(req.body.schedulingEnabled ? 1 : 0)
  }
  if (req.body.openingHours !== undefined) {
    fields.push('opening_hours = ?')
    values.push(JSON.stringify(req.body.openingHours))
  }
  if (fields.length === 0) { res.json({ success: true }); return }
  fields.push("updated_at = datetime('now')")
  values.push(storeId)
  dbRun(`UPDATE company_settings SET ${fields.join(', ')} WHERE id = ?`, values)
  res.json({ success: true })
})

// Generate PIX QR Code payload
router.get('/pix/:amount/:orderId', (req: Request, res: Response) => {
  const amount = parseFloat(Array.isArray(req.params.amount) ? req.params.amount[0] : req.params.amount)
  const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId
  const settings = dbGet('SELECT * FROM company_settings WHERE id = ?', [(req as AuthRequest).storeId || 'main'])
  
  if (!settings || !settings.payment_pix_key) {
    res.status(400).json({ error: 'PIX não configurado' })
    return
  }
  
  const merchantName = settings.store_name || 'Minha Loja'
  const merchantCity = 'SAO PAULO'
  const txid = orderId.slice(0, 25)
  
  const payload = generatePixPayload(settings.payment_pix_key, merchantName, merchantCity, amount, txid)
  
  res.json({ 
    payload, 
    amount,
    orderId,
    merchantName,
    pixKey: settings.payment_pix_key,
    pixName: settings.payment_pix_name || merchantName
  })
})

router.post('/logo', authMiddleware, upload.single('logo'), (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Nenhuma imagem enviada' }); return }
  const logoUrl = `/uploads/${req.file.filename}`
  dbRun("UPDATE company_settings SET logo_url = ?, updated_at = datetime('now') WHERE id = ?", [logoUrl, (req as AuthRequest).storeId || 'main'])
  res.json({ logoUrl })
})

export default router
