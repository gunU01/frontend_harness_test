import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createSpec, listSpecs } from '../services/specs'
import type { Spec, SpecStatus } from '../services/specs'
import { getOrCreateConfig } from '../services/config'

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
  const navigate = useNavigate()
  const [specs, setSpecs] = useState<Spec[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newOneLiner, setNewOneLiner] = useState('')

  useEffect(() => {
    if (!user) return
    listSpecs(user.uid).then((result) => {
      setSpecs(result)
      setLoading(false)
    })
  }, [user])

  async function handleCreate() {
    if (!user || !newTitle.trim()) return
    const config = await getOrCreateConfig(user.uid)
    const id = await createSpec(user.uid, newTitle.trim(), newOneLiner.trim(), config.template)
    navigate(`/specs/${id}`)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">스펙 목록</h1>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            새 스펙 만들기
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-8 flex flex-col gap-3 rounded-md border border-slate-200 p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="new-spec-title" className="text-xs text-slate-500">
              제목
            </label>
            <input
              id="new-spec-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="제목"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="new-spec-one-liner" className="text-xs text-slate-500">
              한 줄 문제 정의
            </label>
            <input
              id="new-spec-one-liner"
              value={newOneLiner}
              onChange={(e) => setNewOneLiner(e.target.value)}
              placeholder="한 줄 문제 정의"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              만들기
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
            >
              취소
            </button>
          </div>
        </div>
      )}

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
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="font-medium text-slate-900">{spec.title}</h2>
                <span
                  className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[spec.status]}`}
                >
                  {statusLabels[spec.status]}
                </span>
              </div>
              <p className="text-sm text-slate-500">{spec.oneLiner}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
