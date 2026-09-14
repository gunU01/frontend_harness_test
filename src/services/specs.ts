import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
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
    risks: (data.risks as SpecRisk[]) ?? [],
    stakeholders: (data.stakeholders as SpecStakeholder[]) ?? [],
  } as Spec
}

export async function listSpecs(uid: string): Promise<Spec[]> {
  const q = query(collection(db, 'specs'), where('uid', '==', uid), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => fillSpecDefaults(d.id, d.data()))
}

export async function listPublishedSpecs(): Promise<Spec[]> {
  const q = query(collection(db, 'specs'), where('published', '==', true), orderBy('updatedAt', 'desc'))
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
