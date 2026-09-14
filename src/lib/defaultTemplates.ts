export interface TemplateSection {
  key: string
  title: string
  hint: string
}

export interface DocTemplate {
  id: string
  name: string
  sections: TemplateSection[]
}

const prdSections: TemplateSection[] = [
  {
    key: 'problem',
    title: '문제',
    hint: '누가, 어떤 상황에서, 무엇 때문에 곤란한지 3~5문장. 해결책이나 기능 이름은 절대 쓰지 말 것.',
  },
  {
    key: 'evidence',
    title: '근거',
    hint: "이게 진짜 문제라는 증거. 지표, 인터뷰 인용, CS 티켓 건수. 증거가 없으면 '없음 - 가설 단계'라고 정직하게 쓸 것.",
  },
  {
    key: 'goals',
    title: '목표와 성공지표',
    hint: "지표는 1~2개만. 반드시 '현재값 → 목표값 (기간)' 형식. 정성적 표현 금지.",
  },
  {
    key: 'nonGoals',
    title: '하지 않을 것',
    hint: "이번 범위에서 명시적으로 뺄 것들과 그 이유. 나중에 '이것도 되죠?' 소리를 막는 섹션.",
  },
  {
    key: 'solution',
    title: '해결 방향',
    hint: '상세 기능 명세가 아니라 접근법과 그렇게 정한 이유. 검토한 대안과 탈락 사유를 한 줄씩.',
  },
  {
    key: 'risks',
    title: '리스크와 미해결 질문',
    hint: '틀렸을 경우 가장 크게 다치는 가정. 아직 답을 모르는 질문은 답을 지어내지 말고 질문 형태로 남길 것.',
  },
  {
    key: 'rollout',
    title: '출시 계획',
    hint: "단계별 공개 범위, 되돌리는 방법, 판단 시점. 간단한 건 '한 번에 전체 공개'라고만 써도 됨.",
  },
]

const meetingNotesSections: TemplateSection[] = [
  {
    key: 'purpose',
    title: '목적',
    hint: '이 회의를 왜 하는지 한 문장. 안건이 여러 개면 가장 중요한 것 하나만.',
  },
  {
    key: 'attendees',
    title: '참석자',
    hint: '이름과 역할. 의사결정권자가 누구인지 표시할 것.',
  },
  {
    key: 'discussion',
    title: '논의 내용',
    hint: '오간 이야기를 시간순이 아니라 주제별로 정리. 결론이 아니라 어떤 의견이 나왔는지.',
  },
  {
    key: 'decisions',
    title: '결정 사항',
    hint: '무엇을 하기로 했는지만. 왜 그렇게 결정했는지는 논의 내용에 이미 있으니 반복하지 말 것.',
  },
  {
    key: 'action-items',
    title: '액션 아이템',
    hint: "담당자와 기한이 없는 액션 아이템은 아이템이 아니라 희망사항이다. 반드시 '누가 언제까지' 포함.",
  },
]

const featureSpecSections: TemplateSection[] = [
  {
    key: 'overview',
    title: '개요',
    hint: '이 기능이 무엇이고 왜 필요한지 2~3문장. 배경 설명은 PRD를 참고하고 여기선 결론만.',
  },
  {
    key: 'user-flow',
    title: '유저 플로우',
    hint: '진입점부터 완료까지 사용자가 거치는 단계를 순서대로. 화면이 여러 개면 화면별로 나눠 쓸 것.',
  },
  {
    key: 'edge-cases',
    title: '엣지 케이스',
    hint: '빈 값, 실패, 권한 없음, 네트워크 끊김 등 정상 흐름을 벗어나는 경우와 각각의 처리 방법.',
  },
  {
    key: 'api-data-changes',
    title: 'API/데이터 변경사항',
    hint: '새로 추가되거나 바뀌는 필드, 엔드포인트, 스키마. 기존 데이터 마이그레이션이 필요하면 명시.',
  },
  {
    key: 'qa-checklist',
    title: 'QA 체크리스트',
    hint: '출시 전 반드시 확인해야 할 항목을 체크리스트 형태로. 엣지 케이스 섹션과 1:1로 대응시킬 것.',
  },
]

const releaseNotesSections: TemplateSection[] = [
  {
    key: 'summary',
    title: '요약',
    hint: '이번 릴리스에서 가장 중요한 변화 한 줄. 사용자 입장에서 무엇이 달라지는지.',
  },
  {
    key: 'changes',
    title: '변경 사항',
    hint: '추가/개선/수정된 항목을 목록으로. 내부 리팩터링처럼 사용자에게 안 보이는 변경은 빼거나 별도 표시.',
  },
  {
    key: 'affected-users',
    title: '영향받는 사용자',
    hint: '전체인지 일부 세그먼트인지, 어떤 조건의 사용자에게 어떤 영향이 있는지 구체적으로.',
  },
  {
    key: 'rollout-plan',
    title: '롤아웃 계획',
    hint: '언제 누구에게 먼저 나가는지, 단계가 있다면 각 단계의 기준과 되돌리는 방법.',
  },
]

