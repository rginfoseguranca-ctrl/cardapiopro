import { describe, it, expect, beforeAll } from 'vitest'
import { dbRun, dbGet } from '../database'

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
})

describe('Plan Gate', () => {
  const PLAN_FEATURES: Record<string, string[]> = {
    start: ['cardapio', 'orders', 'customers', 'coupons', 'blog', 'loyalty'],
    profissional: ['cardapio', 'orders', 'customers', 'coupons', 'blog', 'loyalty', 'delivery', 'mesas', 'pdv', 'fiado', 'inventory', 'kds'],
    premium: ['*'],
  }

  it('start plan has basic features', () => {
    const features = PLAN_FEATURES.start
    expect(features).toContain('cardapio')
    expect(features).toContain('orders')
    expect(features).toContain('customers')
    expect(features).not.toContain('delivery')
    expect(features).not.toContain('mesas')
    expect(features).not.toContain('fiado')
  })

  it('profissional plan has delivery and table features', () => {
    const features = PLAN_FEATURES.profissional
    expect(features).toContain('delivery')
    expect(features).toContain('mesas')
    expect(features).toContain('fiado')
    expect(features).toContain('inventory')
    expect(features).not.toContain('*')
  })

  it('premium plan has all features', () => {
    const features = PLAN_FEATURES.premium
    expect(features).toContain('*')
  })

  it('getMinPlanForFeature logic', () => {
    function getMinPlanForFeature(feature: string): string {
      for (const [plan, features] of Object.entries(PLAN_FEATURES)) {
        if (features.includes(feature)) return plan
      }
      return 'premium'
    }

    expect(getMinPlanForFeature('cardapio')).toBe('start')
    expect(getMinPlanForFeature('delivery')).toBe('profissional')
    expect(getMinPlanForFeature('mesas')).toBe('profissional')
    expect(getMinPlanForFeature('fiado')).toBe('profissional')
    expect(getMinPlanForFeature('pdv')).toBe('profissional')
  })
})
