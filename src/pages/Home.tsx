import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">PRD 작성 도구</h1>
      <p className="text-slate-500">AI와 함께 PRD를 씁니다.</p>
      <Link
        to={user ? '/specs' : '/signin'}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        {user ? '스펙 목록으로' : '시작하기'}
      </Link>
    </main>
  )
}
