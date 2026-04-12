import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './playwright',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
