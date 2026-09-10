import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase'

const functions = getFunctions(app, 'asia-northeast3')
const generateFn = httpsCallable(functions, 'generate')

export interface GenerateResult {
  mode: 'draft' | 'section' | 'critique'
  text: string
}

export async function generateDraft(specId: string): Promise<GenerateResult> {
  const result = await generateFn({ mode: 'draft', specId })
  return result.data as GenerateResult
}

export async function regenerateSection(specId: string, sectionKey: string): Promise<GenerateResult> {
  const result = await generateFn({ mode: 'section', specId, sectionKey })
  return result.data as GenerateResult
}

export async function critique(specId: string): Promise<GenerateResult> {
  const result = await generateFn({ mode: 'critique', specId })
  return result.data as GenerateResult
}
