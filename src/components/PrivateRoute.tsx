import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AppHeader } from './AppHeader'

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
    <>
      <AppHeader />
      <Outlet />
    </>
  )
}
