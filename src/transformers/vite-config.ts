// vite.config.ts
import { defineConfig } from 'vite';
import { createViteLogger } from './utils/vite-logger';

export default defineConfig({
  customLogger: createViteLogger(),
  publicDir: false,
  build: {
    lib: {
      entry: '',
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [],
    },
    emptyOutDir: false,
    minify: 'esbuild',
  },
});
