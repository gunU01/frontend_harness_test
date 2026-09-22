// VERIFICATION.md P1-c: 발행 토글/발행 취소, 그리고 로그아웃 상태에서의 커뮤니티 노출.
// "발행 토글이 Firestore 규칙을 지키는지"는 이미 firestore.rules.test.js가 다루므로,
// 여기서는 실제 화면 흐름(체크 → 새 컨텍스트에서 보임 → 체크 해제 → 안 보임)만 확인한다.
import { expect, signInAsFreshUser, test } from './fixtures'
import { createSpecViaUI } from './helpers'

test('발행하면 로그아웃 상태에서도 보이고, 발행을 취소하면 사라진다', async ({ page, browser }) => {
  await signInAsFreshUser(page, '커뮤니티 작성자')
  const uniqueTitle = `커뮤니티 공개 테스트 ${Date.now()}`
  const specId = await createSpecViaUI(page, {
    templateName: 'PRD',
    title: uniqueTitle,
    oneLiner: '공개 확인용 한 줄 정의',
  })

  await page.getByLabel('커뮤니티에 공개하기').check()
  await expect(page.getByText('누구나 이 링크로 볼 수 있습니다')).toBeVisible()
  // published 토글은 디바운스 없이 바로 저장을 호출하지만 await하지는 않으므로,
  // 게스트 컨텍스트에서 읽기 전에 Firestore 쓰기가 실제로 끝날 시간을 준다.
  await page.waitForTimeout(500)

  // 완전히 새로운(로그인 정보 없는) 컨텍스트에서 커뮤니티를 둘러본다.
  const guestContext = await browser.newContext()
  const guestPage = await guestContext.newPage()
  try {
    await guestPage.goto(`http://127.0.0.1:5183/frontend_harness_test/community`)
    await expect(guestPage.getByRole('heading', { name: '커뮤니티' })).toBeVisible()
    await expect(guestPage.getByText(uniqueTitle)).toBeVisible()

    await guestPage.goto(`http://127.0.0.1:5183/frontend_harness_test/community/${specId}`)
    await expect(guestPage.getByRole('heading', { name: uniqueTitle })).toBeVisible()
    await expect(guestPage.getByText('공개 확인용 한 줄 정의')).toBeVisible()

    // 발행을 취소한다.
    await page.getByLabel('커뮤니티에 공개하기').uncheck()
    await expect(page.getByText('누구나 이 링크로 볼 수 있습니다')).toHaveCount(0)
    await page.waitForTimeout(500)

    await guestPage.reload()
    await expect(guestPage.getByText('찾을 수 없거나 비공개 문서입니다.')).toBeVisible()

    await guestPage.goto(`http://127.0.0.1:5183/frontend_harness_test/community`)
    await expect(guestPage.getByText(uniqueTitle)).toHaveCount(0)
  } finally {
    await guestContext.close()
  }
})
