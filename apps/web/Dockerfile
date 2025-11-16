FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS dependencies
# 配置 npm 镜像
RUN echo "registry=https://registry.npmmirror.com" > /root/.npmrc
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
RUN mkdir -p ./libs/shared
COPY libs/shared/package.json ./libs/shared/
# 忽略 sqlite3 可选依赖，避免编译问题
RUN pnpm install --frozen-lockfile --no-optional

FROM base AS build
COPY tsconfig.base.json ./
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web ./apps/web
COPY libs/shared ./libs/shared
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
# Install dependencies inside the build stage to ensure pnpm workspace layout is correct
# 忽略 sqlite3 可选依赖，避免编译问题
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate && pnpm install --frozen-lockfile --no-optional
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
