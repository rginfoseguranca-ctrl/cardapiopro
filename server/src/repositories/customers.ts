import { createRepository, BaseRepository } from './base'
import { Customer } from './types'

export const customersRepository: BaseRepository<Customer> = createRepository<Customer>('customers', {
  columns: [
    'name', 'phone', 'email', 'address', 'notes', 'tags',
    'total_orders', 'total_spent', 'last_order_at', 'updated_at',
  ],
})

export function findCustomerByPhone(storeId: string | null, phone: string): Customer | null {
  if (!phone) return null
  return customersRepository.findOne(storeId, 'phone = ?', [phone])
}

export function searchCustomers(storeId: string | null, query: string): Customer[] {
  if (!query) return []
  const like = `%${query}%`
  return customersRepository.findAll(
    storeId,
    'name LIKE ? OR phone LIKE ? OR email LIKE ?',
    [like, like, like],
    'total_spent DESC'
  )
}
