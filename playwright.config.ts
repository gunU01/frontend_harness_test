import { defineConfig } from '@playwright/test'

// Playwright는 이 레포에 아직 devDependency로 없던 걸 이번에 추가했고, 이 하네스 세션에는
// 브라우저를 새로 내려받을 네트워크 권한이 없어 PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers에
// 미리 설치된 chromium-1194(패키지에 맞춘 @playwright/test@1.56.0)를 executablePath로 직접
// 가리킨다. `--no-proxy-server`/`--ignore-certificate-errors`는 이 샌드박스의 아웃바운드
// 프록시가 로컬 포트(vite/에뮬레이터)까지 터널링하려다 실패하는 문제를 피하기 위함 —
// 실제 앱 코드가 의존하는 외부 리소스(Google 폰트 CDN 등)는 어차피 이 테스트 범위에 없다.
const PORT = 5183
const BASE_URL = `http://127.0.0.1:${PORT}/frontend_harness_test/`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 같은 Auth/Firestore 에뮬레이터를 공유하므로 워커 1개로 순차 실행
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 800 }, // SpecEditor의 데스크톱/모바일 분기(768px) 기준 확보
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium',
      args: ['--no-proxy-server', '--ignore-certificate-errors'],
    },
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      VITE_USE_FIREBASE_EMULATOR: 'true',
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-settle-up-e2e-test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-settle-up-e2e-test',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-settle-up-e2e-test.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
      VITE_FIREBASE_APP_ID: '1:1:web:demo',
    },
  },
})
