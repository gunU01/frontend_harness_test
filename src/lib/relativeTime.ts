import type { Timestamp } from 'firebase/firestore'

/**
 * Firestore Timestamp를 "3시간 전" 같은 상대 시간 한글 문자열로 변환합니다.
 * 카드 목록의 부가 정보 표시용 — 정밀한 계산이 필요하지 않아 별도 라이브러리 없이 처리합니다.
 */
export function toRelativeTime(timestamp: Timestamp): string {
  const diffMs = Date.now() - timestamp.toDate().getTime()
  const minutes = Math.floor(diffMs / (60 * 1000))

  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  const days = Math.floor(hours / 24)
  return `${days}일 전`
}
