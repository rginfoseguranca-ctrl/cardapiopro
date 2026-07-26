import { getDb, generateId, dbAll, dbRun, dbGet } from './database'

let syncInterval: NodeJS.Timeout | null = null
let isSyncing = false
let onlineStatus = false

const SERVER_URL = process.env.API_URL || 'http://localhost:3001'

export function startSyncEngine(): void {
  try {
    const serverUrl = (dbGet("SELECT value FROM sync_metadata WHERE key = 'server_url'") as any)?.value
    if (!serverUrl && !process.env.API_URL) {
      console.log('[Sync] Sem servidor configurado — modo offline puro')
      return
    }
  } catch {}

  console.log('[Sync] Motor iniciado — verificando a cada 30s')
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
    const res = await fetch(`${SERVER_URL}/health`, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

async function pushPendingChanges(): Promise<void> {
  const db = getDb()
  const pending = dbAll(
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at LIMIT 50"
  )

  if (pending.length === 0) return
  console.log(`[Sync] Enviando ${pending.length} alterações pendentes...`)

  for (const item of pending) {
    try {
      const payload = JSON.parse(item.payload)
      let endpoint = ''

      switch (item.entity_type) {
        case 'product': endpoint = item.operation === 'delete' ? `/products/${item.entity_id}` : (item.operation === 'update' ? `/products/${item.entity_id}` : '/products'); break
        case 'category': endpoint = item.operation === 'delete' ? `/categories/${item.entity_id}` : (item.operation === 'update' ? `/categories/${item.entity_id}` : '/categories'); break
        case 'order': endpoint = item.operation === 'update' ? `/orders/${item.entity_id}/status` : '/orders'; break
        case 'table': endpoint = item.operation === 'delete' ? `/tables/${item.entity_id}` : (item.operation === 'update' ? `/tables/${item.entity_id}` : '/tables'); break
        case 'customer': endpoint = '/customers'; break
        case 'store_settings': endpoint = '/store'; break
        case 'fiado': endpoint = '/fiado'; break
        default: continue
      }

      const method = item.operation === 'delete' ? 'DELETE' : (item.operation === 'update' ? 'PUT' : 'POST')

      const res = await fetch(`${SERVER_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': item.idempotency_key,
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      })

      if (res.ok) {
        dbRun("UPDATE sync_queue SET status = 'synced' WHERE id = ?", [item.id])
      } else if (res.status >= 400 && res.status < 500) {
        dbRun("UPDATE sync_queue SET status = 'failed', last_error = ? WHERE id = ?",
          [`HTTP ${res.status}`, item.id])
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
  const lastSync = (dbGet("SELECT value FROM sync_metadata WHERE key = 'last_pull_at'") as any)?.value || null

  const endpoints = [
    { table: 'categories', url: '/categories' },
    { table: 'products', url: '/products' },
    { table: 'orders', url: '/orders' },
    { table: 'tables_list', url: '/tables' },
    { table: 'customers', url: '/customers' },
    { table: 'company_settings', url: '/store' },
  ]

  for (const { table, url } of endpoints) {
    try {
      let fetchUrl = `${SERVER_URL}${url}`
      if (lastSync && url !== '/store') {
        fetchUrl += `?since=${lastSync}`
      }

      const res = await fetch(fetchUrl, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        signal: AbortSignal.timeout(10000)
      })

      if (!res.ok) continue
      const data: any = await res.json()

      const items = Array.isArray(data) ? data : (data[table] || data.items || [])
      for (const remote of items) {
        mergeRemoteItem(table, remote)
      }
    } catch {}
  }

  db.run("INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('last_pull_at', ?)",
    [new Date().toISOString()])
}

function mergeRemoteItem(table: string, remote: any): void {
  const db = getDb()
  const id = remote.id

  const existing = dbGet(`SELECT id FROM ${table} WHERE id = ?`, [id])

  if (table === 'company_settings') {
    if (existing) {
      const sets: string[] = []
      const vals: any[] = []
      for (const [key, value] of Object.entries(remote)) {
        if (key === 'id') continue
        sets.push(`${key} = ?`)
        vals.push(typeof value === 'object' ? JSON.stringify(value) : value)
      }
      if (sets.length > 0) {
        vals.push('main')
        dbRun(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`, vals)
      }
    } else {
      const keys = Object.keys(remote).filter(k => k !== 'id')
      const placeholders = keys.map(() => '?').join(', ')
      dbRun(`INSERT INTO ${table} (id, ${keys.join(', ')}) VALUES (?, ${placeholders})`,
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
