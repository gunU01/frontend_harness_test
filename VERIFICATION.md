# 자체 검증 시나리오

화면 대부분이 Firebase Auth/Firestore/Functions에 실시간으로 의존하고, 이 하네스 세션에는 실제 Firebase 프로젝트 자격 증명이 없어서 대부분의 UI 동작은 오랫동안 수동 체크리스트로만 남아 있었습니다. 다만 Firestore 보안 규칙은 **자격 증명 없이 로컬 에뮬레이터로 완전히 자동화**했고(`npm run test:rules`, 아래 P1-c/P2 참고), 이번에 **AI(Functions `generate`) 호출이 필요 없는 P0/P1/P1-d UI 플로우도 Playwright + Firebase 에뮬레이터로 자동화**했습니다 (`npm run test:e2e`, 아래 각 항목 및 "앞으로 자동화한다면" 참고). 초안 생성/섹션 다시쓰기/빈틈 지적처럼 Anthropic API 키가 필요한 시나리오는 이 하네스 세션에 자격 증명이 없어 여전히 수동 확인 항목입니다. 자동화할 가치가 가장 큰 것부터 P0/P1/P2로 나눴습니다.

## 0. 정적 검증 (자동, 이미 하네스가 매 커밋마다 함)

- [ ] `npm run lint` — 통과
- [ ] `npx tsc --noEmit` — 통과 (PostToolUse 훅이 매 Edit/Write마다 이미 실행함)
- [ ] `npm run build` — 통과, `dist/` 생성 확인
- [ ] `node --check functions/index.js` — Functions 코드 문법 오류 없음

이 네 개는 코드만으로 확인 가능해서 이미 자동화되어 있습니다. 아래부터는 실제 로그인/DB가 필요합니다.

## P0 — 핵심 플로우 (이거 하나라도 깨지면 도구 자체가 무의미)

- [x] **로그인** — 자동화됨(`npm run test:e2e`, `e2e/auth.spec.ts`): 실제 Google 계정 대신 Firebase Auth 에뮬레이터에 이메일/비번으로 만든 테스트 계정으로 로그인해 `/specs`로 리다이렉트되는지, 공통 헤더가 뜨는지 확인. 진짜 `signInWithPopup`으로 실제 Google 계정 선택 UI를 타는 것 자체는 여전히 수동 확인 필요(아래 "팝업 차단 폴백" 항목 및 "앞으로 자동화한다면" 참고).
- [ ] **팝업 차단 폴백**: 팝업이 막힌 환경(모바일 브라우저 등)에서도 `signInWithRedirect`로 로그인이 끝까지 됨 (`SignIn.tsx`의 `auth/popup-blocked` 분기) — 이 하네스 세션에서는 자동화 시도 중 진짜 하드 블로커를 확인함: Auth 에뮬레이터의 가짜 IDP 위젯 화면까지는 Playwright로 정상적으로 도달했지만(계정 추가 → 로그인 클릭까지 전부 동작), `signInWithPopup`/`signInWithRedirect` 둘 다 Firebase JS SDK 내부적으로 `https://apis.google.com/js/api.js`(gapi iframe)를 로드해야 리다이렉트 완료 처리가 끝나는데, 이 세션의 아웃바운드 프록시 정책이 그 도메인을 403으로 차단해서 실측 결과 `auth/internal-error`로 절대 완료되지 않았다(자세한 경과는 `e2e/fixtures.ts` 상단 주석). 그래서 이 항목은 여전히 수동 확인 대상으로 남긴다.
- [ ] **스펙 생성 → 초안 생성 → 저장**: `/specs`에서 문서 타입(PRD) 선택 → 제목·한줄정의 입력 → 만들기 → `/specs/:id`로 이동 → "초안 생성" 클릭 → 7개 섹션이 모두 채워짐 → 새로고침해도 내용이 남아있음 (Firestore에 실제로 저장됐는지가 핵심) — "초안 생성"(AI 호출)을 뺀 나머지(템플릿 선택 → 스펙 생성 → 제목/한줄정의가 Firestore에 저장되고 새로고침 후에도 남는지)는 `e2e/spec-lifecycle.spec.ts`로 자동화됨. AI 호출 자체는 API 키가 필요해 여전히 수동.
- [ ] **섹션 재작성**: 왼쪽에서 섹션 하나 선택 → "이 섹션 다시 쓰기" → 그 섹션만 바뀌고 다른 섹션은 그대로임
- [ ] **빈틈 지적**: "빈틈 지적" 클릭 → 질문 3개가 화면에 뜸 → 새로고침하면 사라짐 (로컬 상태일 뿐 저장 안 되는 게 의도된 동작)

