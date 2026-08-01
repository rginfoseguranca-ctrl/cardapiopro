import { createRepository, BaseRepository } from './base'
import {
  FinancialAccount, FinancialCategory, FinancialTransaction, FinancialRecurring,
} from './types'

export const financialAccountsRepository: BaseRepository<FinancialAccount> = createRepository<FinancialAccount>('financial_accounts', {
  columns: ['name', 'type', 'bank', 'balance', 'is_active'],
})

export const financialCategoriesRepository: BaseRepository<FinancialCategory> = createRepository<FinancialCategory>('financial_categories', {
  columns: ['name', 'type', 'icon', 'color'],
})

export const financialTransactionsRepository: BaseRepository<FinancialTransaction> = createRepository<FinancialTransaction>('financial_transactions', {
  columns: [
    'account_id', 'category_id', 'type', 'description', 'amount', 'date', 'due_date',
    'paid_date', 'status', 'payment_method', 'notes', 'recurring_id', 'order_id', 'attachment',
  ],
})

export const financialRecurringRepository: BaseRepository<FinancialRecurring> = createRepository<FinancialRecurring>('financial_recurring', {
  columns: ['description', 'amount', 'type', 'category_id', 'account_id', 'frequency', 'interval_days', 'next_due', 'is_active'],
})

export function findAccountByName(storeId: string | null, name: string): FinancialAccount | null {
  return financialAccountsRepository.findOne(storeId, 'name = ?', [name])
}

export function findCategoryByName(storeId: string | null, name: string, type: string): FinancialCategory | null {
  return financialCategoriesRepository.findOne(storeId, 'name = ? AND type = ?', [name, type])
}

export function findTransactionByOrder(storeId: string | null, orderId: string): FinancialTransaction | null {
  if (!orderId) return null
  return financialTransactionsRepository.findOne(storeId, 'order_id = ?', [orderId])
}
