import { Router, Request, Response } from 'express'
import {
  financialAccountsRepository, financialCategoriesRepository,
  financialTransactionsRepository, financialRecurringRepository,
} from '../repositories/finance'
import { storeId } from './helpers'

const router = Router()

router.get('/accounts', (req: Request, res: Response) => {
  const accounts = financialAccountsRepository.findAll(storeId(req), undefined, [], 'name')
  res.json(accounts.map(a => ({ ...a, isActive: !!a.is_active })))
})

router.post('/accounts', (req: Request, res: Response) => {
  const { name, type, bank } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const account = financialAccountsRepository.insert(storeId(req), {
    name, type: type || 'checking', bank: bank || '',
  })
  res.status(201).json({ ...account, isActive: !!account.is_active })
})

router.put('/accounts/:id', (req: Request, res: Response) => {
  const { name, type, bank, balance } = req.body
  financialAccountsRepository.update(storeId(req), String(req.params.id), {
    name, type, bank: bank || '', balance: balance ?? 0,
  })
  res.json({ success: true })
})

router.delete('/accounts/:id', (req: Request, res: Response) => {
  financialAccountsRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

router.get('/categories', (req: Request, res: Response) => {
  res.json(financialCategoriesRepository.findAll(storeId(req), undefined, [], 'type, name'))
})

router.post('/categories', (req: Request, res: Response) => {
  const { name, type, icon, color } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const cat = financialCategoriesRepository.insert(storeId(req), {
    name, type: type || 'expense', icon: icon || '📂', color: color || '#6c757d',
  })
  res.status(201).json(cat)
})

router.delete('/categories/:id', (req: Request, res: Response) => {
  financialCategoriesRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

router.get('/transactions', (req: Request, res: Response) => {
  const { startDate, endDate, accountId, categoryId, type, status } = req.query as any
  const sid = storeId(req)
  let sql = `
    SELECT ft.*, fa.name as account_name, fc.name as category_name, fc.icon as category_icon, fc.color as category_color
    FROM financial_transactions ft
    LEFT JOIN financial_accounts fa ON fa.id = ft.account_id
    LEFT JOIN financial_categories fc ON fc.id = ft.category_id
    WHERE ft.store_id = ?`
  const params: any[] = [sid ?? 'main']
  if (startDate) { sql += ' AND ft.date >= ?'; params.push(startDate) }
  if (endDate) { sql += ' AND ft.date <= ?'; params.push(endDate) }
  if (accountId) { sql += ' AND ft.account_id = ?'; params.push(accountId) }
  if (categoryId) { sql += ' AND ft.category_id = ?'; params.push(categoryId) }
  if (type) { sql += ' AND ft.type = ?'; params.push(type) }
  if (status) { sql += ' AND ft.status = ?'; params.push(status) }
  sql += ' ORDER BY ft.date DESC, ft.created_at DESC'
  res.json(financialTransactionsRepository.raw(sid, sql, params))
})

router.post('/transactions', (req: Request, res: Response) => {
  const { accountId, categoryId, type, description, amount, date, dueDate, paidDate, status, paymentMethod, notes, orderId } = req.body
  if (!accountId || !description || !amount) { res.status(400).json({ error: 'Conta, descrição e valor são obrigatórios' }); return }
  const sid = storeId(req)
  const now = new Date().toISOString()
  const tx = financialTransactionsRepository.insert(sid, {
    account_id: accountId, category_id: categoryId || null, type: type || 'expense', description,
    amount, date: date || now, due_date: dueDate || null, paid_date: paidDate || null,
    status: status || (type === 'income' ? 'received' : 'paid'),
    payment_method: paymentMethod || '', notes: notes || '', order_id: orderId || null, created_at: now,
  })
  const full = financialTransactionsRepository.raw(
    sid,
    `SELECT ft.*, fa.name as account_name, fc.name as category_name, fc.icon as category_icon
     FROM financial_transactions ft
     LEFT JOIN financial_accounts fa ON fa.id = ft.account_id
     LEFT JOIN financial_categories fc ON fc.id = ft.category_id
     WHERE ft.id = ?`,
    [tx.id]
  )
  res.status(201).json(full[0])
})

router.put('/transactions/:id', (req: Request, res: Response) => {
  const { categoryId, description, amount, date, dueDate, paidDate, status, paymentMethod, notes } = req.body
  financialTransactionsRepository.update(storeId(req), String(req.params.id), {
    category_id: categoryId || null, description, amount, date, due_date: dueDate || null,
    paid_date: paidDate || null, status, payment_method: paymentMethod || '', notes: notes || '',
  })
  res.json({ success: true })
})

router.delete('/transactions/:id', (req: Request, res: Response) => {
  financialTransactionsRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

router.patch('/transactions/:id/pay', (req: Request, res: Response) => {
  const { paidDate, paymentMethod } = req.body
  const sid = storeId(req)
  const tx = financialTransactionsRepository.findById(sid, String(req.params.id))
  if (!tx) { res.status(404).json({ error: 'Transação não encontrada' }); return }
  const now = new Date().toISOString()
  financialTransactionsRepository.update(sid, String(req.params.id), {
    status: tx.type === 'income' ? 'received' : 'paid',
    paid_date: paidDate || now,
    payment_method: paymentMethod || tx.payment_method,
  })
  res.json({ success: true })
})

router.get('/recurring', (req: Request, res: Response) => {
  const sid = storeId(req)
  const rows = financialRecurringRepository.raw(
    sid,
    `SELECT fr.*, fa.name as account_name, fc.name as category_name
     FROM financial_recurring fr
     LEFT JOIN financial_accounts fa ON fa.id = fr.account_id
     LEFT JOIN financial_categories fc ON fc.id = fr.category_id
     WHERE fr.store_id = ?
     ORDER BY fr.next_due`,
    [sid ?? 'main']
  )
  res.json(rows)
})

router.post('/recurring', (req: Request, res: Response) => {
  const { description, amount, type, categoryId, accountId, frequency, intervalDays, nextDue } = req.body
  if (!description || !amount) { res.status(400).json({ error: 'Descrição e valor são obrigatórios' }); return }
  const rec = financialRecurringRepository.insert(storeId(req), {
    description, amount, type: type || 'expense', category_id: categoryId || null,
    account_id: accountId || null, frequency: frequency || 'monthly', interval_days: intervalDays || 30, next_due: nextDue || null,
  })
  res.status(201).json(rec)
})

router.delete('/recurring/:id', (req: Request, res: Response) => {
  financialRecurringRepository.remove(storeId(req), String(req.params.id))
  res.json({ success: true })
})

router.get('/summary', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as any
  const sid = storeId(req)
  const sum = (sql: string, params: any[]) =>
    financialTransactionsRepository.raw(sid, sql, [sid ?? 'main', ...params])[0]?.total || 0

  let dateFilter = ''
  const incParams: any[] = ['income', 'received', 'paid']
  const expParams: any[] = ['expense', 'paid', 'received']
  if (startDate) { dateFilter += ' AND date >= ?'; incParams.push(startDate); expParams.push(startDate) }
  if (endDate) { dateFilter += ' AND date <= ?'; incParams.push(endDate); expParams.push(endDate) }

  const income = sum(`SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE store_id = ? AND type = ? AND status IN (?, ?)${dateFilter}`, incParams)
  const expense = sum(`SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE store_id = ? AND type = ? AND status IN (?, ?)${dateFilter}`, expParams)

  const pendingIncome = sum('SELECT COALESCE(SUM(amount),0) as total FROM financial_transactions WHERE store_id = ? AND type=? AND status=?', ['income', 'pending'])
  const pendingExpense = sum('SELECT COALESCE(SUM(amount),0) as total FROM financial_transactions WHERE store_id = ? AND type=? AND status=?', ['expense', 'pending'])

  const accounts = financialAccountsRepository.findAll(sid, 'is_active = 1')

  res.json({
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense,
    pendingIncome,
    pendingExpense,
    accounts,
  })
})

export default router
