import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shared'],
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
