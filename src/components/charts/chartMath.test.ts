import { describe, expect, it } from 'vitest'
import {
  clamp,
  clampTooltipX,
  estimateTooltipWidth,
  getContrastTextClass,
  pointX,
  roundedTopBarPath,
  scaleToHeight,
  scaleValueToY,
  valueToPrimaryShade,
} from './chartMath'

describe('clamp', () => {
  it('passes through values already in range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to min/max at the boundaries', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('scaleToHeight', () => {
  it('scales proportionally to maxValue', () => {
    expect(scaleToHeight(50, 100, 200)).toBe(100)
    expect(scaleToHeight(100, 100, 200)).toBe(200)
  })

  it('returns 0 when maxValue is 0 (전부 0인 데이터) instead of dividing by zero', () => {
    expect(scaleToHeight(0, 0, 200)).toBe(0)
  })
})

describe('roundedTopBarPath', () => {
  it('starts and ends the path with the expected coordinates', () => {
    const d = roundedTopBarPath(0, 10, 40, 90, 6)
    expect(d.startsWith('M 0 16')).toBe(true)
    expect(d).toContain('L 40 100')
    expect(d).toContain('L 0 100')
    expect(d.endsWith('Z')).toBe(true)
  })

  it('falls back to a square-cornered rect when the bar has no width (막대 폭이 0)', () => {
    const d = roundedTopBarPath(0, 0, 0, 50, 6)
    expect(d).not.toContain('A')
  })
})

describe('pointX', () => {
  it('centers a single point instead of collapsing to the left edge', () => {
    expect(pointX(0, 1, 480)).toBe(240)
  })

  it('spreads multiple points evenly from 0 to width', () => {
    expect(pointX(0, 3, 480)).toBe(0)
    expect(pointX(2, 3, 480)).toBe(480)
    expect(pointX(1, 3, 480)).toBe(240)
  })
})

describe('scaleValueToY', () => {
  it('maps minValue to the bottom and maxValue to the top of the plot', () => {
    expect(scaleValueToY(0, 0, 100, 160, 16)).toBe(176)
    expect(scaleValueToY(100, 0, 100, 160, 16)).toBe(16)
  })

  it('draws a flat centered line when every value is equal (선이 안 사라지도록)', () => {
    expect(scaleValueToY(5, 5, 5, 160, 16)).toBe(16 + 80)
  })
})

describe('clampTooltipX', () => {
  it('keeps the tooltip centered when there is room', () => {
    expect(clampTooltipX(240, 60, 480)).toBe(240)
  })

  it('pushes the tooltip inward near the left/right edges so it does not overflow', () => {
    expect(clampTooltipX(0, 60, 480)).toBe(30)
    expect(clampTooltipX(480, 60, 480)).toBe(450)
  })
})

describe('estimateTooltipWidth', () => {
  it('grows with the longest line', () => {
    const short = estimateTooltipWidth(['12건'])
    const long = estimateTooltipWidth(['2026-09-17', '12건'])
    expect(long).toBeGreaterThan(short)
  })
})

describe('valueToPrimaryShade', () => {
  it('maps 0 to the lightest shade and 100 to the darkest', () => {
    expect(valueToPrimaryShade(0)).toBe(50)
    expect(valueToPrimaryShade(100)).toBe(900)
  })

  it('clamps out-of-range input instead of throwing', () => {
    expect(valueToPrimaryShade(-20)).toBe(50)
    expect(valueToPrimaryShade(150)).toBe(900)
  })
})

describe('getContrastTextClass', () => {
  it('picks dark text on light backgrounds', () => {
    expect(getContrastTextClass('#E8F3FF')).toBe('text-slate-900')
  })

  it('picks white text on dark backgrounds', () => {
    expect(getContrastTextClass('#194AA6')).toBe('text-white')
  })
})
