import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  distDir: ".next",
  cacheComponents: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  // 配置 LESS 模块加载器（使用 --webpack 标志时激活）
  webpack: (config, { isServer }) => {
    // 添加 LESS loader 规则
    config.module.rules.push({
      test: /\.module\.less$/,
      use: [
        {
          loader: "style-loader",
          options: {
            // For SSR, use injectType instead of singleton (style-loader 3.x)
            injectType: isServer ? "lazyStyleTag" : "styleTag",
          },
        },
        {
          loader: "css-loader",
          options: {
            modules: {
              auto: true,
              localIdentName: "[path][name]__[local]--[hash:base64:5]",
            },
            sourceMap: true,
          },
        },
        {
          loader: "less-loader",
          options: {
            sourceMap: true,
          },
        },
      ],
      sideEffects: true,
    });

    return config;
  },
};

export default nextConfig;
