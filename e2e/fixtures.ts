// Playwright E2E 전용 테스트 인증 헬퍼.
//
// 왜 진짜 signInWithPopup/signInWithRedirect UI 플로우를 그대로 재현하지 않았는가:
// Firebase Auth Emulator는 실제로 브라우저에서 열리는 가짜 IDP 위젯 페이지
// (`/emulator/auth/handler`)를 제공하고, 처음에는 그 화면을 Playwright로 직접 조작해서
// 앱의 실제 signInWithPopup/signInWithRedirect 경로를 그대로 태우는 방식을 시도했다.
// 실제로 그 위젯 화면까지는 도달했고(계정 추가 → 이메일 입력 → "Sign in with Google.com"
// 클릭까지 전부 동작함), 하지만 Firebase JS SDK의 popup-redirect resolver는 에뮬레이터를
// 쓰더라도 리다이렉트 완료 처리(getRedirectResult)를 위해 실제 Google이 호스팅하는
// `https://apis.google.com/js/api.js`(gapi iframe)를 로드해야 하는데, 이 하네스 세션의
// 아웃바운드 프록시 정책이 그 도메인을 403으로 차단한다 — 정책을 우회하지 말라는
// 가이드라인에 따라 재시도하지 않았다. 그 결과 signInWithPopup/Redirect는 이 샌드박스
// 안에서는 구조적으로 절대 완료될 수 없다(실측: auth/internal-error).
//
// 그래서 SignIn.tsx에 VITE_USE_FIREBASE_EMULATOR가 'true'일 때만 활성화되는, 쿼리
// 파라미터(?e2eEmail=&e2eName=)로 트리거되는 이메일/비번 로그인 경로를 테스트 전용으로
// 추가했다(해당 env var는 이 npm run test:e2e 실행 중에만 설정되고, 실제 운영 빌드에는
// 절대 설정되지 않는다 — SignIn.tsx 상단 주석 참고). 아래 헬퍼는 테스트마다 새 이메일로
// 매번 새 에뮬레이터 계정을 만들어 테스트 간 Firestore 상태가 섞이지 않게 한다.
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

export interface TestUser {
  email: string
  name: string
}

/** 새 이메일로 에뮬레이터 계정을 만들고 로그인한 뒤 /specs로 리다이렉트될 때까지 기다린다. */
export async function signInAsFreshUser(page: Page, name = 'E2E 테스터'): Promise<TestUser> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@e2e.test`
  await page.goto(`signin?e2eEmail=${encodeURIComponent(email)}&e2eName=${encodeURIComponent(name)}`)
  await page.waitForURL(/\/specs$/)
  return { email, name }
}

export { expect, test }
