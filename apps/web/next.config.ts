import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shared'],
  
  // ESLint 配置 - 在构建时运行但不会因为 lint 错误而失败
  eslint: {
    // 在生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  
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
  // 添加自定义 webpack 配置来处理 SSR 问题
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 客户端特定配置
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
