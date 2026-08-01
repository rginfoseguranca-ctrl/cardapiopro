import { Router, Request, Response } from 'express'
import { blogPostsRepository, findBlogBySlug } from '../repositories/blog-posts'
import { authMiddleware, AuthRequest } from '../middleware'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

router.get('/', (req: Request, res: Response) => {
  const posts = blogPostsRepository.findAll(storeId(req), 'is_published = 1', [], 'created_at DESC')
  res.json(posts)
})

router.get('/all', authMiddleware, (req: Request, res: Response) => {
  const posts = blogPostsRepository.findAll(storeId(req), undefined, [], 'created_at DESC')
  res.json(posts)
})

router.get('/:slug', (req: Request, res: Response) => {
  const post = findBlogBySlug(storeId(req), String(req.params.slug))
  if (!post) { res.status(404).json({ error: 'Post não encontrado' }); return }
  res.json(post)
})

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { title, slug, content, excerpt, image, author } = req.body
  if (!title || !slug) { res.status(400).json({ error: 'Dados obrigatórios faltando' }); return }
  if (findBlogBySlug(storeId(req), slug)) { res.status(400).json({ error: 'Slug já existe' }); return }
  const post = blogPostsRepository.insert(storeId(req), {
    title, slug, content: content || '', excerpt: excerpt || '', image: image || '', author: author || '',
  })
  res.status(201).json(post)
})

router.patch('/:id', authMiddleware, (req: Request, res: Response) => {
  const { title, content, excerpt, image, isPublished } = req.body
  const patch: Record<string, any> = {}
  if (title !== undefined) patch.title = title
  if (content !== undefined) patch.content = content
  if (excerpt !== undefined) patch.excerpt = excerpt
  if (image !== undefined) patch.image = image
  if (isPublished !== undefined) {
    const now = new Date().toISOString()
    patch.is_published = isPublished ? 1 : 0
    patch.published_at = isPublished ? now : null
  }
  blogPostsRepository.update(storeId(req), String(req.params.id), patch)
  const post = blogPostsRepository.findById(storeId(req), String(req.params.id))
  res.json(post)
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  blogPostsRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

export default router
