import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isAdminUser, listAllEvents, listMyEvents } from '../services/analytics'
import type { AnalyticsEvent } from '../services/analytics'
import { listAllSpecsForAdmin, listSpecs } from '../services/specs'
import type { Spec } from '../services/specs'
import { BarChart } from '../components/charts/BarChart'
import { TrendChart } from '../components/charts/TrendChart'
import { Heatmap } from '../components/charts/Heatmap'

type Tab = 'dashboard' | 'funnel' | 'retention'
type ViewMode = 'mine' | 'all'

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'funnel', label: '퍼널' },
  { key: 'retention', label: '리텐션' },
]

// 관리자에게만 보이는 "내 데이터 / 전체 사용자" 전환 — TABS와 완전히 같은 밑줄 탭
// 시각 패턴을 재사용한다 (새 토글 스타일을 만들지 않는다).
const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'mine', label: '내 데이터' },
  { key: 'all', label: '전체 사용자' },
]

// 이벤트 로그에 specId가 없어 "이 스펙의 생성 -> 발행"을 정확히 이어 붙일 수 없다.
// 그래서 대시보드/퍼널은 같은 기간(최근 30일) 이벤트 전체를 집계 단위로 쓴다.
const WINDOW_DAYS = 30
const MAX_RETENTION_COLUMNS = 8
const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_WEEK = 7 * MS_PER_DAY

const EVENT_LABELS: Record<string, string> = {
  spec_created: '스펙 생성',
  draft_generated: '초안 생성',
  section_regenerated: '섹션 재작성',
  gap_check_used: '빈틈 점검',
  published_toggled: '발행 토글',
  doctype_created: '문서 타입 생성',
  template_imported_from_community: '템플릿 가져오기',
  signed_in: '로그인',
}

function eventLabel(name: string): string {
  return EVENT_LABELS[name] ?? name
}

// 아래 5개는 날짜/주차 경계 엣지케이스가 있는 순수 함수라 Analytics.test.ts에서
// 직접 검증하기 위해 export한다 (동작은 그대로) — CONVENTIONS.md 단위테스트 기준 참고.
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function formatDayLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  return `${Number(month)}/${Number(day)}`
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const mondayOffset = (d.getDay() + 6) % 7 // 월요일 = 0
  d.setDate(d.getDate() - mondayOffset)
  return d
}

export function weekLabel(weekStart: Date): string {
  return `${weekStart.getMonth() + 1}/${weekStart.getDate()} 주`
}

export function weeksBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_WEEK)
}

