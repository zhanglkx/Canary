import type { NextConfig } from 'next';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

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

  // 使用 webpack 配置支持 Less 和 CSS Modules
  webpack: (config, { isServer }) => {
    // 添加 Less 支持
    const lessRule = {
      test: /\.less$/,
      use: isServer
        ? [
            // 服务端渲染时只需要生成类名映射
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: '[name]__[local]--[hash:base64:5]',
                  exportOnlyLocals: true, // 关键：服务端只导出类名
                },
                importLoaders: 1,
                esModule: false, // 使用CommonJS导出
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
          ]
        : [
            // 客户端需要提取CSS
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: '[name]__[local]--[hash:base64:5]',
                },
                importLoaders: 1,
                esModule: false, // 使用CommonJS导出
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
    };

    config.module.rules.push(lessRule);

    // 添加插件
    if (!isServer) {
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash].css',
          chunkFilename: 'static/css/[name].[contenthash].css',
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