## P1 — 이번에 넓힌 기능 (문서 타입 다양화)

- [x] **문서 타입 추가** — 자동화됨(`npm run test:e2e`, `e2e/settings.spec.ts`): "+ 새 문서 타입" → 이름 변경 → 섹션 추가 → "저장됨" 표시 → 새로고침해도 이름/섹션이 유지되는지 확인.
- [ ] **문서 타입 삭제 방지**: 문서 타입이 1개만 남았을 때 삭제 버튼이 비활성화되어 있음 (`templates.length <= 1` 가드) — 이번 자동화 범위 밖, 여전히 수동.
- [x] **섹션 순서변경** — 자동화됨(`npm run test:e2e`, `e2e/settings.spec.ts`): ↑ 버튼으로 순서를 바꾸고 섹션 하나를 삭제한 뒤, 새로고침해도 그 순서/개수가 저장돼 있는지 확인.
- [x] **스펙 생성 시 타입 선택** — 자동화됨(`npm run test:e2e`, `e2e/spec-lifecycle.spec.ts`): `/specs/new`에서 문서 타입 카드를 고르면 제목/한줄정의 입력 단계로 넘어가고, 만들기를 누르면 그 타입의 섹션 구성대로 `/specs/:id`가 생성되는지 확인 (`e2e/community-template-import.spec.ts`도 다른 타입인 "기능 명세서"로 같은 경로를 한 번 더 검증).
- [x] **다른 타입 선택** — 자동화됨(`npm run test:e2e`, `e2e/spec-lifecycle.spec.ts`): "다른 타입 선택"을 누르면 라우트 이동 없이(`/specs/new`에 그대로 머문 채) 타입 갤러리로 되돌아가는지 확인.
- [ ] **카드에 타입 라벨**: 목록의 각 카드에 문서 타입 이름(예: "회의록")이 상태뱃지와 별도로 표시됨 — 이번 자동화 범위 밖, 여전히 수동.
- [x] **★ 스냅샷 격리 (가장 중요한 회귀 시나리오)** — 자동화됨(`npm run test:e2e`, `e2e/snapshot-isolation.spec.ts`): PRD로 스펙 A를 만들고, `/settings`에서 PRD 템플릿의 첫 섹션 제목을 바꾼 뒤, 스펙 A를 다시 열어서 섹션 제목이 그대로인지(참조가 아니라 스냅샷인지) 확인. (테스트를 짜는 과정에서 헬퍼의 `waitForURL` 정규식이 `/specs/new`라는 리터럴 URL과 실제 생성된 id를 혼동해 오탐을 낸 적이 있었는데, `createSpec` 자체의 스냅샷 로직에는 문제가 없었음 — 자세한 경과는 `e2e/helpers.ts` 커밋 이력 참고.)

## P1-b — 공통 헤더 (화면 간 이동)

- [ ] **네비게이션 이동**: 로그인 후 `/specs`, `/specs/new`, `/settings`로 헤더의 "스펙 목록"/"템플릿"/"설정" 링크를 눌러 각각 이동됨
- [ ] **활성 링크 강조**: 현재 페이지에 해당하는 헤더 링크가 `text-primary-600 font-medium`으로 강조되고 나머지는 `text-slate-600`임 (`useLocation` 기반)
- [ ] **로그아웃**: 헤더의 "로그아웃" 클릭 → `signOut` 호출 → `AuthContext`가 `user`를 `null`로 바꾸고 `PrivateRoute`가 `/signin`으로 리다이렉트함 (수동 navigate 없이 동작하는지 확인)
- [ ] **공개 페이지엔 헤더 없음**: `/`, `/signin`에서는 헤더가 보이지 않음 (`PrivateRoute` 바깥이라 자동으로 제외됨)
- [ ] **커뮤니티 링크**: 헤더의 "커뮤니티" 링크를 누르면 `/community`로 이동하고 목록이 보임 (`/community`, `/community/:id`는 `PrivateRoute` 바깥의 공개 라우트라 헤더 자체는 이 두 페이지에는 안 보임 — 헤더에서 다른 화면으로 이동할 때만 해당)

