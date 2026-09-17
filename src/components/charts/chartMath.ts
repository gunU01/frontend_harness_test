// src/components/charts/ 아래 차트 컴포넌트들이 공유하는 순수 계산 함수 모음.
// React/SVG에 의존하지 않는 입력 -> 출력 함수만 둔다 (vitest 단위 테스트 대상).

/** value를 [min, max] 범위로 자른다. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 막대 그래프에서 값(value)을 픽셀 높이로 환산한다.
 * maxValue가 0 이하면(전부 0인 데이터) 0을 반환해 나눗셈 오류를 피한다.
 */
export function scaleToHeight(value: number, maxValue: number, maxHeight: number): number {
  if (maxValue <= 0) return 0
  return clamp((value / maxValue) * maxHeight, 0, maxHeight)
}

/**
 * 위쪽 모서리만 둥근 막대 path를 만든다 (SVG rect는 모서리를 개별 지정할 수 없어서 path로 그린다).
 * radius는 막대 폭/높이보다 클 수 없도록 자동으로 줄인다.
 */
export function roundedTopBarPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  const r = clamp(radius, 0, Math.min(width / 2, height))
  if (r <= 0) {
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`
  }
  return [
    `M ${x} ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `A ${r} ${r} 0 0 1 ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    `L ${x} ${y + height}`,
    'Z',
  ].join(' ')
}

/**
 * n개의 점을 [0, width] 구간에 균등 배치했을 때 i번째 점의 x좌표.
 * 점이 1개뿐이면 가운데(width/2)에 둬서 "폭 0짜리 선"처럼 안 보이게 한다.
 */
export function pointX(index: number, count: number, width: number): number {
  if (count <= 1) return width / 2
  return (index / (count - 1)) * width
}

/**
 * 값(value)을 y좌표로 환산한다 (SVG는 아래로 갈수록 y가 커지므로 뒤집는다).
 * min === max(값이 전부 같음)면 세로 중앙에 평평한 선을 그리도록 한다.
 */
export function scaleValueToY(
  value: number,
  minValue: number,
  maxValue: number,
  plotHeight: number,
  topPadding: number,
): number {
  if (maxValue === minValue) return topPadding + plotHeight / 2
  const ratio = (value - minValue) / (maxValue - minValue)
  return topPadding + plotHeight - clamp(ratio, 0, 1) * plotHeight
}

/** 툴팁 상자가 차트 좌우 경계를 벗어나지 않도록 중심 x좌표를 보정한다. */
export function clampTooltipX(centerX: number, tooltipWidth: number, chartWidth: number): number {
  const half = tooltipWidth / 2
  return clamp(centerX, half, chartWidth - half)
}

/** primary 색상 램프 중 히트맵 셀 채우기에 쓰는 단계. tailwind.config.js의 colors.primary와 반드시 동기화. */
export const PRIMARY_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
export type PrimaryShade = (typeof PRIMARY_SHADES)[number]

// tailwind.config.js의 theme.extend.colors.primary 값과 동일해야 한다.
export const PRIMARY_HEX: Record<PrimaryShade, string> = {
  50: '#E8F3FF',
  100: '#C9E2FF',
  200: '#90C2FF',
  300: '#64A8FF',
  400: '#4593FC',
  500: '#3182F6',
  600: '#2272EB',
  700: '#1B64DA',
  800: '#1957C2',
  900: '#194AA6',
}

/** 0-100 퍼센트 값을 primary 램프의 한 단계로 매핑한다 (낮을수록 밝게, 높을수록 어둡게). */
export function valueToPrimaryShade(value: number): PrimaryShade {
  const ratio = clamp(value, 0, 100) / 100
  const index = Math.round(ratio * (PRIMARY_SHADES.length - 1))
  return PRIMARY_SHADES[clamp(index, 0, PRIMARY_SHADES.length - 1)]
}

/**
 * 배경 hex 색 위에서 잘 읽히는 글자색을 고른다 (YIQ 체감 밝기 공식).
 * 밝은 배경 -> 어두운 글자, 어두운 배경 -> 흰 글자.
 */
export function getContrastTextClass(hex: string): 'text-slate-900' | 'text-white' {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness >= 150 ? 'text-slate-900' : 'text-white'
}

/** 텍스트 길이 기반으로 SVG 툴팁 상자의 대략적인 너비를 추정한다 (글자폭 측정 API 없이 근사치만 사용). */
export function estimateTooltipWidth(lines: string[], charWidth = 7, paddingX = 16): number {
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0)
  return longest * charWidth + paddingX
}
