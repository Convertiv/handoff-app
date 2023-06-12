import build from 'next/dist/build/index.js';
import Handoff from './handoff';
import path from 'path';
import { webpack } from 'next/dist/compiled/webpack/webpack';

const buildApp = async (handoff: Handoff) => {
  console.log(path.resolve('dist'));
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    trailingSlash: true,
    experimental: {
      externalDir: true,
    },
    resolve: {
      modules: [
        path.resolve('dist/app'),
        path.resolve('node_modules'),
      ],
    },
    module: {
      rules: [
        {
          test: /\.svg$/i,
          type: 'asset',
        },
        {
          test: /\.html$/i,
          loader: 'html-loader',
        },
      ],
    },
    webpack: (config: webpack.Configuration) => {
      config.resolve.fallback = { fs: false };
      return config;
    },
  };
  // @ts-ignore
  return await build['default'](path.resolve('src/app'), nextConfig);
};

export default buildApp;
