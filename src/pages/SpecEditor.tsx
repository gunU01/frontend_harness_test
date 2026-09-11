import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSpec, updateSpec } from '../services/specs'
import type { Spec, SpecSection } from '../services/specs'
import { critique, generateDraft, regenerateSection } from '../services/generate'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isDesktop
}

function parseDraft(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  const parts = text.split(/^##\s+/m).filter(Boolean)
  for (const part of parts) {
    const [firstLine, ...rest] = part.split('\n')
    const key = firstLine.trim()
    result[key] = rest.join('\n').trim()
  }
  return result
}

export function SpecEditor() {
  const { id } = useParams<{ id: string }>()
  const isDesktop = useIsDesktop()

  const [spec, setSpec] = useState<Spec | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [busy, setBusy] = useState<'draft' | 'section' | 'critique' | null>(null)
  const [questions, setQuestions] = useState<string[] | null>(null)

  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipTitleSave = useRef(true)
  const skipContentSave = useRef(true)

  useEffect(() => {
    if (!id) return
    getSpec(id)
      .then((result) => {
        setSpec(result)
        setSelectedKey(result?.sections[0]?.key ?? null)
      })
      .catch(() => setSpec(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!spec || !id) return
    if (skipTitleSave.current) {
      skipTitleSave.current = false
      return
    }
    if (titleTimer.current) clearTimeout(titleTimer.current)
    titleTimer.current = setTimeout(() => {
      updateSpec(id, { title: spec.title, oneLiner: spec.oneLiner })
    }, 2000)
    return () => {
      if (titleTimer.current) clearTimeout(titleTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec?.title, spec?.oneLiner])

  const selectedSection = spec?.sections.find((s) => s.key === selectedKey) ?? null

  useEffect(() => {
    if (!spec || !id || !selectedKey) return
    if (skipContentSave.current) {
      skipContentSave.current = false
      return
    }
    if (contentTimer.current) clearTimeout(contentTimer.current)
    contentTimer.current = setTimeout(() => {
      updateSpec(id, { sections: spec.sections })
    }, 2000)
    return () => {
      if (contentTimer.current) clearTimeout(contentTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection?.content])

  function handleTogglePublished(published: boolean) {
    if (!id || !spec) return
    setSpec({ ...spec, published })
    updateSpec(id, { published })
  }

  function selectSection(key: string) {
    skipContentSave.current = true
    setSelectedKey(key)
  }

  function updateSectionContent(content: string) {
    setSpec((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map((s) => (s.key === selectedKey ? { ...s, content } : s)),
      }
    })
  }

  async function handleGenerateDraft() {
    if (!id || !spec) return
    setBusy('draft')
    try {
      const result = await generateDraft(id)
      const parsed = parseDraft(result.text)
      const nextSections: SpecSection[] = spec.sections.map((s) =>
        parsed[s.key] !== undefined ? { ...s, content: parsed[s.key] } : s,
      )
      skipContentSave.current = true
      setSpec({ ...spec, sections: nextSections })
      await updateSpec(id, { sections: nextSections })
    } finally {
      setBusy(null)
    }
  }

  async function handleRegenerateSection() {
    if (!id || !spec || !selectedKey) return
    setBusy('section')
    try {
      const result = await regenerateSection(id, selectedKey)
      const nextSections = spec.sections.map((s) => (s.key === selectedKey ? { ...s, content: result.text.trim() } : s))
      skipContentSave.current = true
      setSpec({ ...spec, sections: nextSections })
      await updateSpec(id, { sections: nextSections })
    } finally {
      setBusy(null)
    }
  }

  async function handleCritique() {
    if (!id) return
    setBusy('critique')
    try {
      const result = await critique(id)
      const lines = result.text
        .split('\n')
        .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 3)
      setQuestions(lines)
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-500">불러오는 중...</main>
  }

  if (!spec) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-500">스펙을 찾을 수 없습니다.</main>
  }

  if (!isDesktop) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="mb-6 text-sm text-slate-500">데스크톱에서 이어서 작성하세요.</p>
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-2">
        <input
          value={spec.title}
          onChange={(e) => setSpec({ ...spec, title: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-lg font-bold text-slate-900 focus:border-slate-400 focus:outline-none"
        />
        <input
          value={spec.oneLiner}
          onChange={(e) => setSpec({ ...spec, oneLiner: e.target.value })}
          placeholder="한 줄 문제 정의"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 focus:border-slate-400 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={spec.published}
            onChange={(e) => handleTogglePublished(e.target.checked)}
          />
          <label htmlFor="published" className="text-sm text-slate-700">
            커뮤니티에 공개하기
          </label>
          {spec.published && (
            <span className="text-xs text-slate-500">
              누구나 이 링크로 볼 수 있습니다 ·{' '}
              <Link to={`/community/${id}`} className="text-primary-600 hover:underline">
                공개 페이지 보기
              </Link>
            </span>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
        <button
          type="button"
          onClick={handleGenerateDraft}
          disabled={busy !== null}
          className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {busy === 'draft' ? '생성 중...' : '초안 생성'}
        </button>
        <button
          type="button"
          onClick={handleRegenerateSection}
          disabled={busy !== null || !selectedKey}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          {busy === 'section' ? '생성 중...' : '이 섹션 다시 쓰기'}
        </button>
        <button
          type="button"
          onClick={handleCritique}
          disabled={busy !== null}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          {busy === 'critique' ? '분석 중...' : '빈틈 지적'}
        </button>
      </div>

      {questions && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-amber-800">빈틈 지적</h2>
            <button type="button" onClick={() => setQuestions(null)} className="text-xs text-amber-700">
              닫기
            </button>
          </div>
          <ul className="list-inside list-disc text-sm text-amber-800">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-[200px_1fr] items-start gap-6">
        <div className="flex min-w-0 flex-col gap-1 rounded-md border border-slate-200 bg-slate-50 p-2">
          {spec.sections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => selectSection(section.key)}
              className={`truncate rounded-md px-3 py-2 text-left text-sm ${
                section.key === selectedKey ? 'bg-primary-500 text-white' : 'text-slate-700 hover:bg-white'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        <label htmlFor="section-content" className="sr-only">
          {selectedSection?.title} 내용
        </label>
        <textarea
          id="section-content"
          value={selectedSection?.content ?? ''}
          onChange={(e) => updateSectionContent(e.target.value)}
          rows={20}
          className="min-w-0 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
      </div>
    </main>
  )
}
