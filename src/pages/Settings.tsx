import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getOrCreateConfig, updateConfig } from '../services/config'
import type { UserConfig } from '../services/config'
import type { TemplateSection } from '../lib/defaultTemplate'

type SaveStatus = 'idle' | 'saving' | 'saved'

function makeKey(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug || crypto.randomUUID()
}

export default function Settings() {
  const { user } = useAuth()
  const [template, setTemplate] = useState<TemplateSection[]>([])
  const [productContext, setProductContext] = useState('')
  const [glossary, setGlossary] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return
    getOrCreateConfig(user.uid).then((config) => {
      setTemplate(config.template)
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
      const data: Partial<UserConfig> = { template, productContext, glossary }
      await updateConfig(user.uid, data)
      setStatus('saved')
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, productContext, glossary, loaded, user])

  function updateSection(index: number, patch: Partial<TemplateSection>) {
    setTemplate((prev) => prev.map((section, i) => (i === index ? { ...section, ...patch } : section)))
  }

  function removeSection(index: number) {
    setTemplate((prev) => prev.filter((_, i) => i !== index))
  }

  function moveSection(index: number, direction: -1 | 1) {
    setTemplate((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  function addSection() {
    const title = '새 섹션'
    setTemplate((prev) => [...prev, { key: makeKey(title) + '-' + prev.length, title, hint: '' }])
  }

  if (!loaded) {
    return <main className="mx-auto max-w-2xl px-4 py-10 text-slate-500">불러오는 중...</main>
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">설정</h1>
        <span className="text-sm text-slate-400">{status === 'saving' ? '저장 중...' : status === 'saved' ? '저장됨' : ''}</span>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">섹션 템플릿</h2>
        <div className="flex flex-col gap-3">
          {template.map((section, index) => (
            <div key={section.key} className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={section.title}
                  onChange={(e) => updateSection(index, { title: e.target.value })}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === template.length - 1}
                  className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
                >
                  삭제
                </button>
              </div>
              <textarea
                value={section.hint}
                onChange={(e) => updateSection(index, { hint: e.target.value })}
                rows={2}
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-600"
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
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">제품 설명</h2>
        <textarea
          value={productContext}
          onChange={(e) => setProductContext(e.target.value)}
          rows={4}
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">용어집</h2>
        <textarea
          value={glossary}
          onChange={(e) => setGlossary(e.target.value)}
          rows={4}
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </section>
    </main>
  )
}
