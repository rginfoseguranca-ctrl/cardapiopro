import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { authMiddleware } from '../middleware'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const posts = dbAll("SELECT * FROM blog_posts WHERE is_published = 1 ORDER BY created_at DESC")
  res.json(posts)
})

router.get('/all', authMiddleware, (_req: Request, res: Response) => {
  const posts = dbAll('SELECT * FROM blog_posts ORDER BY created_at DESC')
  res.json(posts)
})

router.get('/:slug', (req: Request, res: Response) => {
  const post = dbGet('SELECT * FROM blog_posts WHERE slug = ?', [req.params.slug])
  if (!post) { res.status(404).json({ error: 'Post não encontrado' }); return }
  res.json(post)
})

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { title, slug, content, excerpt, image, author } = req.body
  if (!title || !slug) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  const existing = dbGet('SELECT id FROM blog_posts WHERE slug = ?', [slug])
  if (existing) { res.status(400).json({ error: 'Slug já existe' }); return }
  const id = 'bp_' + Date.now()
  dbRun('INSERT INTO blog_posts (id, title, slug, content, excerpt, image, author) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, title, slug, content || '', excerpt || '', image || '', author || ''])
  const post = dbGet('SELECT * FROM blog_posts WHERE id = ?', [id])
  res.status(201).json(post)
})

router.patch('/:id', authMiddleware, (req: Request, res: Response) => {
  const { title, content, excerpt, image, isPublished } = req.body
  if (title !== undefined) dbRun('UPDATE blog_posts SET title = ? WHERE id = ?', [title, req.params.id])
  if (content !== undefined) dbRun('UPDATE blog_posts SET content = ? WHERE id = ?', [content, req.params.id])
  if (excerpt !== undefined) dbRun('UPDATE blog_posts SET excerpt = ? WHERE id = ?', [excerpt, req.params.id])
  if (image !== undefined) dbRun('UPDATE blog_posts SET image = ? WHERE id = ?', [image, req.params.id])
  if (isPublished !== undefined) {
    const now = new Date().toISOString()
    dbRun('UPDATE blog_posts SET is_published = ?, published_at = ? WHERE id = ?', [isPublished ? 1 : 0, isPublished ? now : null, req.params.id])
  }
  const post = dbGet('SELECT * FROM blog_posts WHERE id = ?', [req.params.id])
  res.json(post)
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  dbRun('DELETE FROM blog_posts WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

export default router
