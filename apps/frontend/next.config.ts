import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  distDir: ".next",
  experimental: {
    ppr: true,
    dynamicIO: true,
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  eslint: {
    dirs: ["src"],
  },
};

export default nextConfig;
