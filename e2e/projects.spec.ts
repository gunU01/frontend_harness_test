// VERIFICATION.md "프로젝트/사이드바 내비게이션" 절의 자동화 버전 (PLANNING.md 7단계).
// 홈(/)의 빈 프로젝트 갤러리 → 인라인 폼으로 프로젝트 생성 → 그 프로젝트 안에서 문서 생성 →
// 프로젝트 상세/사이드바/전체 문서("/specs") 세 군데 모두에 반영되는지를 한 번에 확인한다.
import { expect, signInAsFreshUser, test } from './fixtures'

test('프로젝트를 만들고 그 안에서 문서를 만들면 프로젝트/사이드바/전체 문서에 모두 반영된다', async ({
  page,
}) => {
  await signInAsFreshUser(page)

  // 로그인 직후에는 /specs로 리다이렉트되므로, 홈으로 직접 이동해 프로젝트 갤러리를 확인한다.
  await page.goto('')
  await expect(page.getByText('아직 프로젝트가 없습니다.')).toBeVisible()

  const projectName = `E2E 프로젝트 ${Date.now()}`
  await page.getByRole('button', { name: '+ 새 프로젝트' }).click()
  await page.getByLabel('프로젝트 이름').fill(projectName)
  await page.getByRole('button', { name: '만들기' }).click()

  await page.waitForURL(/\/projects\/[^/]+$/)
  await expect(page.getByLabel('프로젝트 이름')).toHaveValue(projectName)

  const docTitle = `프로젝트 문서 ${Date.now()}`
  await page.getByRole('link', { name: '새 문서 만들기' }).click()
  await page.waitForURL(/\/projects\/[^/]+\/specs\/new$/)
  await page.getByRole('button', { name: 'PRD' }).click()
  await page.getByLabel('제목').fill(docTitle)
  await page.getByLabel('한 줄 문제 정의').fill('프로젝트 문서 생성 확인용')
  await page.getByRole('button', { name: '만들기' }).click()
  await page.waitForURL(/\/specs\/[^/]+$/)

  // "← 프로젝트로 돌아가기"로 프로젝트 상세에 돌아가면 그 프로젝트의 문서 카드 목록에 보인다.
  // (사이드바의 프로젝트 문서 목록은 /projects/:projectId 계열 라우트에서만 뜨므로,
  // 지금 막 이동해온 /specs/:id에서는 아직 확인할 수 없다.)
  await page.getByRole('link', { name: '← 프로젝트로 돌아가기' }).click()
  await page.waitForURL(/\/projects\/[^/]+$/)
  await expect(page.getByRole('main').getByText(docTitle)).toBeVisible()

  // 프로젝트 상세는 곧 /projects/:projectId라 사이드바의 "프로젝트 문서 목록"에도 같은 문서가 보인다.
  await expect(page.getByRole('complementary').getByRole('link', { name: docTitle })).toBeVisible()

  // "전체 문서"(/specs)에도 프로젝트 이름 라벨과 함께 보여야 한다.
  await page.getByRole('link', { name: '전체 문서' }).click()
  await expect(page).toHaveURL(/\/specs$/)
  await expect(page.getByRole('main').getByText(docTitle)).toBeVisible()
  // "전체 문서" 카드의 메타 라벨(문서 타입 · 프로젝트 이름)에 프로젝트 이름이 부분 문자열로 들어있다.
  await expect(page.getByRole('main').getByText(projectName)).toBeVisible()
})
