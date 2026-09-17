import { useState } from 'react'
import { ChartTooltip } from './ChartTooltip'
import { clampTooltipX, estimateTooltipWidth, roundedTopBarPath, scaleToHeight } from './chartMath'

export interface BarChartDatum {
  label: string
  value: number
}

export interface BarChartProps {
  data: BarChartDatum[]
  /** 값의 단위 (예: "건"). 값 라벨/툴팁/표 헤더에 붙는다. */
  valueUnit?: string
  className?: string
}

const CHART_WIDTH = 480
const CHART_HEIGHT = 220
const BAR_GAP = 12
const TOP_LABEL_SPACE = 24
const BOTTOM_LABEL_SPACE = 28
const CORNER_RADIUS = 6

// 2~10개 정도의 항목을 세로 막대로 비교하는 차트. dataviz 스킬 기준 "크기 비교" 작업이라
// 카테고리 색이 아니라 primary 램프 한 가지 색조만 쓴다.
export function BarChart({ data, valueUnit = '', className }: BarChartProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const maxValue = Math.max(1, ...data.map((d) => d.value))
  const plotHeight = CHART_HEIGHT - TOP_LABEL_SPACE - BOTTOM_LABEL_SPACE
  const baselineY = CHART_HEIGHT - BOTTOM_LABEL_SPACE
  const barWidth =
    data.length > 0 ? (CHART_WIDTH - BAR_GAP * (data.length - 1)) / data.length : 0

  return (
    <div className={`w-full ${className ?? ''}`}>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          {view === 'chart' ? '표로 보기' : '차트로 보기'}
        </button>
      </div>

      {view === 'chart' ? (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`항목별 ${valueUnit || '값'} 비교 막대 그래프`}
        >
          <line
            x1={0}
            x2={CHART_WIDTH}
            y1={baselineY}
            y2={baselineY}
            className="stroke-slate-300 stroke-1"
          />
          {data.map((d, i) => {
            const barHeight = Math.max(scaleToHeight(d.value, maxValue, plotHeight), 1)
            const x = i * (barWidth + BAR_GAP)
            const y = baselineY - barHeight
            const radius = Math.min(CORNER_RADIUS, barWidth / 2, barHeight)
            const path = roundedTopBarPath(x, y, barWidth, barHeight, radius)
            const centerX = x + barWidth / 2
            const tooltipLines = [d.label, `${d.value}${valueUnit}`]
            const tooltipX = clampTooltipX(
              centerX,
              estimateTooltipWidth(tooltipLines),
              CHART_WIDTH,
            )

            return (
              <g
                key={`${d.label}-${i}`}
                tabIndex={0}
                role="img"
                aria-label={`${d.label}: ${d.value}${valueUnit}`}
                className="group outline-none"
              >
                <path
                  d={path}
                  className="fill-primary-400 transition-colors group-hover:fill-primary-600 group-focus:fill-primary-600"
                />
                <text
                  x={centerX}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-slate-600 text-[10px]"
                >
                  {d.value}
                </text>
                <text
                  x={centerX}
                  y={baselineY + 16}
                  textAnchor="middle"
                  className="fill-slate-600 text-[10px]"
                >
                  {d.label}
                </text>
                <ChartTooltip
                  x={tooltipX}
                  y={y - 14}
                  lines={tooltipLines}
                  className="opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                />
              </g>
            )
          })}
        </svg>
      ) : (
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">항목별 {valueUnit || '값'} 표</caption>
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th scope="col" className="py-1.5 pr-4 font-medium">
                항목
              </th>
              <th scope="col" className="py-1.5 font-medium">
                {valueUnit ? `값 (${valueUnit})` : '값'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={`${d.label}-${i}`} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 pr-4 text-slate-700">{d.label}</td>
                <td className="py-1.5 text-slate-700">
                  {d.value}
                  {valueUnit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
