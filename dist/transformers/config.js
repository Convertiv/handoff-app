"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// vite.config.ts
const vite_1 = require("vite");
exports.default = (0, vite_1.defineConfig)({
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
