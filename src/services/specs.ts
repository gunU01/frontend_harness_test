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
import type { TemplateSection } from '../lib/defaultTemplate'

export type SpecStatus = 'draft' | 'review' | 'done'

export interface SpecSection {
  key: string
  title: string
  content: string
}

export interface Spec {
  id: string
  uid: string
  title: string
  oneLiner: string
  status: SpecStatus
  sections: SpecSection[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export async function createSpec(
  uid: string,
  title: string,
  oneLiner: string,
  template: TemplateSection[],
): Promise<string> {
  const sections: SpecSection[] = template.map((section) => ({
    key: section.key,
    title: section.title,
    content: '',
  }))

  const ref = await addDoc(collection(db, 'specs'), {
    uid,
    title,
    oneLiner,
    status: 'draft' as SpecStatus,
    sections,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return ref.id
}

export async function listSpecs(uid: string): Promise<Spec[]> {
  const q = query(collection(db, 'specs'), where('uid', '==', uid), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Spec)
}

export async function getSpec(specId: string): Promise<Spec | null> {
  const ref = doc(db, 'specs', specId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Spec
}

export async function updateSpec(specId: string, data: Partial<Spec>): Promise<void> {
  const ref = doc(db, 'specs', specId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}
