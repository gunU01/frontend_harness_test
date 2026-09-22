import type { Page } from '@playwright/test'

/** 디바운스 저장 타이머(2초)가 지나가는 걸 기다린다 (Settings.tsx/SpecEditor.tsx 컨벤션 참고). */
export async function waitForDebouncedSave(page: Page) {
  await page.waitForTimeout(2500)
}

/**
 * /specs/new에서 템플릿 카드를 고르고 제목/한줄정의를 입력해 스펙을 만든다.
 * 만들기 이후 /specs/:id로 이동할 때까지 기다리고 그 id를 반환한다.
 */
export async function createSpecViaUI(
  page: Page,
  options: { templateName: string | RegExp; title: string; oneLiner: string },
): Promise<string> {
  await page.goto('specs/new')
  await page.getByRole('button', { name: options.templateName }).click()
  await page.getByLabel('제목').fill(options.title)
  await page.getByLabel('한 줄 문제 정의').fill(options.oneLiner)
  await page.getByRole('button', { name: '만들기' }).click()
  // '/specs/new' 자체도 정규식 `/specs/[^/]+$`에 걸리기 때문에(리터럴 "new"가 [^/]+와
  // 매치됨), 클릭 직후 아직 페이지 이동이 일어나기 전이라면 waitForURL이 잘못된 시점에
  // 곧바로 통과해버릴 수 있다 — "/specs/new"는 명시적으로 제외한다.
  await page.waitForURL((url) => /\/specs\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/specs/new'))
  const match = /\/specs\/([^/?#]+)$/.exec(page.url())
  if (!match) throw new Error(`스펙 id를 URL에서 찾지 못함: ${page.url()}`)
  return match[1]
}
