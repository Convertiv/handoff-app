import nextConfig from 'eslint-config-next';
import prettierConfig from 'eslint-config-prettier/flat';

export default [
  ...nextConfig,
  prettierConfig,
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'next-env.d.ts',
      'src/app/out/**',
      '**/*.js',
    ],
  },
];
