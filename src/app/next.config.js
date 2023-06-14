const path = require('path');
console.log('reading config');
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
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    config.resolve.modules.push(path.resolve('dist/app'));
    config.resolve.modules.push(path.resolve('node_modules'));
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
module.exports = nextConfig;
