import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createSpec } from '../services/specs'
import { getOrCreateConfig } from '../services/config'
import type { DocTemplate } from '../lib/defaultTemplates'

export function NewSpec() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<DocTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null)
  const [title, setTitle] = useState('')
  const [oneLiner, setOneLiner] = useState('')

  useEffect(() => {
    if (!user) return
    getOrCreateConfig(user.uid).then((config) => {
      setTemplates(config.templates)
    })
  }, [user])

  async function handleCreate() {
    if (!user || !selectedTemplate || !title.trim()) return
    const id = await createSpec(user.uid, title.trim(), oneLiner.trim(), selectedTemplate)
    navigate(`/specs/${id}`)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-xl font-bold text-slate-900">새 스펙 만들기</h1>

      {!selectedTemplate ? (
        <>
          <p className="mb-6 text-sm text-slate-500">문서 타입을 선택하세요.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplate(template)}
                className="rounded-lg border border-slate-200 p-4 text-left transition-shadow hover:border-slate-300 hover:shadow-sm"
              >
                <h2 className="mb-1 font-medium text-slate-900">{template.name}</h2>
                <p className="text-sm text-slate-500">
                  {template.sections.length}개 섹션 ·{' '}
                  {template.sections
                    .map((s) => s.title)
                    .slice(0, 3)
                    .join(', ')}
                  {template.sections.length > 3 ? ' 외' : ''}
                </p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mb-8 flex flex-col gap-3 rounded-md border border-slate-200 p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="new-spec-title" className="text-xs text-slate-500">
              제목
            </label>
            <input
              id="new-spec-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              placeholder="한 줄 문제 정의"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!title.trim()}
              className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              만들기
            </button>
            <button
              type="button"
              onClick={() => setSelectedTemplate(null)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
            >
              다른 타입 선택
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
