// VERIFICATION.md P1-d: 가정/리스크 트래커, 이해관계자 확인 체크리스트.
// 추가 → 체크박스 토글 → 삭제 → 새로고침 후 상태 유지를 검증한다.
import { expect, signInAsFreshUser, test } from './fixtures'
import { createSpecViaUI, waitForDebouncedSave } from './helpers'

test('리스크를 추가하고 체크하면 저장되고, 삭제하면 사라진다', async ({ page }) => {
  await signInAsFreshUser(page)
  await createSpecViaUI(page, { templateName: 'PRD', title: '리스크 테스트', oneLiner: '' })

  await page.getByPlaceholder('새 가정/리스크 입력').fill('이 가정이 틀리면 위험하다')
  await page.getByRole('button', { name: '추가' }).first().click()

  const riskRow = page.locator('li', { hasText: '이 가정이 틀리면 위험하다' })
  await expect(riskRow).toBeVisible()

  await riskRow.locator('input[type="checkbox"]').check()
  await waitForDebouncedSave(page)

  await page.reload()
  const reloadedRow = page.locator('li', { hasText: '이 가정이 틀리면 위험하다' })
  await expect(reloadedRow).toBeVisible()
  await expect(reloadedRow.locator('input[type="checkbox"]')).toBeChecked()

  await page
    .locator('li', { hasText: '이 가정이 틀리면 위험하다' })
    .getByRole('button', { name: '리스크 삭제' })
    .click()
  await expect(page.getByText('이 가정이 틀리면 위험하다')).toHaveCount(0)

  await waitForDebouncedSave(page)
  await page.reload()
  await expect(page.getByText('이 가정이 틀리면 위험하다')).toHaveCount(0)
})

test('이해관계자를 추가하고 확인 체크 후 삭제하면 저장된다', async ({ page }) => {
  await signInAsFreshUser(page)
  await createSpecViaUI(page, { templateName: 'PRD', title: '이해관계자 테스트', oneLiner: '' })

  await page.getByPlaceholder('새 이해관계자 이름').fill('김결정권자')
  await page.getByRole('button', { name: '추가' }).nth(1).click()

  await expect(page.getByText('김결정권자')).toBeVisible()
  const checkbox = page.locator('li', { hasText: '김결정권자' }).locator('input[type="checkbox"]')
  await checkbox.check()
  await waitForDebouncedSave(page)

  await page.reload()
  await expect(page.locator('li', { hasText: '김결정권자' }).locator('input[type="checkbox"]')).toBeChecked()

  await page.locator('li', { hasText: '김결정권자' }).getByRole('button', { name: '이해관계자 삭제' }).click()
  await waitForDebouncedSave(page)
  await page.reload()
  await expect(page.getByText('김결정권자')).toHaveCount(0)
})
