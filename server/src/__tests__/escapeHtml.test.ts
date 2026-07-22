import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../database'

describe('escapeHtml', () => {
  it('escapes HTML entities', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("O'Brien")).toBe('O&#039;Brien')
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B')
  })

  it('handles null/undefined', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('leaves clean strings unchanged', () => {
    expect(escapeHtml('João da Silva')).toBe('João da Silva')
  })
})
