import { createRepository, BaseRepository } from './base'
import { Lead } from './types'

export const leadsRepository: BaseRepository<Lead> = createRepository<Lead>('leads', {
  scoped: false,
  columns: ['name', 'company', 'email', 'phone', 'segment', 'monthly_revenue'],
})
