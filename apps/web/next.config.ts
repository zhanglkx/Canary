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
    optimizePackageImports: ['@apollo/client'],
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
