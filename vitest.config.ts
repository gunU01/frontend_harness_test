import { defineConfig } from 'vitest/config'

// 순수 함수 단위 테스트 전용 — DOM이 필요한 테스트가 생기기 전까지는
// 기본 node 환경을 그대로 쓴다 (jsdom 등 추가 의존성 없음).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
