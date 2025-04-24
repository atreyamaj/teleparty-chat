import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages deployment configuration
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const base = isGitHubPages ? '/teleparty-chat/' : './'

export default defineConfig({
  base, // Use appropriate base path for GitHub Pages or local development
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
