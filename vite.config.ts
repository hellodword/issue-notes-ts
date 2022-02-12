/// <reference types="vitest" />

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    watch: false,
    environment: 'node',
    deps: {
      external: [/src\/external\.mjs/],
    },
    include: ['__tests__/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['__tests__/somefilename.test.ts'],
    coverage: {
      include: ['src'],
    },
  },
});
