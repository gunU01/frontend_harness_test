import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function SignIn() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate('/specs', { replace: true })
    }
  }, [loading, user, navigate])

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      if (
        e instanceof FirebaseError &&
        (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')
      ) {
        await signInWithRedirect(auth, googleProvider)
        return
      }
      console.error(e)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">PRD 작성 도구</h1>
        <button
          type="button"
          onClick={handleSignIn}
          className="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          Google로 로그인
        </button>
      </div>
    </main>
  )
}
