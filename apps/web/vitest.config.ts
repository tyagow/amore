import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'server/**/*.test.ts',
      '../../packages/ai/src/**/*.test.ts',
    ],
  },
})
