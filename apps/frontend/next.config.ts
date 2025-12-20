import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  distDir: ".next",
  cacheComponents: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  // 配置 LESS 和 CSS 模块加载器
  webpack: (config, { isServer }) => {
    // CSS Module 规则
    config.module.rules.push({
      test: /\.module\.(less|css)$/,
      use: [
        {
          loader: "style-loader",
          options: {
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
            importLoaders: 2, // 指定 less-loader 和 postcss-loader
          },
        },
        {
          loader: "postcss-loader",
          options: {
            sourceMap: true,
          },
        },
        {
          loader: "less-loader",
          options: {
            sourceMap: true,
            // 支持 @ 别名路径解析
            lessOptions: {
              paths: [path.resolve(__dirname, "src")],
              javascriptEnabled: true,
            },
          },
        },
      ],
      sideEffects: true,
    });

    // 普通 CSS 规则（非 module）
    config.module.rules.push({
      test: /\.css$/,
      exclude: /\.module\.css$/,
      use: [
        {
          loader: "style-loader",
          options: {
            injectType: isServer ? "lazyStyleTag" : "styleTag",
          },
        },
        {
          loader: "css-loader",
          options: {
            sourceMap: true,
            importLoaders: 1,
          },
        },
        {
          loader: "postcss-loader",
          options: {
            sourceMap: true,
          },
        },
      ],
    });

    // 普通 LESS 规则（非 module）
    config.module.rules.push({
      test: /\.less$/,
      exclude: /\.module\.less$/,
      use: [
        {
          loader: "style-loader",
          options: {
            injectType: isServer ? "lazyStyleTag" : "styleTag",
          },
        },
        {
          loader: "css-loader",
          options: {
            sourceMap: true,
            importLoaders: 2,
          },
        },
        {
          loader: "postcss-loader",
          options: {
            sourceMap: true,
          },
        },
        {
          loader: "less-loader",
          options: {
            sourceMap: true,
            lessOptions: {
              paths: [path.resolve(__dirname, "src")],
              javascriptEnabled: true,
            },
          },
        },
      ],
    });

    // 配置 webpack 别名解析
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };

    return config;
  },
};

export default nextConfig;
