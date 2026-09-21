import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getProject, updateProject } from '../services/projects'
import type { Project } from '../services/projects'
import { listSpecsByProject } from '../services/specs'
import type { Spec } from '../services/specs'
import { statusLabels, statusStyles } from './SpecList'
import { toRelativeTime } from '../lib/relativeTime'

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const isUnclassified = projectId === 'unclassified'

  const [project, setProject] = useState<Project | null>(null)
  const [projectLoading, setProjectLoading] = useState(!isUnclassified)
  const [name, setName] = useState('')
  const [specs, setSpecs] = useState<Spec[]>([])
  const [specsLoading, setSpecsLoading] = useState(true)

  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNameSave = useRef(true)

  useEffect(() => {
    if (!projectId || isUnclassified) {
      setProjectLoading(false)
      return
    }
    getProject(projectId).then((result) => {
      setProject(result)
      setName(result?.name ?? '')
      setProjectLoading(false)
    })
  }, [projectId, isUnclassified])

  useEffect(() => {
    if (!user || !projectId) return
    listSpecsByProject(user.uid, projectId).then((result) => {
      setSpecs(result)
      setSpecsLoading(false)
    })
  }, [user, projectId])

  // 프로젝트 이름 자동저장 — Settings.tsx/SpecEditor.tsx와 같은 2초 디바운스 패턴.
  // 'unclassified' 가짜 프로젝트는 실제 문서가 없어 이 타이머 자체가 동작하지 않는다
  // (project가 계속 null이라 아래 가드에서 걸러짐).
  useEffect(() => {
    if (!project || !projectId) return
    if (skipNameSave.current) {
      skipNameSave.current = false
      return
    }
    if (nameTimer.current) clearTimeout(nameTimer.current)
    nameTimer.current = setTimeout(() => {
      updateProject(projectId, { name })
    }, 2000)
    return () => {
      if (nameTimer.current) clearTimeout(nameTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  if (projectLoading) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-500">불러오는 중...</main>
  }

  if (!isUnclassified && !project) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-500">찾을 수 없는 프로젝트입니다.</main>
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        {isUnclassified ? (
          <h1 className="text-xl font-bold text-slate-900">미분류</h1>
        ) : (
          <>
            <label htmlFor="project-name" className="mb-1 block text-xs text-slate-500">
              프로젝트 이름
            </label>
            <input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md rounded-md border border-slate-300 px-3 py-1.5 text-lg font-bold text-slate-900 focus:border-slate-400 focus:outline-none"
            />
          </>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">문서</h2>
        <Link
          to={`/projects/${projectId}/specs/new`}
          className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
        >
          새 문서 만들기
        </Link>
      </div>

      {specsLoading ? (
        <p className="text-slate-500">불러오는 중...</p>
      ) : specs.length === 0 ? (
        <p className="text-slate-500">아직 문서가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {specs.map((spec) => (
            <Link
              key={spec.id}
              to={`/specs/${spec.id}`}
              className="rounded-lg border border-slate-200 p-4 transition-shadow hover:border-slate-300 hover:shadow-sm"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="font-medium text-slate-900">{spec.title}</h3>
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
