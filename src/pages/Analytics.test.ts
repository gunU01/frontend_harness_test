import { describe, expect, it } from 'vitest'
import { formatDayLabel, startOfWeek, toDateKey, weekLabel, weeksBetween } from './Analytics'

describe('toDateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 8, 17))).toBe('2026-09-17')
  })
})

describe('formatDayLabel', () => {
  it('drops leading zeros from month/day', () => {
    expect(formatDayLabel('2026-09-07')).toBe('9/7')
  })
})

describe('startOfWeek', () => {
  it('keeps a Monday as-is', () => {
    // 2026-09-14는 월요일
    const monday = new Date(2026, 8, 14)
    expect(toDateKey(startOfWeek(monday))).toBe('2026-09-14')
  })

  it('rolls a Sunday back to the preceding Monday (not forward)', () => {
    // 2026-09-20은 일요일 -> 같은 주의 월요일인 09-14로 가야 함
    const sunday = new Date(2026, 8, 20)
    expect(toDateKey(startOfWeek(sunday))).toBe('2026-09-14')
  })

  it('handles a month boundary correctly', () => {
    // 2026-10-01은 목요일 -> 그 주의 월요일은 2026-09-28
    const thursday = new Date(2026, 9, 1)
    expect(toDateKey(startOfWeek(thursday))).toBe('2026-09-28')
  })
})

describe('weekLabel', () => {
  it('formats a week-start date as "M/D 주"', () => {
    expect(weekLabel(new Date(2026, 8, 14))).toBe('9/14 주')
  })
})

describe('weeksBetween', () => {
  it('returns 0 for the same day', () => {
    const d = new Date(2026, 8, 14)
    expect(weeksBetween(d, d)).toBe(0)
  })

  it('returns 0 for a gap shorter than 7 days (does not round up)', () => {
    const from = new Date(2026, 8, 14)
    const to = new Date(2026, 8, 20)
    expect(weeksBetween(from, to)).toBe(0)
  })

  it('returns exactly 1 at the 7-day mark', () => {
    const from = new Date(2026, 8, 14)
    const to = new Date(2026, 8, 21)
    expect(weeksBetween(from, to)).toBe(1)
  })

  it('floors partial weeks beyond a full week (e.g. 10 days -> 1 week)', () => {
    const from = new Date(2026, 8, 14)
    const to = new Date(2026, 8, 24)
    expect(weeksBetween(from, to)).toBe(1)
  })
})
