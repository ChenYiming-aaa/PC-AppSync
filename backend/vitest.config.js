import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000,
    pool: 'forks',
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
