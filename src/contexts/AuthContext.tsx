import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { trackEvent } from '../services/analytics'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // 첫 onAuthStateChanged 호출(페이지 로드 시 기존 세션 복원)은 "새 로그인"이 아니므로 제외하고,
  // 그 이후 null -> user로 바뀌는 전환(실제 로그인 완료)에만 signed_in을 기록한다.
  const hasInitialized = useRef(false)
  const prevUserRef = useRef<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (hasInitialized.current && !prevUserRef.current && nextUser) {
        trackEvent(nextUser.uid, 'signed_in', {})
      }
      prevUserRef.current = nextUser
      hasInitialized.current = true
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
