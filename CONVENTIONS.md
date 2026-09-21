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
- **함수형 컴포넌트 원칙의 유일한 예외**: React 에러 바운더리(`static getDerivedStateFromError`/`componentDidCatch`)는 클래스 컴포넌트로만 만들 수 있어서 `src/components/ErrorBoundary.tsx`만 클래스 컴포넌트입니다. 다른 이유로 클래스 컴포넌트를 새로 만들지 마세요.

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

한 화면에 저장 대상이 여러 개면(`SpecEditor.tsx`의 title/oneLiner, section content, risks, stakeholders처럼) 필드마다 독립된 타이머/스킵 ref 쌍을 따로 둡니다 — 하나의 타이머를 공유하면 서로 다른 필드의 변경이 저장을 밀어내거나 덮어씁니다. `updateSpec(id, { risks })`처럼 바뀐 필드만 부분 업데이트하고, 관계없는 필드를 같이 보내지 않습니다.

## 체크리스트형 목록 UI

가정/리스크 트래커, 이해관계자 확인 체크리스트처럼 "항목 추가 + 체크박스 토글 + 삭제"만 있는 목록은 배열 필드 하나(`{id, text 또는 name, resolved 또는 confirmed}[]`)로 저장하고, 별도 컴포넌트로 빼기보다 화면 안에 인라인 블록으로 둡니다 — 필드명과 저장 타이머가 서로 달라서 억지로 공통 컴포넌트로 묶으면 오히려 복잡해집니다. 두 군데 이상에서 완전히 같은 모양으로 반복되면 그때 공통 컴포넌트를 검토하세요.

## 스타일 (Tailwind)

