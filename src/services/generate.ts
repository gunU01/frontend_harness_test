import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase'

const functions = getFunctions(app, 'asia-northeast3')
const generateFn = httpsCallable(functions, 'generate')

export interface GenerateResult {
  mode: 'draft' | 'section' | 'critique'
  text: string
}

function isGenerateResult(data: unknown): data is GenerateResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).mode === 'string' &&
    typeof (data as Record<string, unknown>).text === 'string'
  )
}

function parseGenerateResult(data: unknown): GenerateResult {
  if (!isGenerateResult(data)) {
    throw new Error('Functions 응답 형식이 올바르지 않습니다.')
  }
  return data
}

export async function generateDraft(specId: string): Promise<GenerateResult> {
  const result = await generateFn({ mode: 'draft', specId })
  return parseGenerateResult(result.data)
}

export async function regenerateSection(specId: string, sectionKey: string): Promise<GenerateResult> {
  const result = await generateFn({ mode: 'section', specId, sectionKey })
  return parseGenerateResult(result.data)
}

export async function critique(specId: string): Promise<GenerateResult> {
  const result = await generateFn({ mode: 'critique', specId })
  return parseGenerateResult(result.data)
}
