FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY libs/shared/package.json ./libs/shared/ 2>/dev/null || mkdir -p ./libs/shared
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY tsconfig.base.json ./
COPY apps/api ./apps/api
COPY libs/shared ./libs/shared
WORKDIR /app/apps/api
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
