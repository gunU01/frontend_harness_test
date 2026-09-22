import { useState } from 'react'
import { PRIMARY_HEX, getContrastTextClass, valueToPrimaryShade, type PrimaryShade } from './chartMath'

export interface HeatmapProps {
  /** 코호트 라벨 (예: 가입 주차). 행. */
  rowLabels: string[]
  /** 경과 기간 라벨 (예: "0주차", "1주차"...). 열. */
  columnLabels: string[]
  /** cells[i][j] = rowLabels[i] 코호트의 columnLabels[j] 시점 값(0-100 %). 아직 도달하지 않은 등 데이터가 없으면 null. */
  cells: (number | null)[][]
  className?: string
}

// tailwind.config.js의 colors.primary 램프와 매칭되는 배경 클래스.
// Tailwind가 클래스명을 정적으로 스캔하므로, 문자열을 런타임에 조합(`bg-primary-${shade}`)하지 않고
// 완전한 클래스명을 그대로 여기 나열해 둔다.
const SHADE_BG_CLASS: Record<PrimaryShade, string> = {
  50: 'bg-primary-50',
  100: 'bg-primary-100',
  200: 'bg-primary-200',
  300: 'bg-primary-300',
  400: 'bg-primary-400',
  500: 'bg-primary-500',
  600: 'bg-primary-600',
  700: 'bg-primary-700',
  800: 'bg-primary-800',
  900: 'bg-primary-900',
}

// 코호트 x 경과기간 형태의 유지율 히트맵. dataviz 스킬 기준 "크기 비교" 작업이라
// primary 램프 하나의 명도 단계만으로 값의 크기를 표현하고(범례 불필요), 데이터가 없는
// 조합(아직 그 기간에 도달하지 않은 코호트)은 0%와 구분되게 점선 테두리로 비워둔다.
export function Heatmap({ rowLabels, columnLabels, cells, className }: HeatmapProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

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

      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <caption className="sr-only">코호트별 기간 경과 유지율 표</caption>
          <thead>
            <tr>
              <th scope="col" className="p-2">
                <span className="sr-only">코호트</span>
              </th>
              {columnLabels.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="p-2 text-center text-xs font-medium text-slate-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((row, i) => (
              <tr key={row}>
                <th
                  scope="row"
                  className="whitespace-nowrap p-2 text-left text-xs font-medium text-slate-500"
                >
                  {row}
                </th>
                {columnLabels.map((col, j) => {
                  const value = cells[i]?.[j] ?? null
                  const cellLabel = `${row} ${col}: ${value === null ? '데이터 없음' : `${value}%`}`

                  if (view === 'table') {
                    return (
                      <td key={col} className="p-1 text-center align-middle text-slate-700">
                        {value === null ? '-' : `${value}%`}
                      </td>
                    )
                  }

                  const shade = value === null ? null : valueToPrimaryShade(value)
                  const cellClass =
                    shade === null
                      ? 'border border-dashed border-slate-300 bg-white text-slate-400'
                      : `${SHADE_BG_CLASS[shade]} ${getContrastTextClass(PRIMARY_HEX[shade])}`

                  return (
                    <td key={col} className="p-1 text-center align-middle">
                      <button
                        type="button"
                        aria-label={cellLabel}
                        className={`group relative mx-auto flex h-9 w-14 items-center justify-center rounded-md text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${cellClass}`}
                      >
                        {value === null ? '-' : `${value}%`}
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                          {cellLabel}
                        </span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
