import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PrivateRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        불러오는 중...
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return <Outlet />
}
