import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    globalSetup: ['src/test/global-setup.ts'],
    testTimeout: 15_000,
    hookTimeout: 120_000,
    env: {
      BETTER_AUTH_URL: 'http://localhost:3000',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-123',
    },
  },
})
