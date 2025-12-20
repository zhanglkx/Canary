FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Copy monorepo files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy apps
COPY apps/frontend ./apps/frontend
COPY apps/backend ./apps/backend
COPY libs ./libs

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm -F @canary/frontend build

EXPOSE 3000

CMD ["pnpm", "-F", "@canary/frontend", "start"]
