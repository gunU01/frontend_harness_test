import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

// Playwright E2E 전용 테스트 계정 비밀번호. VITE_USE_FIREBASE_EMULATOR가 'true'일 때만
// 쓰이는 분기 안에서만 참조되므로 운영 빌드 동작에는 영향이 없다.
const E2E_TEST_PASSWORD = 'e2e-test-password'

// Playwright E2E 전용 (npm run test:e2e에서만 VITE_USE_FIREBASE_EMULATOR='true'로 설정됨).
// signInWithPopup은 실제 Google 계정 화면 대신 Auth 에뮬레이터의 가짜 IDP 위젯을 띄우긴 하지만,
// 팝업이든 signInWithRedirect든 Firebase의 popup-redirect resolver 초기화 자체가
// apis.google.com의 gapi 스크립트 로드를 필요로 해서(getRedirectResult 완료 시점 포함),
// 외부 네트워크가 막힌 샌드박스/CI에서는 실측 결과 auth/internal-error로 절대 완료되지 않았다.
// 그래서 이 화면에는 쿼리 파라미터(?e2eEmail=...)로 트리거되는, 이메일/비번 기반의
// 에뮬레이터 전용 로그인 경로를 별도로 둔다 — UI에는 노출되지 않고, 실제 로그인 버튼
// 동작(아래 handleSignIn)에는 전혀 관여하지 않는다.
function useE2EEmulatorSignIn() {
  useEffect(() => {
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true') return
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('e2eEmail')
    if (!emailParam) return
    const email: string = emailParam
    const displayName = params.get('e2eName') ?? 'E2E 테스터'

    async function signInOrCreate() {
      try {
        await signInWithEmailAndPassword(auth, email, E2E_TEST_PASSWORD)
      } catch (e) {
        if (e instanceof FirebaseError && (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential')) {
          const credential = await createUserWithEmailAndPassword(auth, email, E2E_TEST_PASSWORD)
          await updateProfile(credential.user, { displayName })
        } else {
          console.error(e)
        }
      }
    }

    void signInOrCreate()
  }, [])
}

export function SignIn() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  useE2EEmulatorSignIn()

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
