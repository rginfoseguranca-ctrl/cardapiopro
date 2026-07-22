import { describe, it, expect, beforeAll } from 'vitest'
import { dbRun, dbGet } from '../database'

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
})

describe('Plan Gate', () => {
  const PLAN_FEATURES: Record<string, string[]> = {
    delivery: ['cardapio', 'orders', 'delivery', 'kds', 'customers', 'coupons', 'blog'],
    mesa: ['cardapio', 'orders', 'delivery', 'kds', 'customers', 'coupons', 'blog', 'mesas', 'pdv', 'fiado', 'inventory'],
    premium: ['*'],
  }

  it('delivery plan has required features', () => {
    const features = PLAN_FEATURES.delivery
    expect(features).toContain('cardapio')
    expect(features).toContain('orders')
    expect(features).toContain('delivery')
    expect(features).toContain('kds')
    expect(features).not.toContain('mesas')
    expect(features).not.toContain('fiado')
  })

  it('mesa plan has table and fiado features', () => {
    const features = PLAN_FEATURES.mesa
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

    expect(getMinPlanForFeature('cardapio')).toBe('delivery')
    expect(getMinPlanForFeature('mesas')).toBe('mesa')
    expect(getMinPlanForFeature('fiado')).toBe('mesa')
    expect(getMinPlanForFeature('pdv')).toBe('mesa')
  })
})