## P1-c — 커뮤니티 공개 (이번에 추가)

- [x] **발행 토글** — 자동화됨(`npm run test:e2e`, `e2e/community.spec.ts`): "커뮤니티에 공개하기" 체크 → 완전히 새로운(로그인 정보 없는) 브라우저 컨텍스트에서 `/community` 목록과 `/community/:id` 상세에 보이는지 확인.
- [x] **발행 취소** — 자동화됨(`npm run test:e2e`, `e2e/community.spec.ts`): 같은 테스트에서 체크 해제 후 그 게스트 컨텍스트를 새로고침하면 목록에서 사라지고 상세 페이지가 "찾을 수 없거나 비공개 문서입니다"로 바뀌는지까지 이어서 확인.
- [x] **커뮤니티 목록** — `e2e/community.spec.ts`가 "로그아웃 상태에서 공개된 스펙만 보임/비공개면 안 보임"까지는 함께 검증함. 다만 "각 카드에 작성자 정보(이름/이메일/uid)가 전혀 없음"을 명시적으로 단언하는 부분은 아직 자동화하지 않음 — 부분적으로만 자동화됨.
- [x] **커뮤니티 상세** — `e2e/community.spec.ts`·`e2e/community-template-import.spec.ts`가 로그인 없이 제목/한줄정의가 읽기 전용으로 보이는 것까지는 확인함. "편집 컨트롤·AI 버튼이 전혀 없음"을 명시적으로 단언하는 부분은 아직 자동화하지 않음 — 부분적으로만 자동화됨.
- [x] **★ Firestore 규칙 회귀 (가장 중요)** — 자동화됨, `npm run test:rules`로 실행: 비로그인 요청으로 비공개 스펙(`published` 없음 또는 `false`)의 `specs/{id}`를 읽으면 거부됨. `published: true`인 문서는 비로그인으로도 읽히지만 그 문서에 `update`/`delete`를 비로그인 또는 타인 uid로 시도하면 거부됨. `config/{uid}`는 이번 변경으로 건드리지 않았으므로 여전히 본인 uid가 아니면 읽기/쓰기 전부 거부됨(공개 스펙 소유자가 남의 config를 읽으려는 경우 포함)을 재확인. 소유자는 `published` 여부와 무관하게 항상 자신의 스펙을 읽기/쓰기/삭제할 수 있음도 확인. `firebase emulators:exec` + `@firebase/rules-unit-testing`으로 `firestore.rules.test.js`에 구현 (Java/JDK가 있는 환경에서 Firestore 에뮬레이터가 필요 — 이 하네스 세션에는 JDK가 있어 실제로 실행·통과 확인함).
- [ ] **복합 색인**: `firebase deploy --only firestore:indexes` 이후 `/community` 목록이 에러 없이 로드됨 (배포 전에는 `where(published==true)+orderBy(updatedAt desc)` 조합이 콘솔에 색인 생성 링크 에러를 띄울 수 있음 — `firestore.indexes.json` 배포로 해결)

## P1-d — 의사결정 지원 확장 (이번에 추가)

