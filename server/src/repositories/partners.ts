import { createRepository, BaseRepository } from './base'
import { Partner } from './types'

export const partnersRepository: BaseRepository<Partner> = createRepository<Partner>('partners', {
  scoped: false,
  columns: ['name', 'company', 'email', 'phone', 'city'],
})
