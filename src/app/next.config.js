const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,
  experimental: {
    externalDir: true,
  },
  distDir: 'out',
  serverRuntimeConfig: {
    PROJECT_ROOT: path.resolve('public'),
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    config.resolve.modules.push(path.resolve('dist/app'));
    config.resolve.modules.push(path.resolve('node_modules'));
    config.resolveLoader.modules.push(path.resolve('node_modules'));
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset',
    });
    config.module.rules.push({
      test: /\.html$/i,
      loader: 'html-loader',
    });
    return config;
  },
};
if (__dirname.includes('node_modules')) {
  const withTM = require('next-transpile-modules')(['handoff-app']);
  module.exports = withTM(nextConfig);
} else {
  module.exports = nextConfig;
}
