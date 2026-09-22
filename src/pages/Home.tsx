import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar } from '../components/Sidebar'
import { createProject, listProjects } from '../services/projects'
import type { Project } from '../services/projects'
import { toRelativeTime } from '../lib/relativeTime'

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  useEffect(() => {
    if (!user) return
    listProjects(user.uid).then((result) => {
      setProjects(result)
      setLoading(false)
    })
  }, [user])

  async function handleCreateProject() {
    if (!user) return
    const name = newProjectName.trim()
    if (!name) return
    const id = await createProject(user.uid, name)
    navigate(`/projects/${id}`)
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">PRD 작성 도구</h1>
        <p className="text-slate-500">AI와 함께 PRD를 씁니다.</p>
        <Link
          to="/signin"
          className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          시작하기
        </Link>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-xl font-bold text-slate-900">프로젝트</h1>

          {loading ? (
            <p className="text-slate-500">불러오는 중...</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {projects.length === 0 && (
                <div className="col-span-full rounded-lg border border-dashed border-slate-200 p-6 text-center">
                  <p className="text-slate-500">아직 프로젝트가 없습니다.</p>
                </div>
              )}

              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md"
                >
                  <h2 className="mb-1 font-medium text-slate-900">{project.name}</h2>
                  <p className="text-xs text-slate-400">{toRelativeTime(project.updatedAt)}</p>
                </Link>
              ))}

              {creating ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleCreateProject()
                  }}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <label htmlFor="new-project-name" className="mb-2 block text-xs text-slate-500">
                    프로젝트 이름
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="new-project-name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="프로젝트 이름"
                      className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                    <button
                      type="submit"
                      disabled={!newProjectName.trim()}
                      className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-50"
                    >
                      만들기
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="rounded-lg border border-dashed border-slate-300 p-4 text-left text-sm text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
                >
                  + 새 프로젝트
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
