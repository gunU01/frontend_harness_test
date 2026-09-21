// VERIFICATION.md P0 "로그인" 시나리오의 자동화 버전.
// 실제 Google 계정 대신 Auth 에뮬레이터에 이메일/비번으로 만든 테스트 계정을 쓴다
// (자세한 이유는 ./fixtures.ts 상단 주석 참고).
import { expect, test } from './fixtures'

test('로그인하면 /specs로 리다이렉트된다', async ({ page }) => {
  await test.step('신규 테스트 계정으로 로그인', async () => {
    await page.goto('signin?e2eEmail=login-check@e2e.test&e2eName=로그인테스트')
    await page.waitForURL(/\/specs$/)
  })

  await expect(page).toHaveURL(/\/specs$/)
  await expect(page.getByRole('heading', { name: '스펙 목록' })).toBeVisible()
  // PrivateRoute 안쪽이라 사이드바가 보여야 한다 (AppHeader를 대체한 Sidebar.tsx).
  await expect(page.getByRole('link', { name: '전체 문서' })).toBeVisible()
})

test('로그인 화면(/signin)에는 사이드바가 없다', async ({ page }) => {
  await page.goto('signin')
  await expect(page.getByRole('complementary')).toHaveCount(0)
})
