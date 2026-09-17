// VERIFICATION.md P0/P1: "스펙 생성 → 저장", "스펙 생성 시 타입 선택" 중
// AI(generate 함수) 호출 없이 자동화 가능한 부분만 다룬다. 초안 생성/섹션 다시쓰기/
// 빈틈 지적은 Anthropic API 키가 필요해 이 세션에서는 수동 확인 항목으로 남겨둔다.
import { expect, signInAsFreshUser, test } from './fixtures'
import { createSpecViaUI, waitForDebouncedSave } from './helpers'

test('템플릿 선택 → 스펙 생성 → 제목/한줄정의 저장이 새로고침 후에도 유지된다', async ({ page }) => {
  await signInAsFreshUser(page)

  const specId = await createSpecViaUI(page, {
    templateName: 'PRD',
    title: 'E2E 테스트 스펙',
    oneLiner: '초기 한 줄 정의',
  })

  await expect(page).toHaveURL(new RegExp(`/specs/${specId}$`))
  // PRD 템플릿의 7개 섹션이 왼쪽 목록에 그대로 보여야 한다.
  await expect(page.getByRole('button', { name: '문제' })).toBeVisible()
  await expect(page.getByRole('button', { name: '출시 계획' })).toBeVisible()

  const titleInput = page.locator('input').first()
  const oneLinerInput = page.getByPlaceholder('한 줄 문제 정의')
  await expect(titleInput).toHaveValue('E2E 테스트 스펙')

  await titleInput.fill('E2E 테스트 스펙 (수정됨)')
  await oneLinerInput.fill('수정된 한 줄 정의')
  await waitForDebouncedSave(page)

  await page.reload()
  await expect(page.locator('input').first()).toHaveValue('E2E 테스트 스펙 (수정됨)')
  await expect(page.getByPlaceholder('한 줄 문제 정의')).toHaveValue('수정된 한 줄 정의')
})

test('다른 타입 선택 버튼을 누르면 라우트 이동 없이 타입 갤러리로 돌아간다', async ({ page }) => {
  await signInAsFreshUser(page)
  await page.goto('specs/new')
  await page.getByRole('button', { name: '회의록' }).click()
  await expect(page.getByLabel('제목')).toBeVisible()

  await page.getByRole('button', { name: '다른 타입 선택' }).click()
  await expect(page).toHaveURL(/\/specs\/new$/)
  await expect(page.getByRole('button', { name: 'PRD' })).toBeVisible()
})
