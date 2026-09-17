import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getSpec } from '../services/specs'
import type { Spec } from '../services/specs'
import type { DocTemplate } from '../lib/defaultTemplates'
import { trackEvent } from '../services/analytics'

export function CommunityDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
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

  function handleUseAsTemplate() {
    if (!spec) return
    if (!user) {
      navigate('/signin')
      return
    }
    const template: DocTemplate = {
      id: `from-${spec.id}`,
      name: spec.docType,
      sections: spec.sections.map((section) => ({
        key: section.key,
        title: section.title,
        hint: section.hint,
      })),
    }
    trackEvent(user.uid, 'template_imported_from_community', { sourceDocType: spec.docType })
    navigate('/specs/new', { state: { incomingTemplate: template } })
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-500">불러오는 중...</main>
  }

  if (!spec || !spec.published) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-500">찾을 수 없거나 비공개 문서입니다.</main>
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="mb-1 text-xs text-slate-500">
        {spec.docType} · {spec.authorName}
      </p>
      <h1 className="mb-1 text-xl font-bold text-slate-900">{spec.title}</h1>
      <p className="mb-4 text-slate-500">{spec.oneLiner}</p>
      <button
        type="button"
        onClick={handleUseAsTemplate}
        className="mb-6 rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
      >
        이 템플릿으로 새 스펙 만들기
      </button>
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
