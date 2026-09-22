import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { listSpecs } from '../services/specs'
import type { Spec, SpecStatus } from '../services/specs'
import { listProjects } from '../services/projects'
import type { Project } from '../services/projects'
import { toRelativeTime } from '../lib/relativeTime'

// ProjectDetail.tsx도 같은 카드 배지 스타일을 그대로 재사용하기 위해 export한다.
export const statusStyles: Record<SpecStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  review: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
}

export const statusLabels: Record<SpecStatus, string> = {
  draft: '초안',
  review: '검토중',
  done: '완료',
}

export function SpecList() {
  const { user } = useAuth()
  const [specs, setSpecs] = useState<Spec[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([listSpecs(user.uid), listProjects(user.uid)]).then(([specsResult, projectsResult]) => {
      setSpecs(specsResult)
      setProjects(projectsResult)
      setLoading(false)
    })
  }, [user])

  // Analytics.tsx의 "사용자별 활동" 차트가 쓰는 uid -> authorName 조회맵과 같은 패턴:
  // projectId -> 프로젝트 이름. 'unclassified' 센티널은 실제 문서가 없으므로 "미분류"로 대체한다.
  const projectNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const project of projects) map.set(project.id, project.name)
    return map
  }, [projects])

  function projectLabel(projectId: string): string {
    if (projectId === 'unclassified') return '미분류'
    return projectNameById.get(projectId) ?? '미분류'
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">스펙 목록</h1>
        <Link
          to="/specs/new"
          className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          새 스펙 만들기
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">불러오는 중...</p>
      ) : specs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
          <p className="text-slate-500">아직 작성한 스펙이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {specs.map((spec) => (
            <Link
              key={spec.id}
              to={`/specs/${spec.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <h2 className="font-medium text-slate-900">{spec.title}</h2>
                <span
                  className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[spec.status]}`}
                >
                  {statusLabels[spec.status]}
                </span>
              </div>
              <p className="mb-1 text-xs text-slate-500">
                {spec.docType} · {projectLabel(spec.projectId)}
              </p>
              <p className="mb-1 text-sm text-slate-500">{spec.oneLiner}</p>
              <p className="text-xs text-slate-400">{toRelativeTime(spec.updatedAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
