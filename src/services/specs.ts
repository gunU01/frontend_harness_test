import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { QueryConstraint, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { DocTemplate } from '../lib/defaultTemplates'

export type SpecStatus = 'draft' | 'review' | 'done'

export interface SpecSection {
  key: string
  title: string
  hint: string
  content: string
}

export interface SpecRisk {
  id: string
  text: string
  resolved: boolean
}

export interface SpecStakeholder {
  id: string
  name: string
  confirmed: boolean
}

export interface Spec {
  id: string
  uid: string
  authorName: string
  // 소속 프로젝트 id. 프로젝트가 없는(구버전/미분류) 스펙은 'unclassified' 센티널 값을 쓴다 —
  // null/undefined로 두면 project별 필터링 로직마다 null 분기가 필요해지므로 피한다.
  projectId: string
  title: string
  oneLiner: string
  status: SpecStatus
  sections: SpecSection[]
  templateId: string
  docType: string
  published: boolean
  risks: SpecRisk[]
  stakeholders: SpecStakeholder[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export async function createSpec(
  uid: string,
  authorName: string,
  title: string,
  oneLiner: string,
  template: DocTemplate,
  projectId: string,
): Promise<string> {
  const sections: SpecSection[] = template.sections.map((section) => ({
    key: section.key,
    title: section.title,
    hint: section.hint,
    content: '',
  }))

  const ref = await addDoc(collection(db, 'specs'), {
    uid,
    authorName,
    projectId,
    title,
    oneLiner,
    status: 'draft' as SpecStatus,
    sections,
    templateId: template.id,
    docType: template.name,
    published: false,
    risks: [],
    stakeholders: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return ref.id
}

// 테스트(vitest)에서 직접 검증하기 위해서만 export — 동작은 그대로.
export function fillSpecDefaults(id: string, data: Record<string, unknown>): Spec {
  return {
    id,
    ...data,
    authorName: (data.authorName as string) ?? '익명',
    projectId: (data.projectId as string) ?? 'unclassified',
    risks: (data.risks as SpecRisk[]) ?? [],
    stakeholders: (data.stakeholders as SpecStakeholder[]) ?? [],
  } as Spec
}

export async function listSpecs(uid: string): Promise<Spec[]> {
  const q = query(collection(db, 'specs'), where('uid', '==', uid), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => fillSpecDefaults(d.id, d.data()))
}

export async function listSpecsByProject(uid: string, projectId: string): Promise<Spec[]> {
  const q = query(
    collection(db, 'specs'),
    where('uid', '==', uid),
    where('projectId', '==', projectId),
    orderBy('updatedAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => fillSpecDefaults(d.id, d.data()))
}

export async function listPublishedSpecs(): Promise<Spec[]> {
  const q = query(collection(db, 'specs'), where('published', '==', true), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => fillSpecDefaults(d.id, d.data()))
}

// listPublishedSpecs/listSpecs와 동일한 shape이지만 uid 필터 없이 전체 specs를 조회한다.
// firestore.rules상 isAdmin()인 호출자만 성공한다. updatedAt이 아닌 createdAt 내림차순으로
// 정렬한 것은, 관리자 개요는 "최근 수정된 것"보다 "최근에 새로 만들어진 것"을 먼저 보는 편이
// 전체 사용자 활동 파악에 더 유용하다고 판단했기 때문.
export async function listAllSpecsForAdmin(opts?: { limit?: number }): Promise<Spec[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]
  if (opts?.limit) {
    constraints.push(firestoreLimit(opts.limit))
  }
  const q = query(collection(db, 'specs'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => fillSpecDefaults(d.id, d.data()))
}

export async function getSpec(specId: string): Promise<Spec | null> {
  const ref = doc(db, 'specs', specId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return fillSpecDefaults(snap.id, snap.data())
}

export async function updateSpec(specId: string, data: Partial<Spec>): Promise<void> {
  const ref = doc(db, 'specs', specId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}