const abTestPlanSections: TemplateSection[] = [
  {
    key: 'hypothesis',
    title: '가설',
    hint: "'~하면 ~할 것이다' 형태로 하나만. 틀렸다고 밝혀져도 유용한 가설인지 스스로 검토할 것.",
  },
  {
    key: 'metrics',
    title: '측정 지표',
    hint: '성공/실패를 가를 주 지표 1개와 보조 지표. 부작용을 잡아낼 가드레일 지표도 함께 적을 것.',
  },
  {
    key: 'target-duration',
    title: '대상군/기간',
    hint: '실험군·대조군을 나누는 기준, 표본 크기, 최소 실행 기간. 근거 없이 기간을 짧게 잡지 말 것.',
  },
  {
    key: 'success-criteria',
    title: '성공 기준',
    hint: "실험 시작 전에 미리 정하는 판단 기준. 예: '주 지표가 몇 % 이상 개선되면 전체 배포'. 끝나고 나서 기준을 바꾸지 말 것.",
  },
]

const decisionLogSections: TemplateSection[] = [
  {
    key: 'decision',
    title: '결정 사항',
    hint: '무엇을 하기로 했는지 한두 문장으로 명확하게. 여지를 남기는 표현 대신 확정된 문장으로 쓸 것.',
  },
  {
    key: 'background',
    title: '배경/문제',
    hint: '이 결정이 왜 필요했는지, 어떤 문제나 상황에서 나온 결정인지.',
  },
  {
    key: 'alternatives',
    title: '검토한 대안',
    hint: '결정한 안 말고 함께 고려했던 대안들을 나열. 대안이 하나도 없었다면 그것도 정직하게 밝힐 것.',
  },
  {
    key: 'rationale',
    title: '선택 이유(트레이드오프)',
    hint: '왜 이 대안이 아니라 저 대안을 골랐는지, 포기한 것과 얻은 것을 함께 쓸 것.',
  },
  {
    key: 'revert-conditions',
    title: '되돌리기 조건',
    hint: '어떤 신호가 보이면 이 결정을 재검토할지 미리 정해둘 것. 정하지 않으면 나중에 아무도 되돌아보지 않는다.',
  },
]

const priorityScoringSections: TemplateSection[] = [
  {
    key: 'candidates',
    title: '평가 대상 목록',
    hint: '점수를 매길 후보(기능/아이디어)를 목록으로. 이후 섹션에서 같은 이름으로 반복 참조할 것.',
  },
  {
    key: 'reach',
    title: 'Reach(도달)',
    hint: '후보마다 한 줄씩 나열: 이름 - 점수 - 이렇게 매긴 이유. 표나 계산식이 아니라 문장으로 근거를 남길 것.',
  },
  {
    key: 'impact',
    title: 'Impact(영향도)',
    hint: '후보마다 한 줄씩 나열: 이름 - 점수 - 이렇게 매긴 이유. 도달만 크고 영향이 얕은 항목을 걸러낼 것.',
  },
  {
    key: 'confidence',
    title: 'Confidence(확신도)',
    hint: '후보마다 한 줄씩 나열: 이름 - 점수 - 이렇게 매긴 이유. 근거 없는 추정에는 낮은 점수를 줄 것.',
  },
  {
    key: 'effort',
    title: 'Effort(투입 노력)',
    hint: '후보마다 한 줄씩 나열: 이름 - 점수(사람*기간 등) - 이렇게 매긴 이유. 과소평가하지 말 것.',
  },
  {
    key: 'conclusion',
    title: '종합 점수와 결론',
    hint: '후보마다 종합 점수와 순위, 그리고 최종적으로 무엇을 먼저 할지 한 문장 결론.',
  },
]

export const defaultTemplates: DocTemplate[] = [
  { id: 'prd', name: 'PRD', sections: prdSections },
  { id: 'meeting-notes', name: '회의록', sections: meetingNotesSections },
  { id: 'feature-spec', name: '기능 명세서', sections: featureSpecSections },
  { id: 'release-notes', name: '릴리즈 노트', sections: releaseNotesSections },
  { id: 'ab-test-plan', name: '실험 설계서', sections: abTestPlanSections },
  { id: 'decision-log', name: '의사결정 로그', sections: decisionLogSections },
  { id: 'priority-scoring', name: '우선순위 스코어링', sections: priorityScoringSections },
]
