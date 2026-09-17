import {
  addDoc,
  collection,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

export interface AnalyticsEvent {
  id: string
  uid: string
  name: string
  properties: Record<string, unknown>
  timestamp: Timestamp
}

const DEFAULT_LIST_LIMIT = 2000

// Fire-and-forget: 실패해도 호출부의 실제 동작(스펙 생성, 로그인 등)을 절대 막지 않는다.
// 그래도 promise는 반환하므로 호출부가 원하면 await/catch할 수 있다.
export function trackEvent(
  uid: string,
  name: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  return addDoc(collection(db, 'events'), {
    uid,
    name,
    properties,
    timestamp: serverTimestamp(),
  })
    .then(() => undefined)
    .catch((error) => {
      console.error('trackEvent failed', name, error)
    })
}

// timestamp 오름차순: 퍼널/리텐션 집계는 시간순으로 이벤트를 훑어야 하는 경우가 많아
// (예: 첫 이벤트부터 순서대로 세션/단계를 구성) 오름차순이 더 자연스럽다.
export async function listMyEvents(
  uid: string,
  opts?: { since?: Date; limit?: number },
): Promise<AnalyticsEvent[]> {
  const constraints = [where('uid', '==', uid)]
  if (opts?.since) {
    constraints.push(where('timestamp', '>=', opts.since))
  }

  const q = query(
    collection(db, 'events'),
    ...constraints,
    orderBy('timestamp', 'asc'),
    firestoreLimit(opts?.limit ?? DEFAULT_LIST_LIMIT),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      uid: data.uid as string,
      name: data.name as string,
      properties: (data.properties as Record<string, unknown>) ?? {},
      timestamp: data.timestamp as Timestamp,
    }
  })
}
