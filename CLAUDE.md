# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Canary** is a full-stack monorepo learning project demonstrating modern web development with NestJS, Next.js, GraphQL, TypeScript, and PostgreSQL. It follows production-ready patterns with Docker containerization and type safety throughout.

## Quick Start Commands

### Development

```bash
# Install all dependencies
pnpm install

# Start PostgreSQL (development database only)
docker-compose -f docker-compose.dev.yml up -d

# Option 1: Run backend and frontend in parallel
pnpm dev

# Option 2: Run services separately (in different terminals)
pnpm dev:api       # NestJS backend on http://localhost:4000/graphql
pnpm dev:web       # Next.js frontend on http://localhost:3000
```

### Building & Linting

```bash
pnpm build              # Build all packages
pnpm lint               # Lint all packages
pnpm build:api          # Build backend only
pnpm build:web          # Build frontend only
```

### Docker

```bash
# Full production setup (all services)
docker-compose up --build

# Development (database only)
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose down
```

## Architecture Overview

### Monorepo Structure (pnpm workspaces)

```
Canary/
├── apps/
│   ├── api/          # NestJS Backend (GraphQL API)
│   └── web/          # Next.js Frontend (React)
├── libs/
│   └── shared/       # Shared types, constants, utilities
└── docker-compose.yml, docker-compose.dev.yml
```

### Technology Stack

**Backend**:
- NestJS 10 with GraphQL Apollo Server
- PostgreSQL database with TypeORM ORM
- JWT authentication with Passport strategies
- class-validator for input validation
- bcryptjs for password hashing

**Frontend**:
- Next.js 15 with App Router
- React 19 with Hooks
- Apollo Client for GraphQL queries/mutations
- Tailwind CSS for styling
- GraphQL Code Generator for type-safe operations

**DevOps**:
- pnpm 9+ for monorepo package management
- Docker multi-stage builds
- Docker Compose for local and production environments

### Data Flow Architecture

```
Frontend (Next.js + React + Apollo)
    ↓ (GraphQL over HTTP)
GraphQL API Layer (NestJS + Apollo Server)
    ↓ (TypeORM queries)
Database Layer (PostgreSQL)
    ↓
Shared Library (@shared package - types & utils)
```

**Key Points**:
- All communication between frontend and backend is GraphQL (no REST APIs)
- JWT tokens in Authorization headers for authenticated requests
- CORS enabled for localhost:3000 in development
- GraphQL schema auto-generated from NestJS decorators and TypeORM entities

## NestJS Backend Architecture

### Module Organization

Each feature follows the NestJS module pattern:

```
Feature Module (e.g., TodoModule)
├── Entity (TypeORM + GraphQL @ObjectType)
├── Service (Business logic, @Injectable)
├── Resolver (GraphQL operations)
├── DTO (Input validation)
└── Module (DI configuration)
```

### Key Modules

**AuthModule** (`apps/api/src/auth/`):
- Handles user registration and login
- JWT token generation and validation
- Passport strategies (LocalStrategy, JwtStrategy)
- @CurrentUser() decorator for extracting authenticated user

**UserModule** (`apps/api/src/user/`):
- User CRUD operations
- User queries in GraphQL

**TodoModule** (`apps/api/src/todo/`):
- Todo CRUD with user isolation (todos filtered by userId)
- Priority enum (LOW, MEDIUM, HIGH, URGENT)
- Optional category relationship

**CategoryModule** (`apps/api/src/category/`):
- Category management for organizing todos
- Color and icon properties for UI

**CommonModule** (`apps/api/src/common/`):
- GqlAuthGuard: Intercepts GraphQL requests, validates JWT
- @CurrentUser(): Decorator to inject authenticated user into resolvers
- Shared utilities and types

### GraphQL Query/Mutation Flow

```
Frontend sends GraphQL mutation
    ↓
NestJS GraphQL Layer receives request
    ↓
GqlAuthGuard validates JWT token (if @UseGuards applied)
    ↓
Resolver method executes (Service is injected via DI)
    ↓
Service calls Repository (TypeORM)
    ↓
TypeORM executes SQL query on PostgreSQL
    ↓
Result returned through resolver → GraphQL response
```

### Authentication Flow

1. User calls `register` or `login` mutation
2. LocalStrategy validates credentials
3. AuthService generates JWT token
4. Frontend stores token in localStorage
5. Subsequent requests: AuthLink adds `Authorization: Bearer {token}` header
6. GqlAuthGuard validates token on protected resolvers
7. @CurrentUser() injects the authenticated user from JWT payload

## Next.js Frontend Architecture

### File Structure

```
apps/web/src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with Providers (Apollo, Auth Context)
│   ├── page.tsx           # Home page
│   ├── login/page.tsx     # Login page
│   ├── register/page.tsx  # Register page
│   ├── dashboard/page.tsx # Protected dashboard
│   ├── todos/page.tsx     # Todo management
│   ├── categories/page.tsx # Category management
│   └── profile/page.tsx   # User profile
├── lib/
│   ├── apollo-client.ts   # Apollo Client configuration
│   ├── apollo-wrapper.tsx # ApolloProvider wrapper component
│   ├── auth-context.tsx   # React Context for auth state (user, token)
│   └── graphql/           # GraphQL queries, mutations, fragments
└── components/
    ├── layout/            # Layout components (navbar)
    └── ui/                # Reusable UI components
```

