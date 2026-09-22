import { estimateTooltipWidth } from './chartMath'

export interface ChartTooltipProps {
  /** 툴팁이 가리키는 지점의 x좌표 (SVG 좌표계, 이미 화면 밖으로 안 나가게 보정된 값이어야 함) */
  x: number
  /** 툴팁 상자 "아래쪽" 끝 y좌표 — 이 좌표 위로 상자가 그려진다 */
  y: number
  lines: string[]
  className?: string
}

// BarChart와 LineChart(TrendChart)가 동일하게 "막대/점 위에 뜨는 작은 말풍선" 형태의
// 툴팁을 쓰고, 너비 추정/패딩/화살표 없는 사각형 스타일까지 완전히 동일해서 공용으로 뺐다.
// (컨벤션의 "3곳 이상에서 반복되면 공용화" 기준에는 아직 못 미치지만, 두 차트가 쓰는 로직이
// 텍스트 줄 수만 다를 뿐 완전히 같아서 복붙하면 오히려 어긋나기 쉽다고 판단함)
export function ChartTooltip({ x, y, lines, className }: ChartTooltipProps) {
  const paddingY = 6
  const lineHeight = 14
  const width = estimateTooltipWidth(lines)
  const height = lines.length * lineHeight + paddingY * 2
  const boxX = x - width / 2
  const boxY = y - height - 8

  return (
    <g className={`pointer-events-none ${className ?? ''}`}>
      <rect x={boxX} y={boxY} width={width} height={height} rx={6} className="fill-slate-800" />
      {lines.map((line, i) => (
        <text
          key={`${line}-${i}`}
          x={x}
          y={boxY + paddingY + lineHeight * (i + 0.75)}
          textAnchor="middle"
          className="fill-white text-[10px]"
        >
          {line}
        </text>
      ))}
    </g>
  )
}
