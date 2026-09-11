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

export const defaultTemplates: DocTemplate[] = [
  { id: 'prd', name: 'PRD', sections: prdSections },
  { id: 'meeting-notes', name: '회의록', sections: meetingNotesSections },
]
