import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { listSpecs } from '../services/specs'
import type { Spec, SpecStatus } from '../services/specs'
import { toRelativeTime } from '../lib/relativeTime'

const statusStyles: Record<SpecStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  review: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
}

const statusLabels: Record<SpecStatus, string> = {
  draft: '초안',
  review: '검토중',
  done: '완료',
}

export function SpecList() {
  const { user } = useAuth()
  const [specs, setSpecs] = useState<Spec[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listSpecs(user.uid).then((result) => {
      setSpecs(result)
      setLoading(false)
    })
  }, [user])

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">스펙 목록</h1>
        <Link
          to="/specs/new"
          className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
        >
          새 스펙 만들기
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">불러오는 중...</p>
      ) : specs.length === 0 ? (
        <p className="text-slate-500">아직 작성한 스펙이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {specs.map((spec) => (
            <Link
              key={spec.id}
              to={`/specs/${spec.id}`}
              className="rounded-lg border border-slate-200 p-4 transition-shadow hover:border-slate-300 hover:shadow-sm"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <h2 className="font-medium text-slate-900">{spec.title}</h2>
                <span
                  className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[spec.status]}`}
                >
                  {statusLabels[spec.status]}
                </span>
              </div>
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
