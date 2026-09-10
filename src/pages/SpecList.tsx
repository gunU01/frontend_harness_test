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

export default function SpecList() {
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
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            새 스펙 만들기
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-8 flex flex-col gap-2 rounded-md border border-slate-200 p-4">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="제목"
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={newOneLiner}
            onChange={(e) => setNewOneLiner(e.target.value)}
            placeholder="한 줄 문제 정의"
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
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
              className="rounded-md border border-slate-200 p-4 hover:border-slate-300"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="font-medium text-slate-900">{spec.title}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[spec.status]}`}>
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