- Tailwind 유틸리티 클래스만 사용 — CSS 모듈, styled-components, 인라인 style 객체를 쓰지 않습니다.
- 커스텀 값은 `tailwind.config.js`의 `theme.extend`에만 추가합니다 (`colors.primary`/`slate`/`red`/`green`/`amber`, `fontFamily.sans`). 컴포넌트 안에 임의 hex나 px 값을 하드코딩하지 않습니다.
- 색상 토큰은 Figma 디자인 시스템([링크](https://www.figma.com/design/Eqfw554mL4YxqKbcXRq3su)) Foundations 페이지의 프리미티브 램프와 동기화되어 있어야 합니다. 새 시맨틱 색이 필요하면 먼저 Figma 쪽에 정의하고 코드에 가져오세요 — 코드에서 먼저 임의로 정하지 않습니다.

### 프리미티브 램프 (v6, OKLCH 재구축)

`primary`(brand)/`slate`(neutral)/`red`(status-error)/`green`(status-success)/`amber`(status-warning) 다섯 램프 모두 OKLCH 지각 균일 명도를 기준으로 다시 뽑았습니다 — 50~900 각 숫자 단계가 모든 색상군에서 같은 목표 명도(L)를 공유합니다 (`slate-100`과 `red-100`이 이제 흰 배경 대비 서로 비슷한 대비를 가짐, 예전처럼 색상마다 들쭉날쭉하지 않음). `amber`(경고색)만 예외 — 어두운 단계에서 다른 색과 같은 명도를 강제하면 누렇다 못해 갈색/올리브색으로 보이는 "다크 옐로우 문제" 때문에, `amber`의 700~900단계는 공유 명도 곡선보다 의도적으로 더 밝게, 채도는 더 낮게 잡아 "노란/황색"으로 계속 읽히도록 별도 보정했습니다. 이 보정은 v3에서 배지 텍스트 대비 때문에 `status/*` 500 대신 700 계열을 썼던 것과 같은 종류의 "숫자 그대로 강제하지 않는 의도적 예외"입니다 — 자세한 배경은 README.md "디자인 시스템" v6 절 참고.

새 색이 필요하면 직접 hex를 고르지 말고, 반드시 같은 방식(OKLCH 목표 명도 + 감마트 클램프)으로 램프를 확장하거나 Figma Foundations의 기존 램프에서 가져오세요.

### 시맨틱 네이밍 (Target × Role × Variant)

컴포넌트에서 색을 고를 땐 아래 표로 프리미티브 클래스를 선택하세요. **Tailwind 설정에는 별도의 `fill`/`text`/`border` 색상 그룹을 추가하지 않았습니다** — 1인 프로젝트에서 프리미티브와 시맨틱 두 벌을 따로 유지하면 색 하나 바꿀 때마다 두 군데를 손으로 맞춰야 해서, 대신 "시맨틱 이름 → 실제 Tailwind 클래스" 매핑을 여기 문서 하나로만 관리합니다. 새 화면을 만들 때는 이 표에서 맞는 조합을 찾아 쓰고, 표에 없는 조합이 필요하면 표를 먼저 넓히세요 (컴포넌트에서 즉흥적으로 새 색을 쓰지 않기).

| Target | Role | Variant | 실제 클래스 예시 |
|---|---|---|---|
| fill | brand | default | `bg-primary-500` (버튼 등 강조 배경) |
| fill | brand | weak | `bg-primary-50` |
| fill | neutral | default | `bg-white` |
| fill | neutral | weak | `bg-slate-50` / `bg-slate-100` |
| fill | status-success | weak | `bg-green-100` (완료 배지 배경) |
| fill | status-warning | weak | `bg-amber-50` / `bg-amber-100` |
| fill | status-error | weak | `bg-red-50` |
| text | brand | default | `text-primary-600` |
| text | neutral | default | `text-slate-900` (제목) |
| text | neutral | weak | `text-slate-500` / `text-slate-400` (보조 텍스트) |
| text | neutral | alt | `text-slate-600` / `text-slate-700` (본문) |
| text | status-success | default | `text-green-700` |
| text | status-warning | default | `text-amber-700` / `text-amber-800` |
| text | status-error | default | `text-red-600` |
| border | neutral | default | `border-slate-300` |
| border | neutral | weak | `border-slate-100` / `border-slate-200` |
| border | neutral | alt | `border-slate-400` |
| border | brand | default | `border-primary-500` |
| border | status-warning | default | `border-amber-200` |
| border | status-error | default | `border-red-200` |

- 버튼 위계: primary = `bg-primary-500 ... hover:bg-primary-600`, secondary = `bg-white border border-slate-300 ...`. 강조가 필요한 선택 상태(선택된 섹션/문서 타입 등)도 `bg-primary-500`을 씁니다 — `bg-slate-900` 같은 임의 검정을 새로 쓰지 않습니다.
- 상태 배지(review/done 등)는 `fill/status-*/weak` + `text/status-*/default` 조합(`bg-green-100 text-green-700`, `bg-amber-100 text-amber-700`)을 그대로 씁니다.
- 모서리: 버튼/인풋 `rounded-md`, 카드형 컨테이너 `rounded-lg`, 배지 `rounded-full`.
- **기존 컴포넌트 className은 이번 v6 리빌드에서 건드리지 않았습니다** (Foundations + Tailwind 설정 + 문서만 범위) — 화면을 새로 만들거나 기존 화면을 수정할 때부터 위 표를 기준으로 맞추면 됩니다. 전체 화면을 한 번에 새 토큰으로 옮기는 건 별도 후속 작업입니다.

## 접근성

- 모든 `<input>`/`<textarea>`/`<select>`에는 `<label htmlFor>`가 있어야 합니다. 시각적으로 숨겨야 하면 텍스트 라벨 대신 `sr-only` 클래스를 쓰지, 라벨 자체를 생략하지 않습니다.
- 아이콘만 있는 버튼(위/아래/삭제 등)에는 `aria-label`이 있어야 합니다.
- 클릭 가능한 요소는 항상 실제 `<button>`/`<a>`/`<select>`입니다 — `onClick`이 달린 `<div>`를 쓰지 않습니다.

## Firebase / Functions

- 별도 백엔드 서버 없이 프론트엔드에서 Firestore/Auth를 직접 호출합니다. 권한은 `firestore.rules`의 `request.auth.uid` 검사로만 강제합니다.
- Cloud Function은 기능별로 여러 개 만들지 않고, `mode` 파라미터로 분기하는 단일 `onCall` 함수(`functions/index.js`의 `generate`)로 유지합니다. 새 AI 동작이 필요해도 이 함수에 mode를 추가하는 쪽을 먼저 검토하세요.
- 클라이언트에서 Functions를 호출하는 wrapper(`services/generate.ts`)는 응답 shape를 런타임에 검증하는 타입가드를 거친 뒤 반환합니다 (`isGenerateResult`/`parseGenerateResult` 패턴) — `as`로 그냥 캐스팅하지 않습니다.

## 테스트 (Vitest 단위 테스트 vs E2E/rules)

- `npm run test:unit`(Vitest)은 **순수/거의 순수 함수**만 대상으로 합니다: 입력 → 출력이 결정적이고 auth/Firestore/브라우저 상태가 필요 없는 함수(`toRelativeTime`, `fillSpecDefaults`, `parseDraft`, `makeKey` 같은 것들). 테스트하려는 함수가 원래 `export` 안 되어 있었다면, 동작은 바꾸지 않고 `export`만 추가해서 테스트합니다(`// 테스트(vitest)에서 직접 검증하기 위해서만 export` 주석을 남깁니다).
- 로그인 상태, Firestore 실제 읽기/쓰기, 라우팅, 화면 렌더링/클릭이 필요한 시나리오는 계속 `npm run test:e2e`(Playwright)나 `npm run test:rules`(Firestore 보안 규칙)에 둡니다 — Vitest에 jsdom/React Testing Library를 새로 끌어들이지 않습니다.
- 판단 기준: **엣지케이스가 있는 순수 함수 = unit test 추가**, **auth/Firestore/브라우저 상태가 하나라도 필요하면 = E2E/rules 유지**. 테스트 파일은 대상 파일과 같은 디렉터리에 `이름.test.ts`(또는 `.tsx`)로 둡니다(`vitest.config.ts`의 `include: ['src/**/*.test.ts', 'src/**/*.test.tsx']` 참고).

## 커밋 메시지

제목은 한 줄 요약(영문), 본문은 "무엇을" 보다 "왜"를 설명합니다 (배경, 트레이드오프, 다음에 참고할 결정). 나중에 왜 그렇게 했는지 스스로 다시 찾아볼 수 있도록, 스코프를 자르거나 넓힌 이유는 커밋 메시지와 README 양쪽에 남깁니다.