- [ ] **새 문서 타입 5종**: `/specs/new`에서 기능 명세서/릴리즈 노트/실험 설계서/의사결정 로그/우선순위 스코어링 5개 카드가 기존 PRD/회의록과 함께 보이고, 각각 선택 시 해당 섹션 구성대로 스펙이 생성됨
- [x] **가정/리스크 트래커** — 자동화됨(`npm run test:e2e`, `e2e/risk-stakeholder.spec.ts`): 추가 → 체크박스 토글 → 저장 후 새로고침해도 체크 유지 → 삭제 후 새로고침해도 사라진 채로 유지되는지 확인.
- [ ] **빈틈 지적 → 트래커 연결**: "빈틈 지적" 클릭해 질문 3개를 띄운 뒤 "빈틈 지적에서 가져오기" 클릭 → 질문들이 즉시(디바운스 없이) 리스크 트래커에 미해결 항목으로 추가되고, 질문 박스는 닫힘 — "빈틈 지적" 자체가 AI(Functions `generate`) 호출이라 이 세션에서는 자동화 불가, 여전히 수동.
- [x] **이해관계자 확인 체크리스트** — 자동화됨(`npm run test:e2e`, `e2e/risk-stakeholder.spec.ts`): 이름 추가 → 확인 체크 토글 → 저장/삭제가 리스크 트래커와 동일하게 새로고침 후에도 유지/반영되는지 확인.
- [ ] **독립 저장 확인**: 같은 화면에서 제목을 수정하는 동시에 리스크 체크박스를 토글해도 서로의 저장을 방해하지 않음(각 필드가 독립된 디바운스 타이머를 씀)
- [ ] **★ 구버전 스펙 마이그레이션**: 이 변경 이전에 만든 스펙을 열어도 `risks`/`stakeholders`/`authorName` 관련 코드가 크래시 없이 빈 배열/"익명"으로 채워짐
- [ ] **작성자 이름 표시**: 커뮤니티 목록/상세에 작성자의 Google 표시 이름이 보임(uid/이메일은 노출 안 됨), 구버전 문서는 "익명"으로 표시됨
- [ ] **커뮤니티 검색/필터**: `/community`에서 제목/한줄정의로 텍스트 검색 시 실시간 필터링됨, 문서 타입 드롭다운 선택 시 해당 타입만 보임, 필터 결과가 0건일 때 "조건에 맞는 문서가 없습니다"가 보이고(진짜 빈 상태의 "스펙 만들러 가기" CTA는 안 보임) 필터를 해제하면 원래 목록으로 돌아옴
- [x] **템플릿 마켓플레이스 연결** — 로그인 상태 경로는 자동화됨(`npm run test:e2e`, `e2e/community-template-import.spec.ts`): 공개된 스펙의 `/community/:id`에서 "이 템플릿으로 새 스펙 만들기" → `/specs/new`의 제목/한줄정의 입력 단계로 바로 진입하고, 만들면 원본과 같은 섹션 구성을 물려받는지 확인. "로그아웃 상태면 `/signin`으로 이동", "진입 후 새로고침하면 갤러리로 복귀"는 이번 자동화 범위 밖 — 여전히 수동.

## P2 — 부가 동작

- [ ] **반응형 전환**: 브라우저 폭을 768px 아래로 줄이면 `/specs/:id`가 편집 UI 대신 "데스크톱에서 이어서 작성하세요" + 읽기 전용 뷰로 바뀜
- [ ] **구버전 config 마이그레이션**: (수동 재현이 어려우면 스킵 가능) Firestore 콘솔에서 어떤 유저의 `config/{uid}` 문서에서 `templates` 필드를 지워본다 → `/settings` 재접속 시 크래시 없이 기본 템플릿 2종으로 채워짐 (`getOrCreateConfig`의 마이그레이션 분기)
- [x] **Firestore 보안 규칙** — 자동화됨, P1-c의 `npm run test:rules`가 이 시나리오(로그인하지 않은 상태 또는 다른 uid로 `specs/{다른유저의specId}` 읽기/쓰기 시도 → 거부)도 함께 커버함. 아래 두 항목으로 중복 관리하지 않고 하나의 테스트 스위트(`firestore.rules.test.js`)로 합침.

## 앞으로 자동화한다면

Firestore rules 시나리오는 에뮬레이터만 있으면 UI 없이도 바로 테스트 코드로 옮길 수 있어서 자동화 투자 대비 가장 이득이 컸고, **완료했습니다**: `firestore.rules.test.js` (`@firebase/rules-unit-testing` + Node 내장 `node:test`)가 `npm run test:rules`로 실행되며, `firebase emulators:exec --only firestore`가 Firestore 에뮬레이터를 띄우고 내려줍니다. 이 하네스 세션에는 JDK(OpenJDK 21)가 있어 실제로 실행해서 15개 테스트가 모두 통과하는 것까지 확인했습니다 — 자격 증명이 있는 세션이 아니어도 에뮬레이터는 완전히 로컬로 동작하기 때문입니다.

