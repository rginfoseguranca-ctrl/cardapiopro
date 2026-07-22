import { Router, Request, Response } from 'express'
import { dbAll, dbGet, dbRun } from '../database'
import { v4 as uuid } from 'uuid'

const router = Router()

// ─── Accounts ───
router.get('/accounts', (_req: Request, res: Response) => {
  const accounts = dbAll('SELECT * FROM financial_accounts ORDER BY name')
  res.json(accounts.map(a => ({ ...a, isActive: !!a.is_active })))
})

router.post('/accounts', (req: Request, res: Response) => {
  const { name, type, bank } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const id = uuid()
  dbRun('INSERT INTO financial_accounts (id, name, type, bank) VALUES (?, ?, ?, ?)', [id, name, type || 'checking', bank || ''])
  const account = dbGet('SELECT * FROM financial_accounts WHERE id = ?', [id])
  res.status(201).json({ ...account, isActive: !!account.is_active })
})

router.put('/accounts/:id', (req: Request, res: Response) => {
  const { name, type, bank, balance } = req.body
  dbRun('UPDATE financial_accounts SET name=?, type=?, bank=?, balance=? WHERE id=?',
    [name, type, bank || '', balance ?? 0, req.params.id])
  res.json({ success: true })
})

router.delete('/accounts/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM financial_accounts WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

// ─── Categories ───
router.get('/categories', (_req: Request, res: Response) => {
  res.json(dbAll('SELECT * FROM financial_categories ORDER BY type, name'))
})

router.post('/categories', (req: Request, res: Response) => {
  const { name, type, icon, color } = req.body
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const id = uuid()
  dbRun('INSERT INTO financial_categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
    [id, name, type || 'expense', icon || '📂', color || '#6c757d'])
  const cat = dbGet('SELECT * FROM financial_categories WHERE id = ?', [id])
  res.status(201).json(cat)
})

router.delete('/categories/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM financial_categories WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

// ─── Transactions ───
router.get('/transactions', (req: Request, res: Response) => {
  const { startDate, endDate, accountId, categoryId, type, status } = req.query as any
  let sql = `
    SELECT ft.*, fa.name as account_name, fc.name as category_name, fc.icon as category_icon, fc.color as category_color
    FROM financial_transactions ft
    LEFT JOIN financial_accounts fa ON fa.id = ft.account_id
    LEFT JOIN financial_categories fc ON fc.id = ft.category_id
    WHERE 1=1`
  const params: any[] = []
  if (startDate) { sql += ' AND ft.date >= ?'; params.push(startDate) }
  if (endDate) { sql += ' AND ft.date <= ?'; params.push(endDate) }
  if (accountId) { sql += ' AND ft.account_id = ?'; params.push(accountId) }
  if (categoryId) { sql += ' AND ft.category_id = ?'; params.push(categoryId) }
  if (type) { sql += ' AND ft.type = ?'; params.push(type) }
  if (status) { sql += ' AND ft.status = ?'; params.push(status) }
  sql += ' ORDER BY ft.date DESC, ft.created_at DESC'
  res.json(dbAll(sql, params))
})

router.post('/transactions', (req: Request, res: Response) => {
  const { accountId, categoryId, type, description, amount, date, dueDate, paidDate, status, paymentMethod, notes, orderId } = req.body
  if (!accountId || !description || !amount) { res.status(400).json({ error: 'Conta, descrição e valor são obrigatórios' }); return }
  const id = uuid()
  const now = new Date().toISOString()
  dbRun(`INSERT INTO financial_transactions (id, account_id, category_id, type, description, amount, date, due_date, paid_date, status, payment_method, notes, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, accountId, categoryId || null, type || 'expense', description, amount, date || now, dueDate || null, paidDate || null, status || (type === 'income' ? 'received' : 'paid'), paymentMethod || '', notes || '', orderId || null, now])
  const tx = dbGet(`
    SELECT ft.*, fa.name as account_name, fc.name as category_name, fc.icon as category_icon
    FROM financial_transactions ft
    LEFT JOIN financial_accounts fa ON fa.id = ft.account_id
    LEFT JOIN financial_categories fc ON fc.id = ft.category_id
    WHERE ft.id = ?`, [id])
  res.status(201).json(tx)
})

router.put('/transactions/:id', (req: Request, res: Response) => {
  const { categoryId, description, amount, date, dueDate, paidDate, status, paymentMethod, notes } = req.body
  dbRun(`UPDATE financial_transactions SET category_id=?, description=?, amount=?, date=?, due_date=?, paid_date=?, status=?, payment_method=?, notes=? WHERE id=?`,
    [categoryId || null, description, amount, date, dueDate || null, paidDate || null, status, paymentMethod || '', notes || '', req.params.id])
  res.json({ success: true })
})

router.delete('/transactions/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM financial_transactions WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

router.patch('/transactions/:id/pay', (req: Request, res: Response) => {
  const { paidDate, paymentMethod } = req.body
  const tx = dbGet('SELECT * FROM financial_transactions WHERE id = ?', [req.params.id])
  if (!tx) { res.status(404).json({ error: 'Transação não encontrada' }); return }
  const now = new Date().toISOString()
  dbRun('UPDATE financial_transactions SET status=?, paid_date=?, payment_method=? WHERE id=?',
    [tx.type === 'income' ? 'received' : 'paid', paidDate || now, paymentMethod || tx.payment_method, req.params.id])
  res.json({ success: true })
})

// ─── Recurring ───
router.get('/recurring', (_req: Request, res: Response) => {
  res.json(dbAll(`
    SELECT fr.*, fa.name as account_name, fc.name as category_name
    FROM financial_recurring fr
    LEFT JOIN financial_accounts fa ON fa.id = fr.account_id
    LEFT JOIN financial_categories fc ON fc.id = fr.category_id
    ORDER BY fr.next_due`))
})

router.post('/recurring', (req: Request, res: Response) => {
  const { description, amount, type, categoryId, accountId, frequency, intervalDays, nextDue } = req.body
  if (!description || !amount) { res.status(400).json({ error: 'Descrição e valor são obrigatórios' }); return }
  const id = uuid()
  dbRun('INSERT INTO financial_recurring (id, description, amount, type, category_id, account_id, frequency, interval_days, next_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, description, amount, type || 'expense', categoryId || null, accountId || null, frequency || 'monthly', intervalDays || 30, nextDue || null])
  const rec = dbGet('SELECT * FROM financial_recurring WHERE id = ?', [id])
  res.status(201).json(rec)
})

router.delete('/recurring/:id', (req: Request, res: Response) => {
  dbRun('DELETE FROM financial_recurring WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

// ─── Cash Flow Summary ───
router.get('/summary', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as any

  const incomeSql = 'SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = ? AND status IN (?, ?)'
  const incomeParams = ['income', 'received', 'paid']
  const expenseSql = 'SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = ? AND status IN (?, ?)'
  const expenseParams = ['expense', 'paid', 'received']

  let dateFilter = ''
  const incParams = [...incomeParams]
  const expParams = [...expenseParams]
  if (startDate) { dateFilter = ' AND date >= ?'; incParams.push(startDate); expParams.push(startDate) }
  if (endDate) { dateFilter = ' AND date <= ?'; incParams.push(endDate); expParams.push(endDate) }

  const income = dbGet(incomeSql + dateFilter, incParams)
  const expense = dbGet(expenseSql + dateFilter, expParams)

  const pendingIncome = dbGet('SELECT COALESCE(SUM(amount),0) as total FROM financial_transactions WHERE type=? AND status=?', ['income', 'pending'])
  const pendingExpense = dbGet('SELECT COALESCE(SUM(amount),0) as total FROM financial_transactions WHERE type=? AND status=?', ['expense', 'pending'])

  const accounts = dbAll('SELECT * FROM financial_accounts WHERE is_active = 1')

  res.json({
    totalIncome: income.total,
    totalExpense: expense.total,
    balance: income.total - expense.total,
    pendingIncome: pendingIncome.total,
    pendingExpense: pendingExpense.total,
    accounts,
  })
})

export default router