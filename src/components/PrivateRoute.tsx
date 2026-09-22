import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar } from './Sidebar'

export function PrivateRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        불러오는 중...
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-slate-50">
        <Outlet />
      </div>
    </div>
  )
}
