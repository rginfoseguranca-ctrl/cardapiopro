import { createRepository, BaseRepository } from './base'
import { Invoice } from './types'

export const invoicesRepository: BaseRepository<Invoice> = createRepository<Invoice>('invoices', {
  columns: ['order_id', 'status', 'nfe_number', 'xml_url'],
})

export function nextNfeNumber(
  storeId: string | null,
  repo: BaseRepository<Invoice> = invoicesRepository
): number {
  const rows = repo.raw(
    storeId,
    `SELECT nfe_number FROM invoices WHERE store_id = ? AND nfe_number IS NOT NULL AND nfe_number != ''`,
    [storeId ?? 'main']
  )
  let max = 0
  for (const row of rows) {
    const n = parseInt(String(row.nfe_number).replace(/\D/g, ''), 10)
    if (!Number.isNaN(n) && n > max) max = n
  }
  return max
}
