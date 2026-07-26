import { ipcMain } from 'electron'
import { dbGet, dbAll, dbRun, generateId } from './database'

export function registerIpcHandlers(): void {

  // ─── Products ───
  ipcMain.handle('products:list', () => {
    return dbAll(`
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = 1
      ORDER BY c."order", p.name
    `)
  })

  ipcMain.handle('products:list-all', () => {
    return dbAll(`
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY c."order", p.name
    `)
  })

  ipcMain.handle('products:get', (_e, id: string) => {
    return dbGet(`
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id])
  })

  ipcMain.handle('products:create', (_e, product: any) => {
    const id = generateId()
    dbRun(
      `INSERT INTO products (id, name, description, price, price_promotional, image, category_id, is_highlighted, is_available, ingredients)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, product.name, product.description || '', product.price, product.pricePromotional || null,
       product.image || '', product.categoryId || '', product.isHighlighted ? 1 : 0,
       product.isAvailable !== false ? 1 : 0, JSON.stringify(product.ingredients || [])]
    )
    addToSyncQueue('create', 'product', id, product)
    return dbGet('SELECT * FROM products WHERE id = ?', [id])
  })

  ipcMain.handle('products:update', (_e, id: string, data: any) => {
    const sets: string[] = []
    const vals: any[] = []

    if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name) }
    if (data.description !== undefined) { sets.push('description = ?'); vals.push(data.description) }
    if (data.price !== undefined) { sets.push('price = ?'); vals.push(data.price) }
    if (data.pricePromotional !== undefined) { sets.push('price_promotional = ?'); vals.push(data.pricePromotional) }
    if (data.image !== undefined) { sets.push('image = ?'); vals.push(data.image) }
    if (data.categoryId !== undefined) { sets.push('category_id = ?'); vals.push(data.categoryId) }
    if (data.isHighlighted !== undefined) { sets.push('is_highlighted = ?'); vals.push(data.isHighlighted ? 1 : 0) }
    if (data.isAvailable !== undefined) { sets.push('is_available = ?'); vals.push(data.isAvailable ? 1 : 0) }
    if (data.ingredients !== undefined) { sets.push('ingredients = ?'); vals.push(JSON.stringify(data.ingredients)) }

    if (sets.length > 0) {
      sets.push("updated_at = datetime('now')")
      vals.push(id)
      dbRun(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, vals)
    }
    addToSyncQueue('update', 'product', id, { id, ...data })
    return dbGet('SELECT * FROM products WHERE id = ?', [id])
  })

  ipcMain.handle('products:delete', (_e, id: string) => {
    dbRun('DELETE FROM products WHERE id = ?', [id])
    addToSyncQueue('delete', 'product', id, { id })
    return { success: true }
  })

  // ─── Categories ───
  ipcMain.handle('categories:list', () => {
    return dbAll('SELECT * FROM categories ORDER BY "order"')
  })

  ipcMain.handle('categories:create', (_e, cat: any) => {
    const id = generateId()
    const maxOrder = (dbGet('SELECT MAX("order") as max_order FROM categories') as any)?.max_order || 0
    dbRun('INSERT INTO categories (id, name, icon, "order") VALUES (?, ?, ?, ?)',
      [id, cat.name, cat.icon || '📋', maxOrder + 1])
    addToSyncQueue('create', 'category', id, cat)
    return dbGet('SELECT * FROM categories WHERE id = ?', [id])
  })

  ipcMain.handle('categories:update', (_e, id: string, data: any) => {
    dbRun('UPDATE categories SET name = ?, icon = ?, is_active = ? WHERE id = ?',
      [data.name, data.icon || '📋', data.isActive !== false ? 1 : 0, id])
    addToSyncQueue('update', 'category', id, { id, ...data })
    return dbGet('SELECT * FROM categories WHERE id = ?', [id])
  })

  ipcMain.handle('categories:delete', (_e, id: string) => {
    dbRun('DELETE FROM categories WHERE id = ?', [id])
    addToSyncQueue('delete', 'category', id, { id })
    return { success: true }
  })

  ipcMain.handle('categories:reorder', (_e, ids: string[]) => {
    ids.forEach((id, i) => dbRun('UPDATE categories SET "order" = ? WHERE id = ?', [i + 1, id]))
    return { success: true }
  })

  // ─── Orders ───
  ipcMain.handle('orders:list', () => {
    return dbAll('SELECT * FROM orders ORDER BY created_at DESC')
  })

  ipcMain.handle('orders:get', (_e, id: string) => {
    return dbGet('SELECT * FROM orders WHERE id = ?', [id])
  })

  ipcMain.handle('orders:create', (_e, order: any) => {
    const id = generateId()
    const subtotal = order.items?.reduce((s: number, i: any) => s + (i.totalPrice || i.unitPrice * i.quantity), 0) || 0
    const total = subtotal - (order.discount || 0)

    dbRun(
      `INSERT INTO orders (id, customer_name, customer_phone, items, subtotal, discount, total,
        payment_method, status, delivery_type, delivery_address, table_number, notes, scheduled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, order.customerName || '', order.customerPhone || '00000000000',
       JSON.stringify(order.items || []), subtotal, order.discount || 0, total,
       order.paymentMethod || 'cash', 'pending', order.deliveryType || 'pickup',
       order.deliveryAddress || '', order.tableNumber || null,
       order.notes || '', order.scheduledAt || null]
    )

    // Update inventory if items have products
    for (const item of (order.items || [])) {
      try {
        const inv = dbGet('SELECT * FROM inventory WHERE product_id = ?', [item.productId]) as any
        if (inv) {
          const newQty = Math.max(0, inv.quantity - item.quantity)
          dbRun('UPDATE inventory SET quantity = ?, updated_at = datetime(\'now\') WHERE product_id = ?', [newQty, item.productId])
          dbRun('INSERT INTO inventory_movements (id, product_id, type, quantity, description) VALUES (?, ?, ?, ?, ?)',
            [generateId(), item.productId, 'out', item.quantity, `Pedido #${id.slice(0, 8)}`])
        }
      } catch {}
    }

    addToSyncQueue('create', 'order', id, order)
    return dbGet('SELECT * FROM orders WHERE id = ?', [id])
  })

  ipcMain.handle('orders:update-status', (_e, id: string, status: string) => {
    dbRun("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id])
    addToSyncQueue('update', 'order', id, { id, status })
    return dbGet('SELECT * FROM orders WHERE id = ?', [id])
  })

  // ─── Tables ───
  ipcMain.handle('tables:list', () => {
    return dbAll('SELECT * FROM tables_list ORDER BY number')
  })

  ipcMain.handle('tables:create', (_e, number: number) => {
    const id = generateId()
    dbRun('INSERT INTO tables_list (id, number) VALUES (?, ?)', [id, number])
    addToSyncQueue('create', 'table', id, { id, number })
    return dbGet('SELECT * FROM tables_list WHERE id = ?', [id])
  })

  ipcMain.handle('tables:update', (_e, id: string, data: any) => {
    if (data.isOccupied !== undefined) {
      dbRun('UPDATE tables_list SET is_occupied = ? WHERE id = ?', [data.isOccupied ? 1 : 0, id])
    }
    addToSyncQueue('update', 'table', id, { id, ...data })
    return dbGet('SELECT * FROM tables_list WHERE id = ?', [id])
  })

  ipcMain.handle('tables:delete', (_e, id: string) => {
    dbRun('DELETE FROM tables_list WHERE id = ?', [id])
    addToSyncQueue('delete', 'table', id, { id })
    return { success: true }
  })

  // ─── Cash Register ───
  ipcMain.handle('cash-register:get', () => {
    const entries = dbAll('SELECT * FROM cash_register ORDER BY created_at DESC')
    return { entries }
  })

  ipcMain.handle('cash-register:add-entry', (_e, entry: any) => {
    const id = generateId()
    dbRun('INSERT INTO cash_register (id, type, description, amount, payment_method) VALUES (?, ?, ?, ?, ?)',
      [id, entry.type, entry.description, entry.amount, entry.paymentMethod || 'cash'])
    addToSyncQueue('create', 'cash_entry', id, entry)
    return { id, success: true }
  })

  // ─── Inventory ───
  ipcMain.handle('inventory:list', () => {
    return dbAll('SELECT * FROM inventory ORDER BY product_name')
  })

  ipcMain.handle('inventory:upsert', (_e, product: any) => {
    const id = generateId()
    dbRun(`INSERT OR REPLACE INTO inventory (id, product_id, product_name, quantity, unit, min_quantity)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [product.id || id, product.productId, product.productName, product.quantity || 0,
       product.unit || 'un', product.minQuantity || 0])
    return { success: true }
  })

  ipcMain.handle('inventory:adjust', (_e, productId: string, type: string, quantity: number, reason: string) => {
    const inv = dbGet('SELECT * FROM inventory WHERE product_id = ?', [productId]) as any
    if (!inv) return { error: 'Produto não encontrado no estoque' }

    const newQty = type === 'add' ? inv.quantity + quantity : Math.max(0, inv.quantity - quantity)
    dbRun("UPDATE inventory SET quantity = ?, updated_at = datetime('now') WHERE product_id = ?", [newQty, productId])
    dbRun('INSERT INTO inventory_movements (id, product_id, type, quantity, description) VALUES (?, ?, ?, ?, ?)',
      [generateId(), productId, type === 'add' ? 'in' : 'out', quantity, reason || ''])

    return { success: true, newQuantity: newQty }
  })

  // ─── Complements ───
  ipcMain.handle('complements:list-groups', (_e, productId?: string) => {
    if (productId) {
      return dbAll('SELECT * FROM complement_groups WHERE product_id = ?', [productId])
    }
    return dbAll('SELECT * FROM complement_groups')
  })

  ipcMain.handle('complements:create-group', (_e, group: any) => {
    const id = generateId()
    dbRun('INSERT INTO complement_groups (id, name, type, min, max, product_id, is_required) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, group.name, group.type || 'checkbox', group.min || 0, group.max || 0,
       group.productId, group.isRequired ? 1 : 0])
    return dbGet('SELECT * FROM complement_groups WHERE id = ?', [id])
  })

  ipcMain.handle('complements:create-item', (_e, item: any) => {
    const id = generateId()
    dbRun('INSERT INTO complements (id, group_id, name, price) VALUES (?, ?, ?, ?)',
      [id, item.groupId, item.name, item.price || 0])
    return dbGet('SELECT * FROM complements WHERE id = ?', [id])
  })

  ipcMain.handle('complements:delete-group', (_e, id: string) => {
    dbRun('DELETE FROM complement_groups WHERE id = ?', [id])
    dbRun('DELETE FROM complements WHERE group_id = ?', [id])
    return { success: true }
  })

  ipcMain.handle('complements:delete-item', (_e, id: string) => {
    dbRun('DELETE FROM complements WHERE id = ?', [id])
    return { success: true }
  })

  // ─── Customers ───
  ipcMain.handle('customers:list', () => {
    return dbAll('SELECT * FROM customers ORDER BY name')
  })

  ipcMain.handle('customers:get', (_e, id: string) => {
    return dbGet('SELECT * FROM customers WHERE id = ?', [id])
  })

  ipcMain.handle('customers:upsert', (_e, data: any) => {
    let customer = dbGet('SELECT * FROM customers WHERE phone = ?', [data.phone]) as any
    if (customer) {
      dbRun("UPDATE customers SET name = ?, email = ?, address = ?, total_orders = total_orders + 1, total_spent = total_spent + ?, last_order_at = datetime('now') WHERE id = ?",
        [data.name || customer.name, data.email || customer.email, data.address || customer.address, data.orderTotal || 0, customer.id])
      return dbGet('SELECT * FROM customers WHERE id = ?', [customer.id])
    }
    const id = generateId()
    dbRun('INSERT INTO customers (id, name, phone, email, address, total_orders, total_spent) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [id, data.name, data.phone, data.email || '', data.address || '', data.orderTotal || 0])
    return dbGet('SELECT * FROM customers WHERE id = ?', [id])
  })

  // ─── Fiado ───
  ipcMain.handle('fiado:list', () => {
    const debts = dbAll('SELECT * FROM fiado ORDER BY created_at DESC')
    return { debts }
  })

  ipcMain.handle('fiado:create', (_e, data: any) => {
    const id = generateId()
    dbRun('INSERT INTO fiado (id, customer_name, customer_phone, amount, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.customerName, data.customerPhone || '', data.amount, data.dueDate || null, data.notes || ''])
    addToSyncQueue('create', 'fiado', id, data)
    return dbGet('SELECT * FROM fiado WHERE id = ?', [id])
  })

  ipcMain.handle('fiado:pay', (_e, id: string) => {
    dbRun("UPDATE fiado SET status = 'paid', paid_amount = amount WHERE id = ?", [id])
    addToSyncQueue('update', 'fiado', id, { id, status: 'paid' })
    return dbGet('SELECT * FROM fiado WHERE id = ?', [id])
  })

  // ─── Store Settings ───
  ipcMain.handle('store:get', () => {
    return dbGet('SELECT * FROM company_settings WHERE id = ?', ['main'])
  })

  ipcMain.handle('store:update', (_e, data: any) => {
    const sets: string[] = []
    const vals: any[] = []
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id') continue
      sets.push(`${key} = ?`)
      vals.push(typeof value === 'object' ? JSON.stringify(value) : value)
    }
    if (sets.length > 0) {
      sets.push("updated_at = datetime('now')")
      vals.push('main')
      dbRun(`UPDATE company_settings SET ${sets.join(', ')} WHERE id = ?`, vals)
    }
    addToSyncQueue('update', 'store_settings', 'main', data)
    return dbGet('SELECT * FROM company_settings WHERE id = ?', ['main'])
  })

  // ─── Dashboard ───
  ipcMain.handle('dashboard:summary', () => {
    const today = new Date().toISOString().slice(0, 10)

    const todayOrders = (dbGet("SELECT COUNT(*) as count FROM orders WHERE created_at >= ?", [today]) as any)?.count || 0
    const todayRevenue = (dbGet("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE created_at >= ? AND status != 'cancelled'", [today]) as any)?.total || 0
    const pendingOrders = (dbGet("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'") as any)?.count || 0
    const totalOrders = (dbGet("SELECT COUNT(*) as count FROM orders") as any)?.count || 0
    const totalRevenue = (dbGet("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'") as any)?.total || 0

    const ordersByStatus = dbAll("SELECT status, COUNT(*) as count FROM orders GROUP BY status")
    const topProducts = dbAll("SELECT name, total FROM (SELECT json_extract(value, '$.productName') as name, json_extract(value, '$.totalPrice') as total FROM orders, json_each(orders.items) WHERE orders.status != 'cancelled') GROUP BY name ORDER BY SUM(total) DESC LIMIT 5")

    return {
      todayOrders, todayRevenue, pendingOrders, totalOrders, totalRevenue,
      ordersByStatus, ordersByDay: [], topProducts
    }
  })

  // ─── Coupons ───
  ipcMain.handle('coupons:list', () => {
    return dbAll('SELECT * FROM coupons ORDER BY created_at DESC')
  })

  ipcMain.handle('coupons:create', (_e, coupon: any) => {
    const id = generateId()
    dbRun('INSERT INTO coupons (id, code, title, description, discount_type, discount_value, min_order_value, max_uses) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, coupon.code, coupon.title, coupon.description || '', coupon.discountType, coupon.discountValue, coupon.minOrderValue || 0, coupon.maxUses || 0])
    return dbGet('SELECT * FROM coupons WHERE id = ?', [id])
  })

  ipcMain.handle('coupons:delete', (_e, id: string) => {
    dbRun('DELETE FROM coupons WHERE id = ?', [id])
    return { success: true }
  })

  // ─── Loyalty ───
  ipcMain.handle('loyalty:rewards', () => {
    return dbAll('SELECT * FROM loyalty_rewards ORDER BY points_required')
  })

  ipcMain.handle('loyalty:create-reward', (_e, reward: any) => {
    const id = generateId()
    dbRun('INSERT INTO loyalty_rewards (id, name, description, points_required) VALUES (?, ?, ?, ?)',
      [id, reward.name, reward.description || '', reward.pointsRequired])
    return dbGet('SELECT * FROM loyalty_rewards WHERE id = ?', [id])
  })

  ipcMain.handle('loyalty:delete-reward', (_e, id: string) => {
    dbRun('DELETE FROM loyalty_rewards WHERE id = ?', [id])
    return { success: true }
  })

  // ─── Sync Status ───
  ipcMain.handle('sync:get-status', () => {
    const pending = (dbGet("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'") as any)?.count || 0
    const lastSync = (dbGet("SELECT value FROM sync_metadata WHERE key = 'last_sync_at'") as any)?.value || null
    return { pending, lastSync }
  })

  ipcMain.handle('sync:is-online', async () => {
    try {
      const serverUrl = (dbGet("SELECT value FROM sync_metadata WHERE key = 'server_url'") as any)?.value
      if (!serverUrl) return false
      const response = await fetch(`${serverUrl}/health`, { signal: AbortSignal.timeout(3000) })
      return response.ok
    } catch {
      return false
    }
  })

  ipcMain.handle('sync:force', async () => {
    const { triggerSync } = await import('./sync-engine')
    await triggerSync()
    const pending = (dbGet("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'") as any)?.count || 0
    const lastSync = (dbGet("SELECT value FROM sync_metadata WHERE key = 'last_sync_at'") as any)?.value || null
    return { pending, lastSync }
  })

  ipcMain.handle('sync:push-pending', async () => {
    const { triggerSync } = await import('./sync-engine')
    await triggerSync()
    return { success: true }
  })

  // ─── Images ───
  ipcMain.handle('images:cache', async (_e, url: string) => {
    try {
      const { cacheImage } = await import('./image-cache')
      return await cacheImage(url)
    } catch {
      return null
    }
  })

  ipcMain.handle('images:get-cached-path', (_e, url: string) => {
    try {
      const { getCachedImagePath } = require('./image-cache')
      return getCachedImagePath(url)
    } catch {
      return null
    }
  })

  ipcMain.handle('images:clear-cache', async () => {
    try {
      const { clearImageCache } = await import('./image-cache')
      return await clearImageCache()
    } catch {
      return { success: false }
    }
  })

  // ─── Auth (local) ───
  ipcMain.handle('auth:login', async (_e, email: string, password: string) => {
    const bcrypt = require('bcryptjs')
    const user = dbGet('SELECT * FROM users WHERE email = ?', [email]) as any
    if (!user) return { error: 'Email ou senha inválidos' }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return { error: 'Email ou senha inválidos' }

    const token = generateId()
    const store = dbGet('SELECT * FROM company_settings WHERE id = ?', ['main']) as any

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      mustChangePassword: Boolean(user.must_change_password),
      store: { id: 'main', name: store?.store_name || 'Minha Loja', slug: 'main' }
    }
  })

  ipcMain.handle('auth:register', async (_e, payload: { storeName: string; name: string; email: string; password: string }) => {
    const bcrypt = require('bcryptjs')
    const existing = dbGet('SELECT id FROM users WHERE email = ?', [payload.email])
    if (existing) return { error: 'Email já cadastrado' }

    const id = generateId()
    const hash = await bcrypt.hash(payload.password, 10)
    dbRun('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, payload.name, payload.email, hash, 'admin'])

    dbRun("UPDATE company_settings SET store_name = ? WHERE id = ?", [payload.storeName, 'main'])

    const token = generateId()
    return {
      token,
      user: { id, name: payload.name, email: payload.email, role: 'admin' },
      mustChangePassword: false,
      store: { id: 'main', name: payload.storeName, slug: 'main' }
    }
  })

  ipcMain.handle('auth:me', (_e, token: string) => {
    const store = dbGet('SELECT * FROM company_settings WHERE id = ?', ['main']) as any
    return {
      id: 'local-admin',
      name: 'Administrador',
      email: 'admin@local',
      role: 'admin',
      store: { id: 'main', name: store?.store_name || 'Minha Loja', slug: 'main' }
    }
  })

  ipcMain.handle('auth:change-password', async (_e, currentPassword: string, newPassword: string) => {
    const bcrypt = require('bcryptjs')
    const user = dbGet("SELECT * FROM users WHERE role = 'admin' LIMIT 1") as any
    if (!user) return { error: 'Usuário não encontrado' }

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return { error: 'Senha atual incorreta' }

    const hash = await bcrypt.hash(newPassword, 10)
    dbRun('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?', [hash, user.id])
    return { message: 'Senha alterada com sucesso' }
  })
}

function addToSyncQueue(operation: string, entityType: string, entityId: string, payload: any): void {
  try {
    const id = generateId()
    const idempotencyKey = generateId()
    dbRun(
      `INSERT INTO sync_queue (id, operation, entity_type, entity_id, payload, created_at, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, operation, entityType, entityId, JSON.stringify(payload), Date.now(), idempotencyKey]
    )
  } catch (err) {
    console.error('[Sync] Erro ao adicionar à fila:', err)
  }
}
