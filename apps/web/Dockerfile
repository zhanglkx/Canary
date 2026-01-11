FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS dependencies
# 配置 npm 镜像和网络设置
RUN echo "registry=https://registry.npmmirror.com" > /root/.npmrc && \
    echo "network-timeout=300000" >> /root/.npmrc && \
    echo "fetch-retries=5" >> /root/.npmrc && \
    echo "fetch-retry-mintimeout=20000" >> /root/.npmrc && \
    echo "fetch-retry-maxtimeout=120000" >> /root/.npmrc
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
RUN mkdir -p ./libs/shared
COPY libs/shared/package.json ./libs/shared/
RUN pnpm install --frozen-lockfile

FROM base AS build
# 重要：Next.js 构建时需要 NEXT_PUBLIC_* 环境变量
ARG NEXT_PUBLIC_API_URL
ARG CACHEBUST=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY tsconfig.base.json ./
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web ./apps/web
COPY libs/shared ./libs/shared
WORKDIR /app/apps/web
# 使用构建参数确保代码层被重新构建
RUN echo "Build cache bust: $CACHEBUST"
# Install dependencies inside the build stage to ensure pnpm workspace layout is correct
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set network-timeout 300000 && \
    pnpm install --frozen-lockfile --no-optional
RUN pnpm build

FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/package.json ./apps/web/
COPY --from=build /app/apps/web/next.config.ts ./apps/web/
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
