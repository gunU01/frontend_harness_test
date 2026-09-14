import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPublishedSpecs } from '../services/specs'
import type { Spec } from '../services/specs'
import { toRelativeTime } from '../lib/relativeTime'

export function Community() {
  const [specs, setSpecs] = useState<Spec[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPublishedSpecs().then((result) => {
      setSpecs(result)
      setLoading(false)
    })
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">커뮤니티</h1>
        <p className="text-sm text-slate-500">공개된 문서를 둘러보세요.</p>
      </div>

      {loading ? (
        <p className="text-slate-500">불러오는 중...</p>
      ) : specs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-slate-500">아직 공개된 문서가 없습니다.</p>
          <Link
            to="/specs"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            스펙 만들러 가기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {specs.map((spec) => (
            <Link
              key={spec.id}
              to={`/community/${spec.id}`}
              className="rounded-lg border border-slate-200 p-4 transition-shadow hover:border-slate-300 hover:shadow-sm"
            >
              <h2 className="mb-1 font-medium text-slate-900">{spec.title}</h2>
              <p className="mb-1 text-xs text-slate-500">{spec.docType}</p>
              <p className="mb-1 text-sm text-slate-500">{spec.oneLiner}</p>
              <p className="text-xs text-slate-400">{toRelativeTime(spec.updatedAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