export function Analytics() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')

  // 관리자 판별: 확인이 끝나기 전에는 항상 false로 둔다 — 토글을 선제적으로 보여주지 않는다.
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('mine')

  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  const [specs, setSpecs] = useState<Spec[]>([])
  const [specsLoading, setSpecsLoading] = useState(true)
  const [retentionDocType, setRetentionDocType] = useState('')

  useEffect(() => {
    if (!user) return
    isAdminUser(user.uid).then(setIsAdmin)
  }, [user])

  useEffect(() => {
    if (!user) return
    setEventsLoading(true)
    const since = new Date(Date.now() - WINDOW_DAYS * MS_PER_DAY)
    const request =
      viewMode === 'all' ? listAllEvents({ since }) : listMyEvents(user.uid, { since })
    request.then((result) => {
      setEvents(result)
      setEventsLoading(false)
    })
  }, [user, viewMode])

  useEffect(() => {
    if (!user) return
    setSpecsLoading(true)
    const request = viewMode === 'all' ? listAllSpecsForAdmin() : listSpecs(user.uid)
    request.then((result) => {
      setSpecs(result)
      setSpecsLoading(false)
    })
  }, [user, viewMode])

  // 대시보드: 최근 30일간 일별 이벤트 수 (빈 날짜도 0으로 채워 선이 끊기지 않게 함)
  const dailyCounts = useMemo(() => {
    const now = new Date()
    const days: string[] = []
    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * MS_PER_DAY)
      days.push(toDateKey(d))
    }
    const counts = new Map<string, number>(days.map((day) => [day, 0]))
    for (const event of events) {
      const key = toDateKey(event.timestamp.toDate())
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return days.map((day) => ({ date: day, value: counts.get(day) ?? 0 }))
  }, [events])

  // 대시보드: 이벤트 종류별 빈도 (많은 순)
  const countsByName = useMemo(() => {
    const counts = new Map<string, number>()
    for (const event of events) {
      counts.set(event.name, (counts.get(event.name) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, value]) => ({ label: eventLabel(name), value }))
      .sort((a, b) => b.value - a.value)
  }, [events])

  // 퍼널: 개별 문서 단위 조인이 불가능해서 같은 기간 동안의 단계별 이벤트 건수를 집계 비율로 본다.
  const funnelStages = useMemo(() => {
    const specCreated = events.filter((e) => e.name === 'spec_created').length
    const draftGenerated = events.filter((e) => e.name === 'draft_generated').length
    const publishedCount = events.filter(
      (e) => e.name === 'published_toggled' && e.properties.published === true,
    ).length
    return [
      { label: '스펙 생성', value: specCreated },
      { label: '초안 생성', value: draftGenerated },
      { label: '발행', value: publishedCount },
    ]
  }, [events])

  const funnelConversions = useMemo(() => {
    const rates: (number | null)[] = []
    for (let i = 1; i < funnelStages.length; i++) {
      const prev = funnelStages[i - 1].value
      const curr = funnelStages[i].value
      rates.push(prev > 0 ? Math.round((curr / prev) * 100) : null)
    }
    return rates
  }, [funnelStages])

  // "전체 사용자" 모드 전용: 이벤트엔 authorName이 없어 uid로만 집계할 수 있지만,
  // 화면엔 uid를 그대로 노출하지 않는다 (커뮤니티 기능의 "이름은 노출, uid/이메일은 비노출"
  // 원칙 재사용) — 같은 시점에 불러온 specs의 uid -> authorName으로 표시용 라벨만 만든다.
  // 매칭되는 스펙이 없는 uid(아직 스펙을 안 만든 사용자 등)는 "알 수 없음"으로 대체한다.
  const usersByActivity = useMemo(() => {
    if (viewMode !== 'all') return []
    const nameByUid = new Map<string, string>()
    for (const spec of specs) {
      if (!nameByUid.has(spec.uid)) nameByUid.set(spec.uid, spec.authorName)
    }
    const counts = new Map<string, number>()
    for (const event of events) {
      const label = nameByUid.get(event.uid) ?? '알 수 없음'
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [events, specs, viewMode])

  const specDocTypes = useMemo(
    () => Array.from(new Set(specs.map((spec) => spec.docType))),
    [specs],
  )

  // 리텐션: 이벤트 로그가 아니라 listSpecs()의 createdAt/updatedAt으로 계산.
  // createdAt이 속한 주(월요일 시작) 단위로 코호트를 묶고, updatedAt이 createdAt로부터
  // N주 이상 지난 뒤에도 갱신됐는지를 "다시 돌아와서 수정함"의 근사치로 쓴다.
  const retention = useMemo(() => {
    const filtered = retentionDocType
      ? specs.filter((spec) => spec.docType === retentionDocType)
      : specs
    if (filtered.length === 0) {
      return { rowLabels: [] as string[], columnLabels: [] as string[], cells: [] as (number | null)[][] }
    }

    const now = new Date()
    const cohortsByWeek = new Map<string, { weekStart: Date; specs: Spec[] }>()
    for (const spec of filtered) {
      const weekStart = startOfWeek(spec.createdAt.toDate())
      const key = toDateKey(weekStart)
      const cohort = cohortsByWeek.get(key)
      if (cohort) {
        cohort.specs.push(spec)
      } else {
        cohortsByWeek.set(key, { weekStart, specs: [spec] })
      }
    }

    const cohortList = Array.from(cohortsByWeek.values()).sort(
      (a, b) => a.weekStart.getTime() - b.weekStart.getTime(),
    )

    const maxAgeWeeks = cohortList.reduce(
      (max, cohort) => Math.max(max, weeksBetween(cohort.weekStart, now)),
      0,
    )
    const numColumns = Math.min(MAX_RETENTION_COLUMNS, maxAgeWeeks + 1)
    const columnLabels = Array.from({ length: numColumns }, (_, j) => `${j}주차`)

    const rowLabels = cohortList.map((cohort) => weekLabel(cohort.weekStart))
    const cells = cohortList.map((cohort) => {
      const cohortAgeWeeks = weeksBetween(cohort.weekStart, now)
      return columnLabels.map((_, j) => {
        if (cohortAgeWeeks < j) return null
        const touched = cohort.specs.filter(
          (spec) => weeksBetween(spec.createdAt.toDate(), spec.updatedAt.toDate()) >= j,
        ).length
        return Math.round((touched / cohort.specs.length) * 100)
      })
    })

    return { rowLabels, columnLabels, cells }
  }, [specs, retentionDocType])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">내 활동 분석</h1>
        <p className="text-sm text-slate-500">
          {viewMode === 'all'
            ? '관리자 권한으로 전체 사용자의 활동을 보고 있습니다.'
            : '다른 사용자 데이터는 보이지 않습니다 — 내 활동만 나에게 보이는 개인용 분석입니다.'}
        </p>
      </div>

      {isAdmin && (
        <div className="mb-6 flex gap-2 border-b border-slate-200">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setViewMode(mode.key)}
              aria-current={viewMode === mode.key ? 'page' : undefined}
              className={
                viewMode === mode.key
                  ? 'border-b-2 border-primary-500 px-3 py-2 text-sm font-medium text-primary-600'
                  : 'border-b-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:text-slate-900'
              }
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? 'page' : undefined}
            className={
              tab === t.key
                ? 'border-b-2 border-primary-500 px-3 py-2 text-sm font-medium text-primary-600'
                : 'border-b-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:text-slate-900'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' &&
        (eventsLoading ? (
          <p className="text-slate-500">불러오는 중...</p>
        ) : events.length === 0 ? (
          <p className="text-slate-500">아직 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-1 text-sm font-semibold text-slate-700">일별 활동량</h2>
              <p className="mb-3 text-xs text-slate-500">
                최근 {WINDOW_DAYS}일간 하루에 발생한 이벤트 수입니다.
              </p>
              <TrendChart data={dailyCounts} valueUnit="건" formatDate={formatDayLabel} />
            </section>
            <section>
              <h2 className="mb-1 text-sm font-semibold text-slate-700">활동 종류별 빈도</h2>
              <p className="mb-3 text-xs text-slate-500">
                최근 {WINDOW_DAYS}일간 어떤 활동을 얼마나 했는지 보여줍니다.
              </p>
              <BarChart data={countsByName} valueUnit="건" />
            </section>
            {viewMode === 'all' && usersByActivity.length > 0 && (
              <section>
                <h2 className="mb-1 text-sm font-semibold text-slate-700">사용자별 활동</h2>
                <p className="mb-3 text-xs text-slate-500">
                  최근 {WINDOW_DAYS}일간 사용자별로 얼마나 활동했는지 보여줍니다. 표시 이름이
                  없는 사용자는 "알 수 없음"으로 표시됩니다.
                </p>
                <BarChart data={usersByActivity} valueUnit="건" />
              </section>
            )}
          </div>
        ))}

      {tab === 'funnel' &&
        (eventsLoading ? (
          <p className="text-slate-500">불러오는 중...</p>
        ) : events.length === 0 ? (
          <p className="text-slate-500">아직 데이터가 없습니다.</p>
        ) : (
          <section>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">생성 대비 비율</h2>
            <p className="mb-3 text-xs text-slate-500">
              최근 {WINDOW_DAYS}일간 발생한 이벤트 건수를 단계별로 센 값입니다. 이벤트 기록에
              문서 식별자가 없어 특정 문서 하나의 정확한 진행 경로가 아니라, 같은 기간의 단계별
              건수 비율입니다.
            </p>
            <BarChart data={funnelStages} valueUnit="건" />
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
              {funnelStages.slice(1).map((stage, i) => (
                <span key={stage.label} className="rounded-full bg-slate-100 px-3 py-1">
                  {funnelStages[i].label} → {stage.label}:{' '}
                  {funnelConversions[i] === null ? '—' : `${funnelConversions[i]}%`}
                </span>
              ))}
            </div>
          </section>
        ))}

      {tab === 'retention' &&
        (specsLoading ? (
          <p className="text-slate-500">불러오는 중...</p>
        ) : specs.length === 0 ? (
          <p className="text-slate-500">아직 작성한 스펙이 없습니다.</p>
        ) : (
          <section>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">코호트별 재방문 비율</h2>
            <p className="mb-3 text-xs text-slate-500">
              스펙을 만든 주(코호트)별로, N주가 지난 뒤에도 그 문서를 다시 열어 수정했는지를
              비율로 보여줍니다. 아직 그 기간에 도달하지 않은 코호트는 빈 칸(-)으로 표시됩니다.
            </p>

            {specDocTypes.length > 1 && (
              <div className="mb-4">
                <label
                  htmlFor="retention-doctype-filter"
                  className="mb-1 block text-xs font-medium text-slate-500"
                >
                  문서 타입
                </label>
                <select
                  id="retention-doctype-filter"
                  value={retentionDocType}
                  onChange={(e) => setRetentionDocType(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none sm:w-auto"
                >
                  <option value="">전체</option>
                  {specDocTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Heatmap
              rowLabels={retention.rowLabels}
              columnLabels={retention.columnLabels}
              cells={retention.cells}
            />
          </section>
        ))}
    </main>
  )
}
