import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSpec } from '../services/specs'
import type { Spec } from '../services/specs'

export function CommunityDetail() {
  const { id } = useParams<{ id: string }>()
  const [spec, setSpec] = useState<Spec | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getSpec(id)
      .then((result) => {
        setSpec(result)
        setLoading(false)
      })
      .catch(() => {
        setSpec(null)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-500">불러오는 중...</main>
  }

  if (!spec || !spec.published) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-500">찾을 수 없거나 비공개 문서입니다.</main>
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="mb-1 text-xs text-slate-500">{spec.docType}</p>
      <h1 className="mb-1 text-xl font-bold text-slate-900">{spec.title}</h1>
      <p className="mb-6 text-slate-500">{spec.oneLiner}</p>
      <div className="flex flex-col gap-6">
        {spec.sections.map((section) => (
          <div key={section.key}>
            <h2 className="mb-1 font-semibold text-slate-800">{section.title}</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-600">{section.content || '(빈 섹션)'}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
