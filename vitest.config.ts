import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov'],
      lines: 0.7,
      statements: 0.7,
      branches: 0.6,
      functions: 0.7,
    }
  }
})
