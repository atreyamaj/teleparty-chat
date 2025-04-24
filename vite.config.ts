import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // Ensures assets are loaded correctly on GitHub Pages
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
