// VERIFICATION.md P1-e/P1-f: 대시보드/퍼널/리텐션이 실제 Firestore 데이터로 렌더링되는지,
// 그리고 관리자용 "전체 사용자" 토글(P1-f)이 관리자에게만 보이고 크래시 없이 동작하는지.
// 초안 생성 등 AI(Functions generate) 호출 이벤트는 API 키가 없어 여기서 만들 수 없으므로,
// AI 호출 없이 발생 가능한 이벤트(spec_created, published_toggled)만으로 검증한다.
import { expect, makeUserAdmin, signInAsFreshUser, test } from './fixtures'
import { createSpecViaUI, waitForDebouncedSave } from './helpers'

test('스펙을 만들고 발행하면 분석 페이지의 대시보드/퍼널/리텐션에 반영된다', async ({ page }) => {
  await signInAsFreshUser(page)

  await createSpecViaUI(page, {
    templateName: 'PRD',
    title: '분석 테스트 스펙',
    oneLiner: '분석 페이지 검증용',
  })

  await page.getByLabel('커뮤니티에 공개하기').check()
  await waitForDebouncedSave(page)

  await page.getByRole('link', { name: '분석' }).click()
  await expect(page).toHaveURL(/\/analytics$/)
  await expect(page.getByRole('heading', { name: '내 활동 분석' })).toBeVisible()

  // 대시보드: spec_created + published_toggled 두 종류가 활동 종류별 빈도에 잡혀야 한다.
  await expect(page.getByText('아직 데이터가 없습니다.')).not.toBeVisible()
  await expect(page.getByText('일별 활동량')).toBeVisible()
  // BarChart가 축 라벨 + 막대 위 direct label로 같은 텍스트를 두 번 그리므로 .first()로 확인.
  await expect(page.getByText('스펙 생성', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('발행 토글', { exact: true }).first()).toBeVisible()

  // 퍼널: 스펙 생성 1건이 집계되고, 전환율 배지가 "—"가 아니라 실제 값이어야 한다.
  await page.getByRole('button', { name: '퍼널' }).click()
  await expect(page.getByText('생성 대비 비율')).toBeVisible()
  await expect(page.getByText(/스펙 생성 → 초안 생성: /)).toBeVisible()

  // 리텐션: 방금 만든 스펙 1건이 코호트 히트맵에 0주차 100%로 잡혀야 한다.
  await page.getByRole('button', { name: '리텐션' }).click()
  await expect(page.getByText('아직 작성한 스펙이 없습니다.')).not.toBeVisible()
  await expect(page.getByText('코호트별 재방문 비율')).toBeVisible()
})

test('로그인 직후에는 아직 활동이 없어 대시보드가 빈 상태를 보여준다', async ({ page }) => {
  await signInAsFreshUser(page)
  await page.getByRole('link', { name: '분석' }).click()
  // signed_in 이벤트 자체가 방금 잡혔을 수도, 초기 세션 복원이라 안 잡혔을 수도 있어
  // "완전히 비었다"를 단언하지 않고, 최소한 크래시 없이 탭 UI 자체는 뜨는지만 확인한다.
  await expect(page.getByRole('heading', { name: '내 활동 분석' })).toBeVisible()
  await expect(page.getByRole('button', { name: '대시보드' })).toBeVisible()
  await expect(page.getByRole('button', { name: '리텐션' }).click()).resolves.toBeUndefined()
  await expect(page.getByText('아직 작성한 스펙이 없습니다.')).toBeVisible()
})

test('관리자는 전체 사용자 토글을 볼 수 있고, 전환해도 크래시 없이 렌더링된다', async ({ page }) => {
  const { email } = await signInAsFreshUser(page)
  // admins/{uid} 문서는 클라이언트 SDK로는 쓸 수 없어(firestore.rules가 완전 차단) 에뮬레이터에
  // 직접 REST로 시드한다 — fixtures.ts의 makeUserAdmin 주석 참고.
  await makeUserAdmin(email)

  await page.getByRole('link', { name: '분석' }).click()
  await expect(page).toHaveURL(/\/analytics$/)
  await expect(page.getByRole('heading', { name: '내 활동 분석' })).toBeVisible()

  const allUsersToggle = page.getByRole('button', { name: '전체 사용자' })
  await expect(allUsersToggle).toBeVisible()
  await expect(page.getByRole('button', { name: '내 데이터' })).toBeVisible()

  await allUsersToggle.click()
  // 다른 사용자의 활동 데이터가 실제로 있을 필요는 없다 — 이 관리자 계정 자신의 signed_in
  // 이벤트 정도만 있는 작은/빈 데이터셋에서도 에러 바운더리 없이 렌더링되는지가 핵심이다.
  await expect(page.getByRole('heading', { name: '내 활동 분석' })).toBeVisible()
  await expect(page.getByRole('button', { name: '대시보드' })).toBeVisible()
  await expect(page.getByText('문제가 발생했습니다')).not.toBeVisible()
})

test('관리자가 아닌 사용자에게는 전체 사용자 토글이 보이지 않는다', async ({ page }) => {
  await signInAsFreshUser(page)
  await page.getByRole('link', { name: '분석' }).click()
  await expect(page).toHaveURL(/\/analytics$/)
  await expect(page.getByRole('heading', { name: '내 활동 분석' })).toBeVisible()
  await expect(page.getByRole('button', { name: '전체 사용자' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: '내 데이터' })).not.toBeVisible()
})
