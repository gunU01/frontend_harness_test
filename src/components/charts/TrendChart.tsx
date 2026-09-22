import { useState } from 'react'
import { ChartTooltip } from './ChartTooltip'
import { clamp, clampTooltipX, estimateTooltipWidth, pointX, scaleValueToY } from './chartMath'

export interface TrendChartDatum {
  /** 'YYYY-MM-DD' 등 날짜 문자열. data는 호출 쪽에서 이미 날짜순 정렬되어 있어야 한다. */
  date: string
  value: number
}

export interface TrendChartProps {
  data: TrendChartDatum[]
  /** 값의 단위 (예: "건"). 툴팁/표 헤더에 붙는다. */
  valueUnit?: string
  /** 날짜 문자열을 사람이 읽을 라벨로 바꾸는 함수. 기본은 원본 문자열 그대로. */
  formatDate?: (date: string) => string
  className?: string
}

const CHART_WIDTH = 480
const CHART_HEIGHT = 200
const TOP_PADDING = 16
const BOTTOM_LABEL_SPACE = 24
const PLOT_HEIGHT = CHART_HEIGHT - TOP_PADDING - BOTTOM_LABEL_SPACE

// "최근 30일간 일별 건수"처럼 시간 흐름에 따른 값 하나를 보여주는 추세 차트.
// dataviz 스킬 기준 "크기 비교" 작업이라 primary 한 가지 색조만 쓰고, 값이 1~3개뿐이어도
// 선이 안 보이거나 이상해지지 않도록 별도로 처리한다.
export function TrendChart({
  data,
  valueUnit = '',
  formatDate = (date) => date,
  className,
}: TrendChartProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const values = data.map((d) => d.value)
  const minValue = Math.min(0, ...values)
  const maxValue = Math.max(1, ...values)
  const baselineY = scaleValueToY(minValue, minValue, maxValue, PLOT_HEIGHT, TOP_PADDING)

  const points = data.map((d, i) => ({
    ...d,
    x: pointX(i, data.length, CHART_WIDTH),
    y: scaleValueToY(d.value, minValue, maxValue, PLOT_HEIGHT, TOP_PADDING),
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : ''

  const bandWidth = data.length > 0 ? CHART_WIDTH / data.length : CHART_WIDTH

  return (
    <div className={`w-full ${className ?? ''}`}>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
        >
          {view === 'chart' ? '표로 보기' : '차트로 보기'}
        </button>
      </div>

      {view === 'chart' ? (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`기간별 ${valueUnit || '값'} 추세 그래프`}
        >
          <line
            x1={0}
            x2={CHART_WIDTH}
            y1={baselineY}
            y2={baselineY}
            className="stroke-slate-200 stroke-1"
          />

          {areaPath && <path d={areaPath} className="fill-primary-100 opacity-40" />}
          {points.length > 1 && (
            <path d={linePath} fill="none" className="stroke-primary-500 stroke-2" />
          )}

          {points.map((p, i) => {
            const rectX = clamp(p.x - bandWidth / 2, 0, Math.max(CHART_WIDTH - bandWidth, 0))
            const label = formatDate(p.date)
            const tooltipLines = [label, `${p.value}${valueUnit}`]
            const tooltipX = clampTooltipX(p.x, estimateTooltipWidth(tooltipLines), CHART_WIDTH)

            return (
              <g
                key={`${p.date}-${i}`}
                tabIndex={0}
                role="img"
                aria-label={`${label}: ${p.value}${valueUnit}`}
                className="group outline-none"
              >
                {/* 히트 영역: 실제 점 근처가 아니어도 폭 넓게 잡아 호버/포커스가 쉽도록 함 */}
                <rect
                  x={rectX}
                  y={0}
                  width={bandWidth}
                  height={CHART_HEIGHT}
                  fill="transparent"
                />
                <line
                  x1={p.x}
                  x2={p.x}
                  y1={TOP_PADDING}
                  y2={baselineY}
                  className="stroke-slate-300 stroke-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                />
                <circle cx={p.x} cy={p.y} r={4} className="fill-primary-500" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={7}
                  className="fill-none stroke-primary-500 stroke-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                />
                <ChartTooltip
                  x={tooltipX}
                  y={p.y - 12}
                  lines={tooltipLines}
                  className="opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                />
              </g>
            )
          })}
        </svg>
      ) : (
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">기간별 {valueUnit || '값'} 표</caption>
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th scope="col" className="py-1.5 pr-4 font-medium">
                날짜
              </th>
              <th scope="col" className="py-1.5 font-medium">
                {valueUnit ? `값 (${valueUnit})` : '값'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={`${d.date}-${i}`} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 pr-4 text-slate-700">{formatDate(d.date)}</td>
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
