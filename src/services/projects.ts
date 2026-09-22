import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

export interface Project {
  id: string
  uid: string
  name: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export async function createProject(uid: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, 'projects'), {
    uid,
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return ref.id
}

export async function listProjects(uid: string): Promise<Project[]> {
  const q = query(collection(db, 'projects'), where('uid', '==', uid), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project)
}

export async function getProject(projectId: string): Promise<Project | null> {
  const ref = doc(db, 'projects', projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Project
}

export async function updateProject(projectId: string, data: Partial<Pick<Project, 'name'>>): Promise<void> {
  const ref = doc(db, 'projects', projectId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}
