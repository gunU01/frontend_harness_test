import { describe, expect, it } from 'vitest'
import { parseDraft } from './SpecEditor'

describe('parseDraft', () => {
  it('parses multiple ## sectionKey blocks into a record', () => {
    const text = '## problem\n문제 설명\n\n## goal\n목표 설명'
    expect(parseDraft(text)).toEqual({
      problem: '문제 설명',
      goal: '목표 설명',
    })
  })

  it('does not throw on input with no ## headers (empty string -> {})', () => {
    expect(parseDraft('')).toEqual({})
  })

  it('does not throw on plain text with no ## headers (treats the whole text as one keyless-ish entry)', () => {
    // split()이 매치가 없으면 원문 전체를 단일 파트로 돌려주므로, 헤더가 없는 텍스트는
    // "전체 텍스트를 trim한 문자열"을 키로, 빈 문자열을 값으로 갖는 엔트리 하나가 된다.
    // (크래시는 나지 않지만 빈 객체 {}가 되는 것은 아니다 — 실제 동작 그대로 검증)
    const result = parseDraft('헤더 없는 그냥 텍스트입니다.')
    expect(result).toEqual({ '헤더 없는 그냥 텍스트입니다.': '' })
  })

  it('trims leading/trailing whitespace from the section key and content', () => {
    const text = '##   problem   \n\n  문제 설명  \n  둘째 줄  \n'
    const result = parseDraft(text)
    expect(result.problem).toBe('문제 설명  \n  둘째 줄')
  })

  it('keeps a key with empty content as an empty string', () => {
    const text = '## problem\n## goal\n목표 설명'
    const result = parseDraft(text)
    expect(result.problem).toBe('')
    expect(result.goal).toBe('목표 설명')
  })
})
