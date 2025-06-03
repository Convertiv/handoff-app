import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: { config: join(__dirname, 'tailwind.config.js') },
    autoprefixer: {},
  },
};

export default config;
