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
    const result = execSync('git describe --tags --exact-match HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    gitTag = result || 'no-tag';
  } catch (error) {
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

const buildInfo = generateBuildInfo();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shared'],

  // 生成构建 ID
  generateBuildId: async () => {
    return buildInfo.buildId;
  },

  // 将构建信息暴露为环境变量
  env: {
    BUILD_INFO: JSON.stringify(buildInfo),
    BUILD_ID: buildInfo.buildId,
    BUILD_TIME: buildInfo.buildTime,
    GIT_COMMIT: buildInfo.gitCommit,
    GIT_BRANCH: buildInfo.gitBranch,
    GIT_TAG: buildInfo.gitTag,
  },

  experimental: {
    optimizePackageImports: ['axios'],
  },

  // ✅ SCSS 原生支持，无需 webpack 配置！
  // Next.js 会自动处理 .scss 和 .module.scss 文件
  // 路径别名 @/ 自动支持
  // CSS Modules 自动支持
  // HMR 自动支持

  // 如果需要自定义 Sass 选项（可选）
  sassOptions: {
    // 添加额外的 include paths（如果需要）
    includePaths: ['./src/styles'],

    // Sass 编译选项
    silenceDeprecations: ['legacy-js-api'], // 静默旧 API 警告
  },
};

export default nextConfig;
