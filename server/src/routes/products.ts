import { Router, Request, Response } from 'express'
import { authMiddleware, planLimitMiddleware, AuthRequest } from '../middleware'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {
  listMenuProducts, listAllProducts, listHighlights, createProduct,
  updateProduct, deleteProduct, listProductCategories, createCategory,
  updateCategory, deleteCategory,
} from '../services/CatalogService'

const router = Router()

const uploadDir = path.join(__dirname, '..', '..', '..', '..', 'client', 'dist', 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `product_${Date.now()}${ext}`)
  }
})
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) { cb(new Error('Tipo de arquivo não permitido. Use: jpg, png, gif, webp') as any); return }
    if (!file.mimetype.startsWith('image/')) { cb(new Error('Apenas imagens são permitidas') as any); return }
    cb(null, true)
  }
})

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

function param(req: Request, name: string): string {
  return String((req.params as Record<string, string | undefined>)[name] ?? '')
}

router.get('/', (req: Request, res: Response) => {
  res.json(listMenuProducts(storeId(req)))
})

router.get('/all', (req: Request, res: Response) => {
  const since = req.query.since as string | undefined
  res.json(listAllProducts(storeId(req), since))
})

router.post('/', authMiddleware, planLimitMiddleware('products'), (req: Request, res: Response) => {
  const { name, price } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  if (price === undefined) { res.status(400).json({ error: 'Preço é obrigatório' }); return }
  const product = createProduct(storeId(req), req.body)
  res.status(201).json(product)
})

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  let product
  try {
    product = updateProduct(storeId(req), param(req, 'id'), req.body)
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message })
    return
  }
  if (product) res.json(product)
  else res.status(404).json({ error: 'Produto não encontrado' })
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  deleteProduct(storeId(req), param(req, 'id'))
  res.json({ success: true })
})

router.get('/categories', (req: Request, res: Response) => {
  const since = req.query.since as string | undefined
  res.json(listProductCategories(storeId(req), since))
})

router.post('/categories', authMiddleware, (req: Request, res: Response) => {
  const { name, icon } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const category = createCategory(storeId(req), { name, icon })
  res.json(category)
})

router.put('/categories/:id', authMiddleware, (req: Request, res: Response) => {
  const category = updateCategory(storeId(req), param(req, 'id'), req.body)
  if (category) res.json(category)
  else res.status(404).json({ error: 'Categoria não encontrada' })
})

router.delete('/categories/:id', authMiddleware, (req: Request, res: Response) => {
  deleteCategory(storeId(req), param(req, 'id'))
  res.json({ success: true })
})

router.get('/highlighted', (req: Request, res: Response) => {
  res.json(listHighlights(storeId(req)))
})

router.post('/upload-image', authMiddleware, (req: Request, res: Response) => {
  upload.single('image')(req, res, (err) => {
    if (err) { res.status(400).json({ error: err.message }); return }
    if (!req.file) { res.status(400).json({ error: 'Nenhuma imagem enviada' }); return }
    const imageUrl = `/uploads/${req.file.filename}`
    res.json({ imageUrl })
  })
})

export default router
