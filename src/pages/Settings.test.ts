import { describe, expect, it } from 'vitest'
import { makeKey } from './Settings'

describe('makeKey', () => {
  it('slugifies Korean text', () => {
    expect(makeKey('한글 제목 테스트')).toBe('한글-제목-테스트')
  })

  it('lowercases uppercase input', () => {
    expect(makeKey('UPPERCASE Title')).toBe('uppercase-title')
  })

  it('collapses special characters into single hyphens and trims edge hyphens', () => {
    expect(makeKey('  My Title!! ')).toBe('my-title')
  })

  it('falls back to crypto.randomUUID() when the slug is empty', () => {
    const key = makeKey('***')
    expect(key).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('falls back to crypto.randomUUID() for an empty string', () => {
    const key = makeKey('')
    expect(key).toMatch(/^[0-9a-f-]{36}$/)
  })
})