### State Management

**Apollo Client**: Handles all GraphQL queries and mutations with automatic caching
**Auth Context**: Manages authentication state (user, token, isAuthenticated)
- Token stored in localStorage for persistence
- AuthLink middleware injects JWT into all requests
- Protected routes require valid token

### Key Patterns

**Protected Pages**: Redirect unauthenticated users to login
**Conditional Rendering**: Show UI based on auth state
**GraphQL Code Generation**: Auto-generated types from backend schema (`pnpm --filter web codegen`)

## Database Schema & TypeORM Entities

### User Entity
- `id`: UUID primary key
- `email`: String, unique
- `username`: String
- `password`: String, hashed with bcryptjs
- `createdAt`, `updatedAt`: Timestamps
- **Relation**: One User → Many Todos, Categories

### Todo Entity
- `id`: UUID primary key
- `title`: String, required
- `description`: String, optional
- `completed`: Boolean (default: false)
- `priority`: Enum (LOW, MEDIUM, HIGH, URGENT)
- `dueDate`: Timestamp, optional
- `userId`: UUID foreign key
- `categoryId`: UUID foreign key (optional)
- `createdAt`, `updatedAt`: Timestamps
- **Relations**: Many Todos → One User, One Category

### Category Entity
- `id`: UUID primary key
- `name`: String
- `color`: String (hex color)
- `icon`: String (emoji or icon name)
- `userId`: UUID foreign key
- `createdAt`, `updatedAt`: Timestamps
- **Relations**: One Category → Many Todos

**Auto-migration**: Development mode has `synchronize: true` in TypeORM config to auto-sync schema

## Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=4000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=learning_nest_next
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1d
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
```

## Common Development Tasks

### Add a New GraphQL Query

1. Update backend entity/resolver in `apps/api/src/[module]/[module].resolver.ts`
2. Restart backend (auto-reload with `dev:api`)
3. Run code generation in frontend: `pnpm --filter web codegen`
4. Use generated types in frontend components

### Add a New Database Entity

1. Create entity file in `apps/api/src/[module]/entities/[entity].entity.ts`
2. Use TypeORM + GraphQL decorators (@Entity, @ObjectType, @Field, etc.)
3. Create service and resolver for CRUD operations
4. Register in module's imports/providers
5. Schema auto-syncs in development

### Add Authentication to a Query/Mutation

```typescript
@Resolver()
export class TodoResolver {
  @Query(() => [Todo])
  @UseGuards(GqlAuthGuard)  // Add this
  async todos(@CurrentUser() user: User) {  // Add this
    // Now you have access to authenticated user
  }
}
```

### Working with Shared Library

Access shared types/utils from both apps:
```typescript
import { SomeType, SomeUtil } from '@shared';
```

The `@shared` path alias is configured in `tsconfig.base.json`

## Docker & Deployment

### Multi-stage Docker Builds

Each app (api, web) has a Dockerfile with stages:
1. **base**: Node 20-alpine + pnpm
2. **dependencies**: Install packages
3. **build**: Compile TypeScript/Next.js
4. **production**: Minimal runtime (copy only necessary files)

### docker-compose.yml (Production)
- PostgreSQL service with health checks
- NestJS API service (depends on PostgreSQL)
- Next.js Web service (depends on API)
- Persistent volumes for database

### docker-compose.dev.yml (Development)
- PostgreSQL only (less overhead for local development)
- Developers run frontend/backend locally with `pnpm dev`

## Testing

```bash
pnpm test                 # Run all tests
pnpm --filter api test    # Backend tests only
pnpm --filter web test    # Frontend tests only
```

## Key Configuration Files

- **pnpm-workspace.yaml**: Defines monorepo packages
- **tsconfig.base.json**: Base TypeScript config with path aliases
- **apps/api/tsconfig.json**: Backend-specific config (less strict)
- **apps/web/tsconfig.json**: Frontend-specific config (stricter)

## Important Notes

### TypeScript & Type Safety
- Strict mode enabled in frontend, more lenient in backend for decorator flexibility
- GraphQL Code Generator auto-generates types from schema
- Shared types in `@shared` library ensure consistency

### Security Considerations
- CORS restricted to localhost:3000 in development
- JWT secrets via environment variables (never hardcoded)
- Passwords hashed with bcryptjs
- Protected resolvers use GqlAuthGuard
- User queries filtered by authenticated user ID (user isolation)

### Development Workflow
- Use separate terminals for `pnpm dev:api` and `pnpm dev:web`
- Hot-reload enabled in both backend and frontend
- GraphQL Playground available at http://localhost:4000/graphql
- Database schema auto-syncs in development mode
- Run `pnpm --filter web codegen` after backend schema changes

### Performance & Scalability
- pnpm hoisted dependencies reduce disk usage
- Docker multi-stage builds minimize container sizes
- Apollo Client caching prevents redundant queries
- TypeORM query optimization with proper indexing
- User data isolation ensures multi-tenant safety
