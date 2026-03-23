import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/__tests__/**/*.spec.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
})