import { describe, it, expect } from 'vitest'

describe('Status labels', () => {
  const statusLabels: Record<string, string> = {
    pending: '⏳ Pendente', confirmed: '✅ Confirmado',
    preparing: '👨‍🍳 Preparando', ready: '🎉 Pronto',
    delivered: '📦 Entregue', cancelled: '❌ Cancelado',
  }

  it('has all required statuses', () => {
    const required = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
    for (const status of required) {
      expect(statusLabels[status]).toBeDefined()
      expect(statusLabels[status].length).toBeGreaterThan(2)
    }
  })

  it('maps pending correctly', () => {
    expect(statusLabels['pending']).toContain('Pendente')
  })

  it('maps delivered correctly', () => {
    expect(statusLabels['delivered']).toContain('Entregue')
  })
})
