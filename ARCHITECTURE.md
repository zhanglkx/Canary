# Project Architecture

This document explains the architectural decisions and structure of the learning-nest-next project.

## Overview

This is a full-stack monorepo application following modern best practices:

- **Monorepo**: Single repository containing multiple related packages
- **Type Safety**: End-to-end TypeScript with strict mode enabled
- **GraphQL**: Type-safe API communication with code generation
- **Containerization**: Docker for consistent development and deployment

## Tech Stack Versions

- **Node.js**: 20+ (LTS)
- **pnpm**: 9.15.0 (Fast, disk space efficient)
- **NestJS**: 10.4.15 (Latest stable)
- **Next.js**: 15.1.3 (Latest with App Router)
- **React**: 19.0.0 (Latest stable)
- **TypeScript**: 5.7.2 (Latest)
- **GraphQL**: 16.9.0
- **PostgreSQL**: 16 (Alpine)
- **TypeORM**: 0.3.20

## Monorepo Structure

```
learning-nest-next/
├── apps/                    # Application packages
│   ├── api/                 # Backend (NestJS)
│   └── web/                 # Frontend (Next.js)
├── libs/                    # Shared libraries
│   └── shared/              # Common types, constants, utils
├── .vscode/                 # VS Code workspace settings
├── docker-compose.yml       # Production Docker setup
├── docker-compose.dev.yml   # Development Docker setup
├── pnpm-workspace.yaml      # pnpm workspace configuration
└── tsconfig.base.json       # Base TypeScript config
```

## Backend Architecture (NestJS)

### Module Structure

NestJS follows a modular architecture. Each feature is encapsulated in its own module:

```
apps/api/src/
├── auth/                    # Authentication & Authorization
│   ├── dto/                 # Data Transfer Objects
│   ├── strategies/          # Passport strategies (JWT, Local)
│   ├── auth.module.ts
│   ├── auth.service.ts
│   └── auth.resolver.ts
├── user/                    # User management
│   ├── dto/
│   ├── user.entity.ts       # TypeORM entity
│   ├── user.module.ts
│   ├── user.service.ts
│   └── user.resolver.ts
├── todo/                    # Todo CRUD operations
│   ├── dto/
│   ├── todo.entity.ts
│   ├── todo.module.ts
│   ├── todo.service.ts
│   └── todo.resolver.ts
├── common/                  # Shared utilities
│   ├── decorators/          # Custom decorators
│   └── guards/              # Auth guards
├── app.module.ts            # Root module
└── main.ts                  # Application entry point
```

### Key Patterns

1. **Dependency Injection**: NestJS's built-in DI container manages dependencies
2. **Decorators**: Extensive use of TypeScript decorators for metadata
3. **GraphQL Code-First**: Schema generated from TypeScript classes
4. **Repository Pattern**: TypeORM repositories for data access
5. **Guards**: Protect routes with JWT authentication

### Database Design

**PostgreSQL** with TypeORM:
- UUID primary keys
- Automatic timestamps (createdAt, updatedAt)
- Foreign key relationships
- Database synchronization in development

## Frontend Architecture (Next.js)

### App Router Structure

Next.js 15 uses the new App Router (app directory):

```
apps/web/src/
├── app/                     # App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles (Tailwind)
│   ├── login/               # Login page (future)
│   ├── register/            # Register page (future)
│   └── todos/               # Todos page (future)
├── components/              # Reusable React components
└── lib/                     # Utilities and configurations
    ├── apollo-client.ts     # Apollo Client setup
    ├── apollo-wrapper.tsx   # Client-side Apollo provider
    └── gql/                 # Generated GraphQL types (codegen)
```

### Key Patterns

1. **Server Components**: Default in Next.js 15
2. **Client Components**: Marked with 'use client' directive
3. **Apollo Client**: GraphQL client with caching
4. **Code Generation**: Automatic TypeScript types from GraphQL schema
5. **CSS-in-JS**: Tailwind CSS for styling

## Shared Library

The `libs/shared` package contains code shared between frontend and backend:

```
libs/shared/src/
├── types.ts                 # Shared TypeScript interfaces
├── constants.ts             # Shared constants (messages, routes)
├── utils.ts                 # Shared utility functions
└── index.ts                 # Package entry point
```

Benefits:
- Single source of truth for types
- Code reuse between frontend and backend
- Consistent error messages and constants

## GraphQL Layer

### Code-First Approach

NestJS uses decorators to define the GraphQL schema:

```typescript
@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;
}
```

This generates:
```graphql
type User {
  id: ID!
  email: String!
}
```

### Frontend Code Generation

GraphQL Code Generator creates TypeScript types and React hooks from queries:

```typescript
// Write GraphQL query
const GET_TODOS = gql`
  query GetTodos {
    todos {
      id
      title
    }
  }
`;

// Generated hook
const { data, loading } = useGetTodosQuery();
```

## Authentication Flow

1. **User Registration**:
   - Frontend sends mutation to backend
   - Backend hashes password with bcrypt
   - Creates user in database
   - Returns JWT token

