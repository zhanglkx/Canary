# Monorepo Setup Guide

## Project Overview

This is a full-stack monorepo using pnpm workspaces containing:
- **Frontend**: Next.js 16 with React 19
- **Backend**: NestJS 11 with TypeORM
- **Shared Libraries**: Types and utilities

## Prerequisites

- Node.js 20.x or higher
- pnpm 9.15 or higher
- Git

## Installation

### 1. Install pnpm
```bash
npm install -g pnpm@latest
```

### 2. Install Dependencies
```bash
pnpm install
```

This installs dependencies for all packages in the monorepo.

### 3. Setup Environment Files
```bash
# Root environment
cp .env.example .env

# Backend environment
cp apps/backend/.env.local apps/backend/.env.local

# Frontend environment (already present)
cp apps/frontend/.env.local apps/frontend/.env.local
```

## Workspace Structure

### Frontend Workspace
- Location: `apps/frontend/`
- Package: `@canary/frontend`
- Type: Next.js 16
- Commands: `dev`, `build`, `start`, `lint`, `test`

### Backend Workspace
- Location: `apps/backend/`
- Package: `@canary/backend`
- Type: NestJS 11
- Commands: `dev`, `build`, `start:prod`, `lint`, `test`

### Shared Libraries

#### @canary/shared-types
- Location: `libs/shared-types/`
- Purpose: Shared TypeScript interfaces and types
- Exports: Type definitions for frontend/backend communication

#### @canary/utils
- Location: `libs/utils/`
- Purpose: Shared utility functions
- Exports: API helpers, validators, formatters, storage utilities

## Running the Project

### Local Development (Both Frontend & Backend)
```bash
pnpm dev
```

This uses `pnpm -r --parallel run dev` to start both servers concurrently.

### Individual Applications
```bash
# Frontend only
pnpm -F @canary/frontend dev

# Backend only
pnpm -F @canary/backend dev
```

### Production Build
```bash
# Build all
pnpm build

# Build specific
pnpm -F @canary/frontend build
pnpm -F @canary/backend build
```

### Testing
```bash
# All tests
pnpm test

# Specific workspace
pnpm -F @canary/frontend test
pnpm -F @canary/backend test:watch
```

## Monorepo Commands

### Filtering

```bash
# Run script in specific workspace
pnpm -F @canary/frontend run dev
pnpm --filter backend dev

# Run script in all workspaces
pnpm -r run lint

# Run script in parallel
pnpm -r --parallel run dev
```

### Workspace Management

```bash
# Add dependency to specific workspace
pnpm -F @canary/frontend add axios

# Add dev dependency
pnpm -F @canary/backend add -D @types/node

# Install in all workspaces
pnpm -r install

# Remove all node_modules
pnpm run clean
```

## Adding Dependencies

### Frontend
```bash
pnpm -F @canary/frontend add react-query
pnpm -F @canary/frontend add -D @testing-library/react
```

### Backend
```bash
pnpm -F @canary/backend add @nestjs/swagger
pnpm -F @canary/backend add -D jest
```

### Shared Libraries
```bash
pnpm -F @canary/shared-types add some-package
```

## Configuration Files

### Root Level
- `pnpm-workspace.yaml` - Workspace configuration
- `package.json` - Root scripts and metadata
- `tsconfig.base.json` - Base TypeScript configuration
- `.npmrc` - NPM/pnpm configuration
- `turbo.json` - Turbo build cache configuration

### Frontend
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Code formatter config
- `jest.config.js` - Jest test configuration

### Backend
- `nest-cli.json` - NestJS CLI configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - ESLint rules
- `.prettierrc` - Code formatter config

## Docker Development

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Services
- **PostgreSQL**: `postgresql://postgres:postgres@localhost:5432/canary_db`
- **Backend**: `http://localhost:4000`
- **Frontend**: `http://localhost:3000`

## Version Management

### Checking Versions
```bash
# Check if dependencies are outdated
pnpm outdated

# Check specific package
pnpm list react
pnpm list @nestjs/core
```

### Updating Dependencies
```bash
# Update all to latest compatible
pnpm update

# Interactive update
pnpm update --latest --interactive

# Update specific workspace
pnpm -F @canary/frontend update --latest
```

## Troubleshooting

### Clean Install
```bash
pnpm run clean
pnpm install
```

### Dependency Resolution Issues
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install --force
```

### Port Conflicts
```bash
# Find process using port
lsof -i :3000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Database Issues
```bash
# Reset SQLite
rm apps/backend/db.sqlite

# Restart backend
pnpm -F @canary/backend run dev
```

## IDE Setup

### VS Code Extensions
- ESLint
- Prettier - Code formatter
- TypeScript Vue Plugin (Volar)
- REST Client
- Thunder Client

### VS Code Settings
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Performance Optimization

### Monorepo Caching
The project uses Turbo for build caching. Cache is stored in `.turbo/` directory.

### Dependency Optimization
- Shared types and utilities are exported from libs
- Dependencies are properly versioned and locked
- pnpm creates hard links for efficiency

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test and Build
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm build
```

## Security

### Environment Variables
- Never commit `.env` files
- Use `.env.example` as template
- Rotate secrets regularly
- Use strong JWT secrets in production

### Dependencies
```bash
# Audit dependencies
pnpm audit

# Fix vulnerabilities
pnpm audit --fix
```

## Performance Metrics

### Build Time
Typical build times:
- Frontend: ~30-45 seconds
- Backend: ~20-30 seconds
- Both parallel: ~45-60 seconds

### Development Server Startup
- Frontend: ~5 seconds
- Backend: ~3 seconds
- Both parallel: ~5-7 seconds

## Additional Resources

- [pnpm Documentation](https://pnpm.io/)
- [Monorepo Best Practices](https://monorepo.tools/)
- [Turbo Documentation](https://turbo.build/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

For more details, see:
- `README.md` - Main project documentation
- `apps/frontend/DEVELOPMENT.md` - Frontend development guide
- `apps/backend/DEVELOPMENT.md` - Backend development guide
