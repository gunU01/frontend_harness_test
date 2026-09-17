// VERIFICATION.md P1 ★ "스냅샷 격리" 회귀 시나리오 — 가장 중요하다고 표시된 항목.
// PRD로 스펙을 만든 뒤 설정에서 PRD 템플릿의 섹션 제목을 바꿔도, 이미 만든 스펙은
// 바뀌지 않아야 한다 (createSpec이 템플릿을 참조가 아니라 스냅샷으로 복사하는지 검증).
import { expect, signInAsFreshUser, test } from './fixtures'
import { createSpecViaUI } from './helpers'

test('템플릿 섹션 제목을 바꿔도 이미 만든 스펙은 영향받지 않는다', async ({ page }) => {
  await signInAsFreshUser(page)

  const specId = await createSpecViaUI(page, {
    templateName: 'PRD',
    title: '스냅샷 테스트 스펙',
    oneLiner: '',
  })
  await expect(page.getByRole('button', { name: '문제' })).toBeVisible()

  // 설정에서 PRD 템플릿의 첫 섹션 제목을 바꾼다.
  await page.goto('settings')
  await page.getByRole('button', { name: 'PRD' }).click()
  const firstSectionTitleInput = page.locator('div.rounded-lg.border input').first()
  await expect(firstSectionTitleInput).toHaveValue('문제')
  await firstSectionTitleInput.fill('완전히 바뀐 섹션 제목')
  await expect(page.getByText('저장됨')).toBeVisible({ timeout: 5000 })

  // 스펙 A를 다시 연다: 섹션 제목이 그대로 "문제"여야 한다 (참조가 아니라 스냅샷).
  await page.goto(`specs/${specId}`)
  await expect(page.getByRole('button', { name: '문제' })).toBeVisible()
  await expect(page.getByRole('button', { name: '완전히 바뀐 섹션 제목' })).toHaveCount(0)
})
