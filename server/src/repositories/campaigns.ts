import { createRepository, BaseRepository } from './base'
import { Campaign } from './types'

export const campaignsRepository: BaseRepository<Campaign> = createRepository<Campaign>('campaigns', {
  columns: ['name', 'message', 'filters', 'status', 'sent_count', 'is_active'],
})
