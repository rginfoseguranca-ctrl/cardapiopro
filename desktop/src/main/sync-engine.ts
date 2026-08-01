import { getDb, generateId, dbAll, dbRun, dbGet } from './database'
import crypto from 'crypto'

let syncInterval: NodeJS.Timeout | null = null
let isSyncing = false
let onlineStatus = false

function getServerUrl(): string {
  try {
    const db = getDb()
    const url = (dbGet.call(db, "SELECT value FROM sync_metadata WHERE key = 'server_url'") as any)?.value
    if (url) return url
  } catch {}
  return process.env.API_URL || 'http://localhost:3001'
}

export function startSyncEngine(): void {
  const url = getServerUrl()
  console.log(`[Sync] Motor iniciado — servidor: ${url}, verificando a cada 30s`)
  syncInterval = setInterval(() => runSync(), 30000)
  runSync()
}

export function stopSyncEngine(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

async function runSync(): Promise<void> {
  if (isSyncing) return
  isSyncing = true

  try {
    onlineStatus = await checkConnectivity()

    if (!onlineStatus) {
      isSyncing = false
      return
    }

    await pushPendingChanges()
    await pullRemoteChanges()

    const db = getDb()
    db.run("INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('last_sync_at', ?)",
      [new Date().toISOString()])
  } catch (err) {
    console.error('[Sync] Erro:', err)
  } finally {
    isSyncing = false
  }
}

async function checkConnectivity(): Promise<boolean> {
  try {
    const res = await fetch(`${getServerUrl()}/health`, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

async function pushPendingChanges(): Promise<void> {
  const db = getDb()
  const serverUrl = getServerUrl()
  const pending = dbAll(
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at LIMIT 50"
  )

  if (pending.length === 0) return
  console.log(`[Sync] Enviando ${pending.length} alterações pendentes...`)

  for (const item of pending) {
    try {
      const payload = JSON.parse(item.payload)
      let endpoint = ''
      let method = ''

      switch (item.entity_type) {
        case 'product':
          if (item.operation === 'delete') { endpoint = `/api/products/${item.entity_id}`; method = 'DELETE' }
          else if (item.operation === 'update') { endpoint = `/api/products/${item.entity_id}`; method = 'PUT' }
          else { endpoint = '/api/products'; method = 'POST' }
          break
        case 'category':
          if (item.operation === 'delete') { endpoint = `/api/products/categories/${item.entity_id}`; method = 'DELETE' }
          else if (item.operation === 'update') { endpoint = `/api/products/categories/${item.entity_id}`; method = 'PUT' }
          else { endpoint = '/api/products/categories'; method = 'POST' }
          break
        case 'complement_group':
          if (item.operation === 'delete') { endpoint = `/api/complements/groups/${item.entity_id}`; method = 'DELETE' }
          else if (item.operation === 'update') { endpoint = `/api/complements/groups/${item.entity_id}`; method = 'PUT' }
          else { endpoint = '/api/complements/groups'; method = 'POST' }
          break
        case 'complement':
          if (item.operation === 'delete') { endpoint = `/api/complements/${item.entity_id}`; method = 'DELETE' }
          else if (item.operation === 'update') { endpoint = `/api/complements/${item.entity_id}`; method = 'PUT' }
          else { endpoint = '/api/complements'; method = 'POST' }
          break
        case 'order':
          if (item.operation === 'update') { endpoint = `/api/orders/${item.entity_id}/status`; method = 'PATCH' }
          else { endpoint = '/api/orders'; method = 'POST' }
          break
        case 'table':
          if (item.operation === 'delete') { endpoint = `/api/tables/${item.entity_id}`; method = 'DELETE' }
          else if (item.operation === 'update') { endpoint = `/api/tables/${item.entity_id}`; method = 'PUT' }
          else { endpoint = '/api/tables'; method = 'POST' }
          break
        case 'customer':
          endpoint = `/api/customers/${item.entity_id}`; method = 'PATCH'
          break
        case 'store_settings':
          endpoint = '/api/store'; method = 'PUT'
          break
        case 'fiado':
          if (item.operation === 'pay') { endpoint = `/api/fiado/${item.entity_id}/pay`; method = 'PATCH' }
          else { endpoint = '/api/fiado'; method = 'POST' }
          break
        case 'cash_entry':
          endpoint = '/api/cash-register'; method = 'POST'
          break
        case 'coupon':
          if (item.operation === 'delete') { endpoint = `/api/coupons/${item.entity_id}`; method = 'DELETE' }
          else { endpoint = '/api/coupons'; method = 'POST' }
          break
        case 'loyalty_reward':
          if (item.operation === 'delete') { endpoint = `/api/loyalty/rewards/${item.entity_id}`; method = 'DELETE' }
          else { endpoint = '/api/loyalty/rewards'; method = 'POST' }
          break
        default: continue
      }

      const res = await fetch(`${serverUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': item.idempotency_key,
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: method !== 'DELETE' ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(10000)
      })

      if (res.ok) {
        dbRun("UPDATE sync_queue SET status = 'synced' WHERE id = ?", [item.id])
      } else if (res.status >= 400 && res.status < 500) {
        const errorBody = await res.text().catch(() => '')
        dbRun("UPDATE sync_queue SET status = 'failed', last_error = ? WHERE id = ?",
          [`HTTP ${res.status}: ${errorBody.slice(0, 100)}`, item.id])
      } else {
        dbRun("UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?", [item.id])
      }
    } catch (err: any) {
      dbRun("UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?",
        [err.message?.slice(0, 200) || 'unknown', item.id])
    }
  }
}

async function pullRemoteChanges(): Promise<void> {
  const db = getDb()
  const serverUrl = getServerUrl()
  const lastSync = (dbGet("SELECT value FROM sync_metadata WHERE key = 'last_pull_at'") as any)?.value || null

  const endpoints = [
    { table: 'categories', url: '/api/products/categories' },
    { table: 'products', url: '/api/products/all' },
    { table: 'orders', url: '/api/orders' },
    { table: 'tables_list', url: '/api/tables' },
    { table: 'customers', url: '/api/customers' },
    { table: 'company_settings', url: '/api/store' },
    { table: 'complement_groups', url: '/api/complements/groups', key: 'groups' },
    { table: 'fiado', url: '/api/fiado', key: 'debts' },
    { table: 'coupons', url: '/api/coupons' },
    { table: 'loyalty_rewards', url: '/api/loyalty/rewards' },
    { table: 'cash_register', url: '/api/cash-register', key: 'entries' },
  ]

  for (const { table, url, key } of endpoints) {
    try {
      let fetchUrl = `${serverUrl}${url}`
      if (lastSync && url !== '/api/store') {
        fetchUrl += `?since=${lastSync}`
      }

      const res = await fetch(fetchUrl, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        signal: AbortSignal.timeout(10000)
      })

      if (!res.ok) continue
      const data: any = await res.json()

      const items = Array.isArray(data) ? data : (data[key || table] || data.items || data.debts || data.entries || data.groups || [])
      for (const remote of items) {
        mergeRemoteItem(table, remote)
      }

      if (table === 'complement_groups') {
        for (const group of items) {
          if (Array.isArray(group.items)) {
            for (const item of group.items) {
              mergeRemoteItem('complements', { ...item, group_id: group.id || item.groupId })
            }
          }
        }
      }

      if (table === 'products') {
        for (const remote of items) {
          if (remote.image && !remote.image.startsWith('local-cache://') && !remote.image.startsWith('data:')) {
            cacheProductImage(remote.id, remote.image)
          }
        }
      }
    } catch {}
  }

  try {
    const { forceSaveDb } = await import('./database')
    forceSaveDb()
  } catch {}

  db.run("INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('last_pull_at', ?)",
    [new Date().toISOString()])
}

function mergeRemoteItem(table: string, remote: any): void {
  const db = getDb()
  const id = remote.id

  const existing = dbGet(`SELECT id FROM ${table} WHERE id = ?`, [id])

  if (table === 'company_settings') {
    const columnMap: Record<string, string> = {
      storeName: 'store_name',
      storeIcon: 'store_icon',
      primaryColor: 'primary_color',
      primaryDark: 'primary_dark',
      paymentPixKey: 'payment_pix_key',
      paymentPixName: 'payment_pix_name',
      paymentCardInfo: 'payment_card_info',
      paymentCashInfo: 'payment_cash_info',
      footerText: 'footer_text',
      logoUrl: 'logo_url',
      openingHours: 'opening_hours',
      deliveryFee: 'delivery_fee',
      freeDeliveryFrom: 'free_delivery_from',
      schedulingEnabled: 'scheduling_enabled',
      isOpen: 'is_open',
    }
    if (existing) {
      const sets: string[] = []
      const vals: any[] = []
      for (const [key, value] of Object.entries(remote)) {
        if (key === 'id') continue
        const col = columnMap[key] || key
        sets.push(`${col} = ?`)
        vals.push(typeof value === 'object' ? JSON.stringify(value) : value)
      }
      if (sets.length > 0) {
        vals.push('main')
        dbRun(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`, vals)
      }
    } else {
      const keys = Object.keys(remote).filter(k => k !== 'id')
      const mappedKeys = keys.map(k => columnMap[k] || k)
      const placeholders = mappedKeys.map(() => '?').join(', ')
      dbRun(`INSERT INTO ${table} (id, ${mappedKeys.join(', ')}) VALUES (?, ${placeholders})`,
        ['main', ...keys.map(k => typeof remote[k] === 'object' ? JSON.stringify(remote[k]) : remote[k])])
    }
    return
  }

  if (existing) {
    const sets: string[] = []
    const vals: any[] = []
    for (const [key, value] of Object.entries(remote)) {
      if (key === 'id') continue
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      sets.push(`${col} = ?`)
      vals.push(typeof value === 'object' ? JSON.stringify(value) : value)
    }
    if (sets.length > 0) {
      vals.push(id)
      dbRun(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`, vals)
    }
  } else {
    const mapped: Record<string, any> = {}
    for (const [key, value] of Object.entries(remote)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      mapped[col] = typeof value === 'object' ? JSON.stringify(value) : value
    }
    const cols = Object.keys(mapped)
    const placeholders = cols.map(() => '?').join(', ')
    dbRun(`INSERT INTO ${table} (id, ${cols.join(', ')}) VALUES (?, ${placeholders})`,
      [id, ...Object.values(mapped)])
  }
}

function getAuthToken(): string {
  try {
    const db = getDb()
    return (dbGet("SELECT value FROM sync_metadata WHERE key = 'auth_token'") as any)?.value || ''
  } catch {
    return ''
  }
}

export function setAuthToken(token: string): void {
  const db = getDb()
  db.run("INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('auth_token', ?)", [token])
}

export function setServerUrl(url: string): void {
  const db = getDb()
  db.run("INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('server_url', ?)", [url])
}

export function getOnlineStatus(): boolean {
  return onlineStatus
}

export function triggerSync(): Promise<void> {
  return runSync()
}

function getHash(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}

async function cacheProductImage(productId: string, imageUrl: string): Promise<void> {
  try {
    const { cacheImage } = await import('./image-cache')
    const localPath = await cacheImage(imageUrl)
    if (localPath) {
      const hash = getHash(imageUrl)
      dbRun('UPDATE products SET image = ? WHERE id = ?', [`local-cache://${hash}`, productId])
    }
  } catch (err) {
    console.error(`[Sync] Erro ao cachear imagem do produto ${productId}:`, err)
  }
}
