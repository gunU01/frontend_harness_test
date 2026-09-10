# PRD 작성 도구

한 줄 문제 정의만 넣으면 내 PRD 템플릿(섹션 + hint)에 맞춰 AI가 초안을 채워주는 개인용 도구입니다. 이 레포는 "PM은 무엇을 만들지보다, 무엇을 결정하는가" 강의의 실제 사례(case study)로 쓰기 위해 기획→개발→배포를 하네스(오케스트레이터 + 서브에이전트: planner/builder/styler/reviewer)로 진행했습니다.

## 스택

- Vite + React + TypeScript + Tailwind CSS (프론트엔드)
- Firebase Auth(Google 로그인) + Firestore (별도 서버 없이 프론트에서 직접 연동)
- Firebase Functions (`onCall` 단일 함수, Anthropic API 프록시)

## 화면 3개

- **설정** (`/settings`): 내 PRD 섹션 템플릿(제목/hint, 추가·삭제·순서변경)과 제품 설명(`productContext`)·용어집(`glossary`)
- **목록** (`/specs`): 작성 중인 스펙 카드 (draft/review/done 상태뱃지)
- **작성** (`/specs/:id`): 왼쪽 섹션 목록, 오른쪽 편집. 버튼 3개 — 초안 생성 / 이 섹션 다시 쓰기 / 빈틈 지적

## 데이터 구조

```
config/{uid}
  template: [{ key, title, hint }]
  productContext: string
  glossary: string

specs/{specId}
  uid, title, oneLiner, status
  sections: [{ key, title, content }]
  createdAt, updatedAt
```

## 로컬 실행

```bash
npm install
cp .env.example .env   # Firebase 콘솔의 웹앱 설정값 채우기
npm run dev
```

## 사용자가 직접 해야 하는 것 (이 하네스가 대신 할 수 없는 부분)

이 세션에는 Firebase 콘솔/결제 계정, `firebase login` 자격 증명이 없어 아래는 로컬/콘솔에서 직접 진행해야 합니다.

1. Firebase 콘솔에서 프로젝트 생성 → Authentication(Google 로그인 활성화), Firestore(프로덕션 모드, 리전 `asia-northeast3`), Hosting 켜기. 요금제는 Functions를 쓰려면 Blaze로 전환 (개인 사용량이면 사실상 무료, 불안하면 예산 알림 5달러 설정).
2. `npm i -g firebase-tools && firebase login`
3. `firebase functions:secrets:set ANTHROPIC_API_KEY`
4. `firebase deploy` (Firestore rules + Functions + Hosting 실배포)
5. `public/icon-192.png`, `public/icon-512.png` 추가 (manifest가 참조하지만 아직 실제 파일은 없음 — 아무 이미지나 넣어도 됩니다)

## GitHub Pages 프리뷰 배포

`.github/workflows/deploy-pages.yml`이 `claude/pm-lecture-planning-8rzvpl` 브랜치 푸시마다 정적 빌드를 GitHub Pages로 배포합니다 (레포 Settings → Pages → Source를 "GitHub Actions"로 설정 필요). Firebase 프로젝트를 만들었다면 레포 Secrets에 `VITE_FIREBASE_*` 값을 등록해야 로그인/Firestore가 실제로 동작합니다. Functions(AI 생성)는 Pages에서 동작하지 않으므로 실제 사용은 `firebase deploy`로 배포한 Firebase Hosting 쪽에서 확인하세요.

## 기능을 버린다 — 이번 스코프에서 뺀 것과 이유

이 강의 커리큘럼의 6챕터("기능을 버린다")를 그대로 이 프로젝트에 적용한 결과입니다.

| 뺀 기능 | 왜 뺐는가 |
|---|---|
| 버전 히스토리 / 되돌리기 | 1인 사용 도구라 충돌·분실 리스크가 낮음. 나중에 `updatedAt` 스냅샷만 남기는 방식으로 저비용 추가 가능 — 지금은 편집 자체를 끝내는 게 우선 |
| 코멘트 / 리뷰어 초대 | 이 도구는 "쓰는 사람" 1인 기준. 협업 리뷰는 완전히 다른 권한 모델(Firestore rules 재설계)이 필요해 범위가 커짐 |
| 검색 | 스펙 개수가 적을 개인 사용 단계에선 목록 스크롤로 충분 |
| 공유 / 퍼블릭 링크 | 인증 없는 접근 경로를 새로 열어야 해서 보안 범위가 커짐. 필요해지면 별도 스코프로 |
| 마크다운 프리뷰 | textarea 하나로 충분한 "못생겨도 되는" 단계. 에디터를 잘 만들려다 시간을 다 쓰는 게 주말 MVP의 가장 흔한 실패 패턴 |
| 드래그 앤 드롭 섹션 순서변경 | 라이브러리 없이 위/아래 버튼으로 5분이면 끝나는 기능. 드래그 구현에 드는 시간 대비 이득이 없음 |
| 오프라인 캐싱 / 서비스워커 | 개발 중 옛날 버전이 계속 뜨는 문제만 만들고, 이 앱엔 오프라인 이득이 없음 |
| Functions를 draft/section/critique 3개로 분리 | 프롬프트 조립 로직이 세 군데로 흩어지는 걸 막기 위해 `mode` 파라미터 하나로 통일 |
| 과거 스펙 전체를 컨텍스트로 주입 | 최근 3개 제목+요약 정도만 주는 게 맞음 (전체를 주면 출력이 그대로 베끼는 경향) — 지금 `generate.ts`는 아직 이 부분 미구현, 다음 이터레이션 후보 |

각 항목은 "언젠가 하면 좋은 기능"이 아니라 "지금 스코프에서 명시적으로 뺀 이유가 있는 결정"입니다 — 강의에서 그대로 보여줄 의사결정 로그이기도 합니다.
