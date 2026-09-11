import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getOrCreateConfig, updateConfig } from '../services/config'
import type { UserConfig } from '../services/config'
import type { DocTemplate, TemplateSection } from '../lib/defaultTemplates'

type SaveStatus = 'idle' | 'saving' | 'saved'

function makeKey(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug || crypto.randomUUID()
}

export function Settings() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<DocTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [productContext, setProductContext] = useState('')
  const [glossary, setGlossary] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return
    getOrCreateConfig(user.uid).then((config) => {
      setTemplates(config.templates)
      setSelectedTemplateId(config.templates[0]?.id ?? null)
      setProductContext(config.productContext)
      setGlossary(config.glossary)
      setLoaded(true)
    })
  }, [user])

  useEffect(() => {
    if (!loaded || !user) return

    setStatus('saving')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const data: Partial<UserConfig> = { templates, productContext, glossary }
      await updateConfig(user.uid, data)
      setStatus('saved')
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [templates, productContext, glossary, loaded, user])

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null

  function updateTemplate(templateId: string, patch: Partial<DocTemplate>) {
    setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, ...patch } : t)))
  }

  function addTemplate() {
    const newTemplate: DocTemplate = {
      id: crypto.randomUUID(),
      name: '새 문서 타입',
      sections: [{ key: makeKey('새 섹션') + '-0', title: '새 섹션', hint: '' }],
    }
    setTemplates((prev) => [...prev, newTemplate])
    setSelectedTemplateId(newTemplate.id)
  }

  function removeTemplate(templateId: string) {
    if (templates.length <= 1) return
    const next = templates.filter((t) => t.id !== templateId)
    setTemplates(next)
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(next[0]?.id ?? null)
    }
  }

  function updateSection(index: number, patch: Partial<TemplateSection>) {
    if (!selectedTemplate) return
    updateTemplate(selectedTemplate.id, {
      sections: selectedTemplate.sections.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    })
  }

  function removeSection(index: number) {
    if (!selectedTemplate) return
    updateTemplate(selectedTemplate.id, {
      sections: selectedTemplate.sections.filter((_, i) => i !== index),
    })
  }

  function moveSection(index: number, direction: -1 | 1) {
    if (!selectedTemplate) return
    const target = index + direction
    if (target < 0 || target >= selectedTemplate.sections.length) return
    const next = [...selectedTemplate.sections]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    updateTemplate(selectedTemplate.id, { sections: next })
  }

  function addSection() {
    if (!selectedTemplate) return
    const title = '새 섹션'
    updateTemplate(selectedTemplate.id, {
      sections: [
        ...selectedTemplate.sections,
        { key: makeKey(title) + '-' + selectedTemplate.sections.length, title, hint: '' },
      ],
    })
  }

  if (!loaded) {
    return <main className="mx-auto max-w-2xl px-4 py-10 text-slate-500">불러오는 중...</main>
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
        <h1 className="text-xl font-bold text-slate-900">설정</h1>
        <span className="text-sm text-slate-400">{status === 'saving' ? '저장 중...' : status === 'saved' ? '저장됨' : ''}</span>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">문서 타입</h2>
        <div className="grid grid-cols-[200px_1fr] items-start gap-6">
          <div className="flex min-w-0 flex-col gap-1 rounded-md border border-slate-200 bg-slate-50 p-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`min-w-0 flex-1 truncate rounded-md px-3 py-2 text-left text-sm ${
                    t.id === selectedTemplateId ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {t.name}
                </button>
                <button
                  type="button"
                  onClick={() => removeTemplate(t.id)}
                  disabled={templates.length <= 1}
                  aria-label="문서 타입 삭제"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs text-red-600 hover:bg-red-50 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addTemplate}
              className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
            >
              + 새 문서 타입
            </button>
          </div>

          {selectedTemplate && (
            <div className="min-w-0">
              <label htmlFor="template-name" className="mb-2 block text-sm font-semibold text-slate-700">
                문서 타입 이름
              </label>
              <input
                id="template-name"
                value={selectedTemplate.name}
                onChange={(e) => updateTemplate(selectedTemplate.id, { name: e.target.value })}
                className="mb-4 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
              />

              <h3 className="mb-3 text-sm font-semibold text-slate-700">섹션 템플릿</h3>
              <div className="flex flex-col gap-3">
                {selectedTemplate.sections.map((section, index) => (
                  <div key={section.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="w-4 shrink-0 text-xs font-medium text-slate-400">{index + 1}</span>
                      <input
                        value={section.title}
                        onChange={(e) => updateSection(index, { title: e.target.value })}
                        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
                      />
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                          aria-label="위로 이동"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(index, 1)}
                          disabled={index === selectedTemplate.sections.length - 1}
                          aria-label="아래로 이동"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(index)}
                          aria-label="삭제"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-xs text-red-600 hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={section.hint}
                      onChange={(e) => updateSection(index, { hint: e.target.value })}
                      rows={2}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSection}
                className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                섹션 추가
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="mb-6">
        <label htmlFor="product-context" className="mb-2 block text-sm font-semibold text-slate-700">
          제품 설명
        </label>
        <textarea
          id="product-context"
          value={productContext}
          onChange={(e) => setProductContext(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
      </section>

      <section>
        <label htmlFor="glossary" className="mb-2 block text-sm font-semibold text-slate-700">
          용어집
        </label>
        <textarea
          id="glossary"
          value={glossary}
          onChange={(e) => setGlossary(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
      </section>
    </main>
  )
}
