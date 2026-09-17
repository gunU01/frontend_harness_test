import { describe, expect, it, vi } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { toRelativeTime } from './relativeTime'

// 기준 시각을 고정해서 "지금으로부터 N분/시간/일 전" 경계를 결정적으로 테스트한다.
const NOW = new Date('2026-09-14T12:00:00.000Z').getTime()

function timestampMsAgo(ms: number): Timestamp {
  return Timestamp.fromMillis(NOW - ms)
}

describe('toRelativeTime', () => {
  it('returns 방금 for less than a minute ago', () => {
    vi.setSystemTime(NOW)
    expect(toRelativeTime(timestampMsAgo(0))).toBe('방금')
    expect(toRelativeTime(timestampMsAgo(59 * 1000))).toBe('방금')
    vi.useRealTimers()
  })

  it('returns N분 전 between 1 and 59 minutes ago', () => {
    vi.setSystemTime(NOW)
    expect(toRelativeTime(timestampMsAgo(60 * 1000))).toBe('1분 전')
    expect(toRelativeTime(timestampMsAgo(59 * 60 * 1000))).toBe('59분 전')
    vi.useRealTimers()
  })

  it('returns N시간 전 between 1 and 23 hours ago', () => {
    vi.setSystemTime(NOW)
    expect(toRelativeTime(timestampMsAgo(60 * 60 * 1000))).toBe('1시간 전')
    expect(toRelativeTime(timestampMsAgo(23 * 60 * 60 * 1000))).toBe('23시간 전')
    vi.useRealTimers()
  })

  it('returns N일 전 for 24 hours or more ago', () => {
    vi.setSystemTime(NOW)
    expect(toRelativeTime(timestampMsAgo(24 * 60 * 60 * 1000))).toBe('1일 전')
    expect(toRelativeTime(timestampMsAgo(10 * 24 * 60 * 60 * 1000))).toBe('10일 전')
    vi.useRealTimers()
  })
})
