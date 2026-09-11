import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { DocTemplate } from '../lib/defaultTemplates'
import { defaultTemplates } from '../lib/defaultTemplates'

export interface UserConfig {
  templates: DocTemplate[]
  productContext: string
  glossary: string
}

export async function getOrCreateConfig(uid: string): Promise<UserConfig> {
  const ref = doc(db, 'config', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const data = snap.data() as UserConfig
    return data.templates ? data : { ...data, templates: defaultTemplates }
  }

  const initial: UserConfig = {
    templates: defaultTemplates,
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
