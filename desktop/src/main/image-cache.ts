import { app, protocol } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const CACHE_DIR = path.join(app.getPath('userData'), 'image-cache')

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
}

function getHash(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}

export function getCachedImagePath(url: string): string | null {
  if (!url || url.startsWith('data:') || url.startsWith('local-cache://')) return null

  ensureCacheDir()
  const ext = path.extname(url.split('?')[0]) || '.jpg'
  const hash = getHash(url)
  const filePath = path.join(CACHE_DIR, `${hash}${ext}`)

  return fs.existsSync(filePath) ? filePath : null
}

export async function cacheImage(url: string): Promise<string | null> {
  if (!url || url.startsWith('data:') || url.startsWith('local-cache://')) return null

  ensureCacheDir()
  const ext = path.extname(url.split('?')[0]) || '.jpg'
  const hash = getHash(url)
  const filePath = path.join(CACHE_DIR, `${hash}${ext}`)

  if (fs.existsSync(filePath)) return filePath

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(buffer))
    console.log(`[ImageCache] Cached: ${hash}${ext}`)
    return filePath
  } catch (err) {
    console.error('[ImageCache] Erro ao baixar:', err)
    return null
  }
}

export function registerLocalCacheProtocol(): void {
  protocol.handle('local-cache', (request) => {
    const url = new URL(request.url)
    const hash = url.hostname || url.pathname.replace(/^\//, '')

    ensureCacheDir()
    const files = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith(hash))

    if (files.length === 0) {
      return new Response('Not Found', { status: 404 })
    }

    const filePath = path.join(CACHE_DIR, files[0])
    const ext = path.extname(files[0]).toLowerCase()

    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    }

    const data = fs.readFileSync(filePath)
    return new Response(data, {
      headers: { 'Content-Type': mimeTypes[ext] || 'image/jpeg' }
    })
  })
}

export async function clearImageCache(): Promise<{ success: boolean }> {
  try {
    ensureCacheDir()
    const files = fs.readdirSync(CACHE_DIR)
    for (const file of files) {
      fs.unlinkSync(path.join(CACHE_DIR, file))
    }
    console.log(`[ImageCache] Cache limpo: ${files.length} imagens removidas`)
    return { success: true }
  } catch {
    return { success: false }
  }
}
