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
COPY apps/api/package.json ./apps/api/
RUN mkdir -p ./libs/shared
COPY libs/shared/package.json ./libs/shared/
# 忽略 sqlite3 可选依赖，避免编译问题
RUN pnpm install --frozen-lockfile --no-optional

FROM base AS build
COPY tsconfig.base.json ./
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api ./apps/api
COPY libs/shared ./libs/shared
WORKDIR /app/apps/api
# Install dependencies inside the build stage to ensure pnpm workspace layout is correct
# 忽略 sqlite3 可选依赖，避免编译问题
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set network-timeout 300000 && \
    pnpm install --frozen-lockfile --no-optional
RUN pnpm build

FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
