import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/teleparty-chat/',
  plugins: [
    react({
      babel: {
        presets: [],
      }
    })
  ],
  esbuild: {
    charset: 'utf8',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  }
})
