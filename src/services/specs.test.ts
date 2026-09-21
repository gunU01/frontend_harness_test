import { describe, expect, it } from 'vitest'
import { fillSpecDefaults } from './specs'

// fillSpecDefaults는 구버전 Firestore 문서(authorName/risks/stakeholders가 없던 시절에
// 만들어진 spec 문서)를 크래시 없이 읽기 위한 유일한 방어선이라 엣지케이스를 꼼꼼히 본다.
describe('fillSpecDefaults', () => {
  it('backfills authorName/risks/stakeholders when entirely missing', () => {
    const result = fillSpecDefaults('spec-1', {
      uid: 'u1',
      title: '제목',
      oneLiner: '한줄',
    })

    expect(result.id).toBe('spec-1')
    expect(result.authorName).toBe('익명')
    expect(result.risks).toEqual([])
    expect(result.stakeholders).toEqual([])
    expect(result.projectId).toBe('unclassified')
    expect(result.uid).toBe('u1')
    expect(result.title).toBe('제목')
  })

  it('treats null the same as missing (falls back to defaults)', () => {
    const result = fillSpecDefaults('spec-2', {
      authorName: null,
      risks: null,
      stakeholders: null,
    })

    expect(result.authorName).toBe('익명')
    expect(result.risks).toEqual([])
    expect(result.stakeholders).toEqual([])
  })

  it('treats undefined the same as missing (falls back to defaults)', () => {
    const result = fillSpecDefaults('spec-3', {
      authorName: undefined,
      risks: undefined,
      stakeholders: undefined,
    })

    expect(result.authorName).toBe('익명')
    expect(result.risks).toEqual([])
    expect(result.stakeholders).toEqual([])
  })

  it('passes through already-present empty arrays unchanged', () => {
    const result = fillSpecDefaults('spec-4', {
      authorName: '홍길동',
      risks: [],
      stakeholders: [],
    })

    expect(result.authorName).toBe('홍길동')
    expect(result.risks).toEqual([])
    expect(result.stakeholders).toEqual([])
  })

  it('passes through an already-complete document unchanged', () => {
    const risks = [{ id: 'r1', text: '위험1', resolved: false }]
    const stakeholders = [{ id: 's1', name: '이해관계자1', confirmed: true }]

    const result = fillSpecDefaults('spec-5', {
      uid: 'u1',
      authorName: '홍길동',
      projectId: 'project-1',
      title: '제목',
      oneLiner: '한줄',
      status: 'draft',
      sections: [],
      templateId: 't1',
      docType: 'PRD',
      published: false,
      risks,
      stakeholders,
    })

    expect(result).toMatchObject({
      id: 'spec-5',
      uid: 'u1',
      authorName: '홍길동',
      projectId: 'project-1',
      title: '제목',
      oneLiner: '한줄',
      status: 'draft',
      sections: [],
      templateId: 't1',
      docType: 'PRD',
      published: false,
      risks,
      stakeholders,
    })
  })

  it('backfills projectId to the unclassified sentinel when missing (pre-project docs)', () => {
    const result = fillSpecDefaults('spec-6', {
      uid: 'u1',
      title: '제목',
      oneLiner: '한줄',
    })

    expect(result.projectId).toBe('unclassified')
  })
})
