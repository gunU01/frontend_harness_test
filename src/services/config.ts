import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { TemplateSection } from '../lib/defaultTemplate'
import { defaultTemplate } from '../lib/defaultTemplate'

export interface UserConfig {
  template: TemplateSection[]
  productContext: string
  glossary: string
}

export async function getOrCreateConfig(uid: string): Promise<UserConfig> {
  const ref = doc(db, 'config', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    return snap.data() as UserConfig
  }

  const initial: UserConfig = {
    template: defaultTemplate,
    productContext: '',
    glossary: '',
  }
  await setDoc(ref, initial)
  return initial
}

export async function updateConfig(uid: string, data: Partial<UserConfig>): Promise<void> {
  const ref = doc(db, 'config', uid)
  await setDoc(ref, data, { merge: true })
}
