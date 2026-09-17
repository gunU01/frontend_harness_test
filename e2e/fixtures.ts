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

// 관리자 지정 테스트용 헬퍼.
//
// admins/{uid}는 firestore.rules가 쓰기를 완전히 막아둔 컬렉션이다(관리자 본인도 못 씀 —
// PLANNING.md 6단계, firestore.rules.test.js의 "CRITICAL" 테스트 참고) — 그래서 앱의 클라이언트
// SDK 경로로는 이 문서를 만들 방법이 원천적으로 없다. firestore.rules.test.js는
// `@firebase/rules-unit-testing`의 `withSecurityRulesDisabled`로 규칙을 우회해 시드하지만,
// 그건 별도의 Node 테스트 러너(`node --test`)용이라 이 Playwright e2e 스펙에서 재사용할 수
// 없다. 대신 이 하네스가 이미 `npm run test:e2e`에서 띄우는 Auth+Firestore 에뮬레이터에 직접
// REST로 접근한다:
// 1) Auth 에뮬레이터의 accounts:query API(아래 findUidByEmail 참고)로 이메일 -> uid를 찾고
// 2) Firestore 에뮬레이터에 `Authorization: Bearer owner` 헤더로 문서를 쓴다 — 이 토큰은
//    Admin SDK가 실제 서비스 계정 자격 증명 없이 에뮬레이터에 붙을 때 기본으로 보내는 바로 그
//    값이고, Firestore 에뮬레이터는 이 토큰을 "관리자/소유자" 요청으로 인식해 Security Rules를
//    완전히 우회한다 — Admin SDK/CLI가 항상 규칙을 우회한다는 공식 동작과 같은 성격이다.
// 프로덕션 앱 코드에는 이 경로가 전혀 없다(REST 우회는 로컬 에뮬레이터에서만 가능) — 이 테스트
// 전용 헬퍼일 뿐, 실제 관리자 지정은 여전히 README에 적힌 대로 Firebase 콘솔에서만 가능하다.
const EMULATOR_PROJECT_ID = 'demo-settle-up-e2e-test' // firebase.json 포트 + package.json test:e2e의 --project와 동일
const AUTH_EMULATOR_ORIGIN = 'http://127.0.0.1:9099'
const FIRESTORE_EMULATOR_ORIGIN = 'http://127.0.0.1:8080'

// `/emulator/v1/projects/{id}/accounts`는 emulator 전용 관리 API 중 계정 "전체 삭제"(DELETE)만
// 지원하고 목록 조회(GET)는 없다(404 Method Not Allowed로 실측 확인). 대신 실제 Identity
// Platform REST API인 `accounts:query`(admin 전용 프로젝트 스코프 조회)를 `Authorization: Bearer
// owner`로 호출하면 그 프로젝트의 전체 계정을 인증 없이 나열해준다 — 이것도 위 admins 문서
// 시드와 같은 "Bearer owner = 에뮬레이터 관리자 권한" 규칙을 그대로 따른다.
async function findUidByEmail(email: string): Promise<string> {
  const res = await fetch(
    `${AUTH_EMULATOR_ORIGIN}/identitytoolkit.googleapis.com/v1/projects/${EMULATOR_PROJECT_ID}/accounts:query`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUserInfo: true }),
    },
  )
  if (!res.ok) {
    throw new Error(`Auth 에뮬레이터 계정 조회 실패: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { userInfo?: { localId: string; email?: string }[] }
  const account = data.userInfo?.find((u) => u.email === email)
  if (!account) throw new Error(`Auth 에뮬레이터에서 ${email} 계정을 찾지 못함`)
  return account.localId
}

/** 주어진 이메일의 (이미 로그인된) 테스트 유저를 admins/{uid} 문서를 심어 관리자로 만든다. */
export async function makeUserAdmin(email: string): Promise<void> {
  const uid = await findUidByEmail(email)
  const url = `${FIRESTORE_EMULATOR_ORIGIN}/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents/admins/${uid}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: {} }),
  })
  if (!res.ok) {
    throw new Error(`admins/${uid} 시드 실패: ${res.status} ${await res.text()}`)
  }
}

export { expect, test }