이어서 **P0/P1/P1-d의 UI 시나리오도 Playwright + Firebase 에뮬레이터(Auth+Firestore)로 자동화했습니다**: `npm run test:e2e`가 `firebase emulators:exec --only auth,firestore`로 두 에뮬레이터를 띄운 뒤 `playwright.config.ts`의 `webServer` 설정이 그 안에서 Vite dev 서버(`VITE_USE_FIREBASE_EMULATOR=true`)까지 함께 띄우고, 끝나면 전부 내립니다. 테스트는 `e2e/*.spec.ts`에 있고, 이 하네스 세션에서 실제로 실행해 **11개 테스트가 모두 통과**하는 것까지 확인했습니다(재실행해도 안정적으로 통과). Playwright는 이 레포에 없던 `@playwright/test`를 devDependency로 새로 추가했고, 이 세션에는 브라우저를 새로 내려받을 네트워크 권한이 없어 `/opt/pw-browsers`에 미리 설치된 Chromium 리비전(1194)에 맞춰 정확히 그 리비전을 쓰는 `@playwright/test@1.56.0`을 선택해 `executablePath`로 직접 가리켰습니다.

로그인 자동화의 핵심 문제는 "진짜 Google 계정 없이 어떻게 로그인 상태를 만드는가"였습니다. Firebase Auth 에뮬레이터가 제공하는 가짜 IDP 위젯(`/emulator/auth/handler`)까지는 Playwright로 실제로 도달시킬 수 있었지만(계정 추가 → 이메일 입력 → 로그인 버튼 클릭까지 전부 동작함을 확인), `signInWithPopup`과 `signInWithRedirect` 둘 다 Firebase JS SDK 내부에서 리다이렉트 완료 처리를 위해 `https://apis.google.com/js/api.js`(gapi iframe)를 실제로 로드해야 하고, 이 하네스 세션의 아웃바운드 프록시 정책이 그 도메인을 403으로 차단합니다 — 정책을 우회하지 말라는 가이드라인에 따라 이 경로는 포기했습니다(실측: `auth/internal-error`, `getRedirectResult`도 동일). 그래서 `SignIn.tsx`에 `VITE_USE_FIREBASE_EMULATOR==='true'`일 때만 활성화되는, 쿼리 파라미터(`?e2eEmail=&e2eName=`)로 트리거되는 이메일/비번 기반의 에뮬레이터 전용 로그인 경로를 테스트 전용으로 추가했습니다. 이 env var는 `npm run test:e2e`를 돌릴 때만 설정되고, 프로덕션 빌드에는 전혀 설정되지 않습니다 — 실제로 `npm run build`한 결과물(`dist/assets/*.js`)에 `VITE_USE_FIREBASE_EMULATOR`나 `e2eEmail` 문자열이 전혀 없는 것까지 확인했습니다(Vite/Rollup이 `import.meta.env`의 미설정 값을 정적으로 판단해 그 분기를 통째로 트리쉐이킹함). 자세한 배경은 `e2e/fixtures.ts` 상단 주석에 남겨뒀습니다.

자동화하지 않고 남긴 것(진짜 하드 블로커 또는 이번 스코프 밖):
- **초안 생성/이 섹션 다시 쓰기/빈틈 지적**: Anthropic API 키가 필요한 Functions `generate` 호출 자체는 이 세션에 자격 증명이 없어 여전히 수동입니다. Mock으로 대체하지 않았습니다(과제 지침에 따라 AI 응답 내용을 가짜로 만들지 않음).
- **팝업 차단 폴백(`signInWithPopup` 자체, `signInWithRedirect`로의 폴백)**: 위에서 설명한 `apis.google.com` 차단 때문에 진짜 Google 팝업/리다이렉트 플로우 자체는 이 세션에서 구조적으로 재현이 불가능합니다.
- 문서 타입 삭제 방지, 카드 타입 라벨, 헤더 내비게이션(P1-b 전체), 커뮤니티 검색/필터, 작성자 이름 표시, 독립 저장 확인, 구버전 스펙/설정 마이그레이션, 반응형 전환(P2) 등은 이번에 손대지 않았습니다 — 자동화 가치 자체는 있지만 이번 요청 범위 밖이라 다음 세션 후보로 남겨둡니다.
