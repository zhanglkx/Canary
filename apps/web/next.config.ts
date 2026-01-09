import type { NextConfig } from 'next';
import { execSync } from 'child_process';

// 生成构建信息（包含 Git 信息）
const generateBuildInfo = () => {
  const buildTime = new Date().toISOString();
  const buildTimestamp = Date.now().toString();

  let gitCommit = 'unknown';
  let gitBranch = 'unknown';
  let gitTag = 'unknown';

  try {
    gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.warn('无法获取 Git commit hash');
  }

  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.warn('无法获取 Git branch');
  }

  try {
    gitTag = execSync('git describe --tags --exact-match 2>/dev/null || echo "no-tag"', {
      encoding: 'utf-8',
    }).trim();
  } catch (error) {
    // 如果没有 tag，使用 no-tag
    gitTag = 'no-tag';
  }

  return {
    buildId: buildTimestamp,
    buildTime,
    gitCommit,
    gitBranch,
    gitTag,
  };
};

// 只在构建时生成一次构建信息
const buildInfo = generateBuildInfo();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shared'],

  // 生成构建 ID（用于 Next.js 内部）
  generateBuildId: async () => {
    return buildInfo.buildId;
  },

  // 静态导出配置（可选 - 用于生成 dist 目录）
  // output: 'export',
  // distDir: 'dist',
  // trailingSlash: true,
  // images: {
  //   unoptimized: true,
  // },

  // 将构建信息暴露为环境变量（服务端可用）
  env: {
    BUILD_INFO: JSON.stringify(buildInfo),
    BUILD_ID: buildInfo.buildId,
    BUILD_TIME: buildInfo.buildTime,
    GIT_COMMIT: buildInfo.gitCommit,
    GIT_BRANCH: buildInfo.gitBranch,
    GIT_TAG: buildInfo.gitTag,
  },

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
