/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  /** Playwright E2E 전용: 'true'면 Auth/Firestore가 로컬 에뮬레이터를 가리킴 (test:e2e 참고) */
  readonly VITE_USE_FIREBASE_EMULATOR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
