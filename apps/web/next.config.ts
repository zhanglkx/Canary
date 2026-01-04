import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shared'],

  // 静态导出配置（可选 - 用于生成 dist 目录）
  // output: 'export',
  // distDir: 'dist',
  // trailingSlash: true,
  // images: {
  //   unoptimized: true,
  // },

  experimental: {
    // 优化水合过程
    optimizePackageImports: ['axios'],
  },

  // 使用 webpack 配置支持 Less CSS Modules
  webpack: (config) => {
    // 只添加 Less CSS Modules 支持，全局样式使用 CSS
    config.module.rules.push({
      test: /\.module\.less$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: {
              localIdentName: '[name]__[local]--[hash:base64:5]',
            },
          },
        },
        {
          loader: 'less-loader',
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
