import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { getProject } from '../services/projects'
import type { Project } from '../services/projects'
import { listSpecsByProject } from '../services/specs'
import type { Spec } from '../services/specs'

const navItems = [
  { to: '/specs', label: '전체 문서' },
  { to: '/community', label: '커뮤니티' },
  { to: '/analytics', label: '분석' },
  { to: '/settings', label: '설정' },
]

// PrivateRoute 안쪽 전체 화면 + 로그인한 Home에서 공통으로 쓰는 좌측 고정 사이드바.
// AppHeader를 대체한다 — 데스크톱 전용 도구라 반응형 접기/햄버거는 만들지 않는다.
export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const { projectId } = useParams<{ projectId?: string }>()
  const isUnclassified = projectId === 'unclassified'

  const [project, setProject] = useState<Project | null>(null)
  const [projectSpecs, setProjectSpecs] = useState<Spec[]>([])

  // location.key도 의존성에 넣는다 — projectId는 그대로인데 (예: 그 프로젝트 안에서 새 문서를
  // 만들고 "← 프로젝트로 돌아가기"로 같은 /projects/:projectId에 다시 들어오는 경우) 이 사이드바는
  // 언마운트되지 않고 그대로 남아있으므로, projectId만 의존성으로 두면 재진입 시 목록/이름이
  // 갱신되지 않는다. location.key는 React Router가 같은 경로를 다시 방문해도 매번 새로 부여한다.
  useEffect(() => {
    if (!projectId || isUnclassified) {
      setProject(null)
      return
    }
    getProject(projectId).then(setProject)
  }, [projectId, isUnclassified, location.key])

  useEffect(() => {
    if (!user || !projectId) {
      setProjectSpecs([])
      return
    }
    listSpecsByProject(user.uid, projectId).then(setProjectSpecs)
  }, [user, projectId, location.key])

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-slate-200 p-4">
          <Link to="/" className="text-sm font-bold text-slate-900">
            PRD 작성 도구
          </Link>
        </div>

        {projectId && (
          <div className="border-b border-slate-200 p-4">
            <Link to="/" className="mb-2 block text-xs text-slate-500 hover:text-slate-700">
              ← 전체 프로젝트
            </Link>
            <h2 className="mb-3 truncate text-sm font-semibold text-slate-900">
              {isUnclassified ? '미분류' : (project?.name ?? '...')}
            </h2>
            <ul className="flex flex-col gap-1">
              {projectSpecs.map((spec) => (
                <li key={spec.id} className="min-w-0">
                  <Link
                    to={`/specs/${spec.id}`}
                    className="block truncate rounded-md px-2 py-1.5 -mx-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    {spec.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <nav aria-label="주요 메뉴" className="flex flex-col gap-3 border-t border-slate-200 p-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                isActive
                  ? 'rounded-md px-2 py-1.5 -mx-2 text-sm font-medium bg-primary-50 text-primary-600'
                  : 'rounded-md px-2 py-1.5 -mx-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900'
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={() => signOut(auth)}
          className="rounded-md px-2 py-1.5 -mx-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          로그아웃
        </button>
      </div>
    </aside>
  )
}
