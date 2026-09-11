# 컨벤션

이 문서는 규칙을 미리 정해놓은 게 아니라, 지금까지 쓴 코드에서 실제로 반복된 패턴을 정리한 것입니다. 서브에이전트(builder/styler/reviewer)는 새 코드를 쓰기 전에 이 문서와 가장 가까운 기존 파일을 먼저 보고 맞추세요.

## 파일 구조

```
src/
  pages/        라우팅되는 화면 단위 (App.tsx의 <Route element>와 1:1)
  components/   여러 화면에서 재사용하는 UI 조각 (지금은 PrivateRoute뿐)
  contexts/     React Context + Provider (지금은 AuthContext뿐)
  services/     Firestore/Functions 접근 함수. React를 import하지 않는 순수 async 함수 모음
  lib/          부수효과 없는 데이터/타입 정의 (지금은 defaultTemplates뿐)
```

새 화면은 `pages/`, 화면 3개 이상이 같은 조각을 쓰면 그때 `components/`로 뺍니다 — 미리 만들어두지 않습니다.

## 컴포넌트

- **named export만 사용**: `export function ComponentName() { ... }`. `export default`는 쓰지 않습니다 (한 번 리뷰에서 지적되어 전체 통일함).
- 한 파일에 컴포넌트 하나. 파일명 = 컴포넌트명 (PascalCase).
- Props가 없는 페이지 컴포넌트는 인자 없이 바로 훅을 씁니다 (`useAuth()`, `useState` 등) — props로 내려주지 않습니다.

## 데이터 계층 (`services/`)

- Firestore 문서 shape는 그 문서를 다루는 서비스 파일 안에 TypeScript interface로 정의하고 `export`합니다 (예: `specs.ts`의 `Spec`, `SpecSection`).
- 함수는 컬렉션/문서 단위 CRUD만 합니다 — 화면 로직(리다이렉트, 폼 상태)은 절대 여기 넣지 않습니다.
- 생성 시각/수정 시각은 항상 `serverTimestamp()`. 클라이언트 `Date.now()`를 쓰지 않습니다.
- **스냅샷 원칙**: 한 문서가 다른 문서(템플릿 등)를 참조해서 만들어질 때, 참조가 아니라 그 시점 값을 통째로 복사해서 저장합니다. (`createSpec`이 `template.sections`를 복사해 `spec.sections`에 저장 — 나중에 템플릿이 바뀌어도 이미 만든 스펙은 안 바뀌게). 새로 문서 간 관계를 만들 때 이 원칙을 먼저 검토하세요.
- Firestore 문서를 읽어서 타입 캐스팅할 때(`snap.data() as X`) 구버전 문서에 없을 수 있는 필드는 기본값으로 채웁니다 (`config.ts`의 `getOrCreateConfig` 참고) — 크래시보다 채우는 쪽을 택합니다.

## 자동저장 패턴

폼을 수정할 때마다 저장하지 않고, 아래 패턴으로 2초 디바운스 저장합니다 (`Settings.tsx`, `SpecEditor.tsx` 참고):

```ts
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const skipFirstSave = useRef(true) // 최초 로드 시 저장 스킵용

useEffect(() => {
  if (skipFirstSave.current) { skipFirstSave.current = false; return }
  if (timerRef.current) clearTimeout(timerRef.current)
  timerRef.current = setTimeout(() => { /* save */ }, 2000)
  return () => { if (timerRef.current) clearTimeout(timerRef.current) }
}, [/* watched fields */])
```

별도 저장 버튼은 두지 않고, "저장 중.../저장됨" 같은 작은 텍스트 인디케이터만 둡니다.

## 스타일 (Tailwind)

- Tailwind 유틸리티 클래스만 사용 — CSS 모듈, styled-components, 인라인 style 객체를 쓰지 않습니다.
- 커스텀 값은 `tailwind.config.js`의 `theme.extend`에만 추가합니다 (`colors.primary`, `fontFamily.sans`). 컴포넌트 안에 임의 hex나 px 값을 하드코딩하지 않습니다.
- 색상 토큰은 Figma 디자인 시스템([링크](https://www.figma.com/design/Eqfw554mL4YxqKbcXRq3su))의 `primary` 램프와 동기화되어 있어야 합니다. 새 시맨틱 색이 필요하면 먼저 Figma 쪽에 정의하고 코드에 가져오세요 — 코드에서 먼저 임의로 정하지 않습니다.
- 버튼 위계: primary = `bg-primary-500 ... hover:bg-primary-600`, secondary = `bg-white border border-slate-300 ...`. 강조가 필요한 선택 상태(선택된 섹션/문서 타입 등)도 `bg-primary-500`을 씁니다 — `bg-slate-900` 같은 임의 검정을 새로 쓰지 않습니다.
- 모서리: 버튼/인풋 `rounded-md`, 카드형 컨테이너 `rounded-lg`, 배지 `rounded-full`.

## 접근성

- 모든 `<input>`/`<textarea>`/`<select>`에는 `<label htmlFor>`가 있어야 합니다. 시각적으로 숨겨야 하면 텍스트 라벨 대신 `sr-only` 클래스를 쓰지, 라벨 자체를 생략하지 않습니다.
- 아이콘만 있는 버튼(위/아래/삭제 등)에는 `aria-label`이 있어야 합니다.
- 클릭 가능한 요소는 항상 실제 `<button>`/`<a>`/`<select>`입니다 — `onClick`이 달린 `<div>`를 쓰지 않습니다.

## Firebase / Functions

- 별도 백엔드 서버 없이 프론트엔드에서 Firestore/Auth를 직접 호출합니다. 권한은 `firestore.rules`의 `request.auth.uid` 검사로만 강제합니다.
- Cloud Function은 기능별로 여러 개 만들지 않고, `mode` 파라미터로 분기하는 단일 `onCall` 함수(`functions/index.js`의 `generate`)로 유지합니다. 새 AI 동작이 필요해도 이 함수에 mode를 추가하는 쪽을 먼저 검토하세요.
- 클라이언트에서 Functions를 호출하는 wrapper(`services/generate.ts`)는 응답 shape를 런타임에 검증하는 타입가드를 거친 뒤 반환합니다 (`isGenerateResult`/`parseGenerateResult` 패턴) — `as`로 그냥 캐스팅하지 않습니다.

## 커밋 메시지

제목은 한 줄 요약(영문), 본문은 "무엇을" 보다 "왜"를 설명합니다 (배경, 트레이드오프, 다음에 참고할 결정). 이 레포는 강의 사례이기도 해서, 스코프를 자르거나 넓힌 이유는 커밋 메시지와 README 양쪽에 남깁니다.
