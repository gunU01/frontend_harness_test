// VERIFICATION.md P1: "문서 타입 추가", "섹션 순서변경" 자동화.
import { expect, signInAsFreshUser, test } from './fixtures'
import { waitForDebouncedSave } from './helpers'

test('새 문서 타입을 추가하고 이름/섹션을 바꾸면 새로고침 후에도 남아있다', async ({ page }) => {
  await signInAsFreshUser(page)
  await page.goto('settings')
  await expect(page.getByRole('heading', { name: '설정' })).toBeVisible()

  await page.getByRole('button', { name: '+ 새 문서 타입' }).click()

  const nameInput = page.getByLabel('문서 타입 이름')
  await expect(nameInput).toHaveValue('새 문서 타입')
  await nameInput.fill('E2E 문서 타입')

  await page.getByRole('button', { name: '섹션 추가' }).click()

  // 새로 추가된(두 번째) 섹션의 제목을 바꾼다.
  const secondSectionTitle = page.locator('div.rounded-lg.border input').nth(1)
  await secondSectionTitle.fill('E2E 섹션')

  await expect(page.getByText('저장됨')).toBeVisible({ timeout: 5000 })

  await page.reload()
  await expect(page.getByRole('button', { name: 'E2E 문서 타입' })).toBeVisible()
  await page.getByRole('button', { name: 'E2E 문서 타입' }).click()
  await expect(page.getByLabel('문서 타입 이름')).toHaveValue('E2E 문서 타입')
  await expect(page.locator('div.rounded-lg.border input').nth(1)).toHaveValue('E2E 섹션')
})

test('섹션 순서를 바꾸고 하나를 삭제하면 그 상태로 저장된다', async ({ page }) => {
  await signInAsFreshUser(page)
  await page.goto('settings')
  // 기본 템플릿 중 PRD(7개 섹션)를 고른다.
  await page.getByRole('button', { name: 'PRD' }).click()

  const sectionRows = page.locator('div.rounded-lg.border')
  await expect(sectionRows).toHaveCount(7)

  const firstTitleInput = sectionRows.nth(0).locator('input')
  const secondTitleInput = sectionRows.nth(1).locator('input')
  const firstTitleBefore = await firstTitleInput.inputValue()
  const secondTitleBefore = await secondTitleInput.inputValue()

  // 두 번째 섹션을 위로 이동 → 첫 번째와 자리가 바뀐다.
  await sectionRows.nth(1).getByRole('button', { name: '위로 이동' }).click()
  await expect(sectionRows.nth(0).locator('input')).toHaveValue(secondTitleBefore)
  await expect(sectionRows.nth(1).locator('input')).toHaveValue(firstTitleBefore)

  // 마지막 섹션을 삭제한다.
  const countBeforeDelete = await sectionRows.count()
  await sectionRows.nth(countBeforeDelete - 1).getByRole('button', { name: '삭제' }).click()
  await expect(sectionRows).toHaveCount(countBeforeDelete - 1)

  await waitForDebouncedSave(page)
  await page.reload()

  await page.getByRole('button', { name: 'PRD' }).click()
  const reloadedRows = page.locator('div.rounded-lg.border')
  await expect(reloadedRows).toHaveCount(countBeforeDelete - 1)
  await expect(reloadedRows.nth(0).locator('input')).toHaveValue(secondTitleBefore)
  await expect(reloadedRows.nth(1).locator('input')).toHaveValue(firstTitleBefore)
})
