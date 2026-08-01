import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware'
import {
  listGroupsByProduct, listAllGroups, createGroup, updateGroup, deleteGroup,
  createComplement, updateComplement, deleteComplement, calculateComplementPrice,
} from '../services/ComplementService'

const router = Router()

function storeId(req: Request): string | null {
  return (req as AuthRequest).storeId || 'main'
}

function param(req: Request, name: string): string {
  return String((req.params as Record<string, string | undefined>)[name] ?? '')
}

router.get('/groups/:productId', (req: Request, res: Response) => {
  res.json(listGroupsByProduct(storeId(req), param(req, 'productId')))
})

router.get('/groups', (req: Request, res: Response) => {
  res.json(listAllGroups(storeId(req)))
})

router.post('/groups', authMiddleware, (req: Request, res: Response) => {
  const { name, productId } = req.body
  if (!name || !productId) { res.status(400).json({ error: 'Nome e produto são obrigatórios' }); return }
  const group = createGroup(storeId(req), req.body)
  res.status(201).json(group)
})

router.put('/groups/:id', authMiddleware, (req: Request, res: Response) => {
  const group = updateGroup(storeId(req), param(req, 'id'), req.body)
  if (group) res.json(group)
  else res.status(404).json({ error: 'Grupo não encontrado' })
})

router.delete('/groups/:id', authMiddleware, (req: Request, res: Response) => {
  deleteGroup(storeId(req), param(req, 'id'))
  res.json({ success: true })
})

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { groupId, name } = req.body
  if (!groupId || !name) { res.status(400).json({ error: 'Grupo e nome são obrigatórios' }); return }
  const item = createComplement(storeId(req), req.body)
  res.status(201).json(item)
})

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const item = updateComplement(storeId(req), param(req, 'id'), req.body)
  if (item) res.json(item)
  else res.status(404).json({ error: 'Complemento não encontrado' })
})

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  deleteComplement(storeId(req), param(req, 'id'))
  res.json({ success: true })
})

router.post('/price', (req: Request, res: Response) => {
  const { complementIds, groupId } = req.body
  res.json(calculateComplementPrice(storeId(req), complementIds, groupId))
})

export default router
