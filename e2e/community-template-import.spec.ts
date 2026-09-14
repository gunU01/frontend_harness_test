// VERIFICATION.md P1-d: "템플릿 마켓플레이스 연결" — 공개된 스펙의 상세 페이지에서
// "이 템플릿으로 새 스펙 만들기"를 누르면 /specs/new의 제목/한줄정의 입력 단계로 바로
// 진입하는지 확인한다 (로그인 상태 기준. 로그아웃 시 /signin으로 가는 분기는 CommunityDetail
// 코드에 있지만, 그 경로는 이번 자동화 범위에 포함하지 않았다).
import { expect, signInAsFreshUser, test } from './fixtures'
import { createSpecViaUI } from './helpers'

test('공개된 스펙에서 템플릿으로 새 스펙 만들기를 누르면 입력 단계로 바로 진입한다', async ({ page }) => {
  await signInAsFreshUser(page)
  const specId = await createSpecViaUI(page, {
    templateName: '기능 명세서',
    title: '템플릿 공유용 스펙',
    oneLiner: '',
  })
  await page.getByLabel('커뮤니티에 공개하기').check()
  await expect(page.getByText('누구나 이 링크로 볼 수 있습니다')).toBeVisible()
  await page.waitForTimeout(500)

  await page.goto(`community/${specId}`)
  await page.getByRole('button', { name: '이 템플릿으로 새 스펙 만들기' }).click()

  await expect(page).toHaveURL(/\/specs\/new$/)
  // 템플릿 갤러리를 건너뛰고 바로 제목/한줄정의 입력 단계로 진입해야 한다.
  await expect(page.getByLabel('제목')).toBeVisible()
  await expect(page.getByRole('button', { name: 'PRD' })).toHaveCount(0)

  // 새로 만들면 원본 스펙(기능 명세서)의 섹션 구성을 그대로 물려받는지도 확인한다.
  await page.getByLabel('제목').fill('가져온 템플릿으로 만든 스펙')
  await page.getByRole('button', { name: '만들기' }).click()
  await page.waitForURL(/\/specs\/[^/]+$/)
  await expect(page.getByRole('button', { name: '유저 플로우' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'QA 체크리스트' })).toBeVisible()
})
