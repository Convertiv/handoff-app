/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,
};

module.exports = {
  module: {
    rules: [
      {
        test: /\.svg$/i,
        type: 'asset',
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
};

module.exports = nextConfig;
