import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPublishedSpecs } from '../services/specs'
import type { Spec } from '../services/specs'
import { toRelativeTime } from '../lib/relativeTime'

export function Community() {
  const [specs, setSpecs] = useState<Spec[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [docType, setDocType] = useState('')

  useEffect(() => {
    listPublishedSpecs().then((result) => {
      setSpecs(result)
      setLoading(false)
    })
  }, [])

  // 목록이 작아 서버 쿼리 없이 클라이언트에서만 필터링 (README "기능을 버린다" 기준과 동일)
  const docTypes = useMemo(() => Array.from(new Set(specs.map((spec) => spec.docType))), [specs])

  const filteredSpecs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return specs.filter((spec) => {
      const matchesQuery =
        !normalizedQuery ||
        spec.title.toLowerCase().includes(normalizedQuery) ||
        spec.oneLiner.toLowerCase().includes(normalizedQuery)
      const matchesDocType = !docType || spec.docType === docType
      return matchesQuery && matchesDocType
    })
  }, [specs, query, docType])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">커뮤니티</h1>
        <p className="text-sm text-slate-500">공개된 문서를 둘러보세요.</p>
      </div>

      {!loading && specs.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="community-search" className="sr-only">
              제목/한 줄 설명 검색
            </label>
            <input
              id="community-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목 또는 한 줄 설명 검색"
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label htmlFor="community-doctype-filter" className="sr-only">
              문서 타입 필터
            </label>
            <select
              id="community-doctype-filter"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 sm:w-auto"
            >
              <option value="">전체</option>
              {docTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">불러오는 중...</p>
      ) : specs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 p-10 text-center">
          <p className="text-slate-500">아직 공개된 문서가 없습니다.</p>
          <Link
            to="/specs"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            스펙 만들러 가기
          </Link>
        </div>
      ) : filteredSpecs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 p-10 text-center">
          <p className="text-slate-500">조건에 맞는 문서가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredSpecs.map((spec) => (
            <Link
              key={spec.id}
              to={`/community/${spec.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md"
            >
              <h2 className="mb-1 font-medium text-slate-900">{spec.title}</h2>
              <p className="mb-1 text-xs text-slate-500">
                {spec.docType} · {spec.authorName}
              </p>
              <p className="mb-1 text-sm text-slate-500">{spec.oneLiner}</p>
              <p className="text-xs text-slate-400">{toRelativeTime(spec.updatedAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