2. **Login**:
   - Frontend sends credentials
   - Backend validates with Passport Local Strategy
   - Returns JWT token

3. **Authenticated Requests**:
   - Frontend sends token in Authorization header
   - Backend validates with Passport JWT Strategy
   - Extracts user from token
   - Injects user into GraphQL context

4. **Protected Routes**:
   - GraphQL resolvers use @UseGuards(GqlAuthGuard)
   - Frontend stores token in localStorage
   - Apollo Client auto-attaches token to requests

## Docker Architecture

### Development (docker-compose.dev.yml)

Only runs PostgreSQL:
```
- Frontend: Run locally (hot reload)
- Backend: Run locally (hot reload)
- Database: Docker container
```

Benefits:
- Fast hot reload
- Easy debugging
- Native IDE integration

### Production (docker-compose.yml)

Full stack in containers:
```
- Frontend: Docker container (optimized build)
- Backend: Docker container (optimized build)
- Database: Docker container
```

Multi-stage builds:
1. Base: Node.js + pnpm
2. Dependencies: Install packages
3. Build: Compile TypeScript/Next.js
4. Production: Copy only necessary files

## Development Workflow

```
┌─────────────┐
│   Browser   │
│ localhost:  │
│    3000     │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│  Next.js    │
│  Frontend   │
│  (Dev Mode) │
└──────┬──────┘
       │ GraphQL
       │ WS/HTTP
       ▼
┌─────────────┐
│   NestJS    │
│   Backend   │
│  (Watch Mode)│
└──────┬──────┘
       │ SQL
       ▼
┌─────────────┐
│ PostgreSQL  │
│  (Docker)   │
└─────────────┘
```

## Production Deployment

```
┌─────────────┐
│   Nginx     │  ← Optional reverse proxy
│   (Port 80) │
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
   ▼        ▼
┌─────┐  ┌─────┐
│ Web │  │ API │  ← Docker containers
│:3000│  │:4000│
└──┬──┘  └──┬──┘
   │        │
   └───┬────┘
       ▼
   ┌─────┐
   │ DB  │  ← PostgreSQL container
   │:5432│
   └─────┘
```

## Type Safety Flow

```
1. Database Schema (TypeORM)
   ↓
2. NestJS Entities (@ObjectType)
   ↓
3. GraphQL Schema (Auto-generated)
   ↓
4. TypeScript Types (Codegen)
   ↓
5. React Components (Type-safe)
```

## Security Considerations

1. **Password Security**:
   - bcrypt with salt rounds: 10
   - Passwords never returned in queries (@HideField)

2. **Authentication**:
   - JWT with expiration
   - Bearer token in Authorization header
   - Refresh tokens not implemented (future enhancement)

3. **Authorization**:
   - GraphQL guards protect sensitive queries
   - User isolation (users can only access their own data)

4. **Environment Variables**:
   - Secrets in .env files (not committed)
   - Different configs for dev/prod

5. **CORS**:
   - Configured in NestJS
   - Restricted to frontend URL

## Performance Optimizations

1. **Apollo Client Caching**:
   - InMemoryCache for query results
   - Reduces network requests

2. **Next.js Optimizations**:
   - Automatic code splitting
   - Image optimization
   - Static generation where possible

3. **Docker Multi-stage Builds**:
   - Smaller production images
   - Cached layers for faster rebuilds

4. **Database Indexing**:
   - UUID primary keys
   - Unique indexes on email
   - Foreign key indexes

## Testing Strategy (Future)

1. **Backend**:
   - Unit tests: Jest
   - E2E tests: Supertest
   - Coverage: >80%

2. **Frontend**:
   - Unit tests: Jest + React Testing Library
   - E2E tests: Playwright/Cypress
   - Visual regression: Chromatic

## Scalability Considerations

Current setup is suitable for:
- Learning and development
- Small to medium applications
- MVP and prototypes

For production scale:
- Add Redis for caching
- Implement rate limiting
- Add load balancer
- Use managed PostgreSQL
- Implement health checks
- Add monitoring (Prometheus, Grafana)
- Implement logging aggregation
- Add CI/CD pipeline

## Learning Path

1. **Week 1**: Setup & Basic CRUD
   - Understand monorepo structure
   - Run the project locally
   - Explore GraphQL Playground
   - Create simple queries/mutations

2. **Week 2**: Authentication
   - Understand JWT flow
   - Implement login/register UI
   - Add protected routes
   - Handle token expiration

3. **Week 3**: Advanced Features
   - Add file uploads
   - Implement pagination
   - Add real-time subscriptions
   - Optimize performance

4. **Week 4**: Deployment
   - Build Docker images
   - Deploy to cloud
   - Set up CI/CD
   - Monitor production

## Resources

- [NestJS Architecture](https://docs.nestjs.com/fundamentals)
- [Next.js App Router](https://nextjs.org/docs/app)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Monorepo with pnpm](https://pnpm.io/workspaces)

## Contributing

This is a learning project. Feel free to:
- Add new features
- Refactor code
- Improve documentation
- Share your learnings

Happy learning!
