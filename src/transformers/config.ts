// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
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
