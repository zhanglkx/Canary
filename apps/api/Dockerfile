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
# 完整安装所有依赖，包括可选依赖，确保 ajv 等模块正确安装
RUN pnpm install --frozen-lockfile

FROM base AS build
# 添加构建参数强制刷新缓存
ARG CACHEBUST=1
COPY tsconfig.base.json ./
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api ./apps/api
COPY libs/shared ./libs/shared
WORKDIR /app/apps/api
# 使用构建参数确保代码层被重新构建
RUN echo "Build cache bust: $CACHEBUST"
# Install dependencies inside the build stage to ensure pnpm workspace layout is correct
# 完整安装依赖，确保 @nestjs/cli 所需的 ajv 模块正确安装
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set network-timeout 300000 && \
    pnpm install --frozen-lockfile
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
