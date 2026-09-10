import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/frontend_harness_test/',
  plugins: [react()],
})
