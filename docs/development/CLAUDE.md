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

### Building, Linting & Testing

```bash
pnpm build              # Build all packages
pnpm lint               # Lint all packages
pnpm build:api          # Build backend only
pnpm build:web          # Build frontend only
pnpm test               # Run all tests
pnpm --filter api test          # Run backend tests only
pnpm --filter api test:watch    # Run backend tests in watch mode
pnpm --filter api test:cov      # Run backend tests with coverage
pnpm --filter web test          # Run frontend tests only
```

### GraphQL Code Generation

When you modify backend GraphQL resolvers/entities, regenerate frontend types:

```bash
pnpm --filter web codegen      # Generate types from backend schema
```

Run this after any backend schema changes to keep frontend types in sync.

### Debugging

```bash
pnpm debug:api          # Debug backend with hot reload
pnpm debug:api:brk      # Debug backend and break on first line
pnpm debug:api:prod     # Debug production build (no hot reload)
```

Connect debugger to `127.0.0.1:9229` in your IDE (VS Code, Chrome DevTools)

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
- User registration and login with JWT tokens
- JWT token generation, validation, and revocation
- Passport strategies (LocalStrategy, JwtStrategy)
- Refresh token management with multi-device session support
- @CurrentUser() decorator for extracting authenticated user
- Mutations: `register`, `login`, `refreshToken`, `logout`, `logoutAll`

**UserModule** (`apps/api/src/user/`):
- User CRUD operations
- User profile queries in GraphQL

**TodoModule** (`apps/api/src/todo/`):
- Todo CRUD with user isolation (todos filtered by userId)
- Priority enum (LOW, MEDIUM, HIGH, URGENT)
- Optional category relationship

**CategoryModule** (`apps/api/src/category/`):
- Category management for organizing todos
- Color and icon properties for UI
- One-to-many relationship (Category → Todos)

**CommentModule** (`apps/api/src/comment/`):
- Comments/discussions on todos
- Author-only delete permissions
- One-to-many relationships (User ↔ Comment, Todo ↔ Comment)

**TagModule** (`apps/api/src/tag/`):
- Tag system for organizing todos
- Many-to-many relationship (Tag ↔ Todo) with auto-managed join table
- Add/remove tags from todos

**SearchModule** (`apps/api/src/search/`):
- Full-text search across todos (keyword matching)
- Advanced filtering by priority, completion status, category, tags
- QueryBuilder for complex database queries

**StatsModule** (`apps/api/src/stats/`):
- Todo statistics (total, completed, completion percentage)
- Priority distribution and overdue task counts
- Dashboard aggregating all metrics

**EcommerceModule** (`apps/api/src/ecommerce/`) ⭐ **NEW**:
- Complete e-commerce system with 5 sub-modules:
  - **ProductModule**: Product catalog, SKUs, images, categories, attributes
  - **InventoryModule**: Stock management with concurrency control (optimistic locking)
  - **CartModule**: Shopping cart management with persistence
  - **OrderModule**: Order processing, order items, order history
  - **PaymentModule**: Multi-gateway payment processing (Stripe, PayPal)
- Key Features: Advanced filtering, search, transaction management, concurrent inventory updates

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
2. LocalStrategy validates credentials via Passport
3. AuthService generates JWT token pair (access + refresh tokens)
4. TokenService stores refresh token in database with device metadata (userAgent, ipAddress)
5. Response includes both tokens with expiration times (access: 15min, refresh: 7 days)
6. Frontend stores both tokens in localStorage
7. Subsequent requests: AuthLink adds `Authorization: Bearer {accessToken}` header
8. GqlAuthGuard validates access token signature and expiration on protected resolvers
9. @CurrentUser() injects authenticated user from JWT payload
10. When access token expires: Frontend uses `refreshToken` mutation to obtain new token pair
11. Multi-device support: Each device/session tracked separately for targeted logout

**Token Types**:
- **Access Token**: Short-lived (15 minutes), used for API authentication
- **Refresh Token**: Long-lived (7 days), stored in DB for revocation tracking and session management
- **Multi-device Logout**: `logoutAll` mutation revokes all user's refresh tokens across all devices

**RefreshToken Entity** (`apps/api/src/auth/entities/refresh-token.entity.ts`):
- Stores JWT refresh tokens with metadata
- Tracks device info (userAgent, ipAddress) for security audit
- Database indexes on (userId, isRevoked) and (expiresAt) for efficient queries
- CASCADE delete when user is deleted

## Next.js Frontend Architecture

### File Structure

```
apps/web/src/
├── app/                       # Next.js App Router pages
│   ├── layout.tsx            # Root layout with Providers (Apollo, Auth Context)
│   ├── page.tsx              # Home page
│   ├── login/page.tsx        # Login page
│   ├── register/page.tsx     # Register page
│   ├── dashboard/page.tsx    # Protected dashboard
│   ├── todos/page.tsx        # Todo management
│   ├── categories/page.tsx   # Category management
│   ├── shop/page.tsx         # E-commerce product listing
│   ├── cart/page.tsx         # Shopping cart interface
│   ├── checkout/page.tsx     # Checkout/order creation
│   ├── orders/page.tsx       # Order history and tracking
│   └── profile/page.tsx      # User profile
├── lib/
│   ├── apollo-client.ts      # Apollo Client configuration with auth middleware
│   ├── apollo-wrapper.tsx    # ApolloProvider wrapper component
│   ├── auth-context.tsx      # React Context for auth state (user, token)
│   └── graphql/              # GraphQL queries, mutations, fragments
│       ├── auth/             # Auth-related operations
│       ├── todos/            # Todo operations
│       ├── ecommerce/        # E-commerce operations
│       └── ...
└── components/
    ├── layout/               # Layout components (navbar, footer)
    ├── features/             # Feature-specific components (e-commerce, todos)
    └── ui/                   # Reusable UI components
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

### Setup

1. **Backend**: Copy `.env.example` to `.env` in `apps/api/`:
```bash
cp apps/api/.env.example apps/api/.env
```

2. **Frontend**: Copy `.env.local.example` to `.env.local` in `apps/web/`:
```bash
cp apps/web/.env.local.example apps/web/.env.local
```

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
DEBUG_PORT=9229
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
```

## Common Development Tasks

### Add a New GraphQL Query/Mutation

1. Update backend entity/resolver in `apps/api/src/[module]/[module].resolver.ts`
2. Define query/mutation method with @Query() or @Mutation() decorator
3. Restart backend (auto-reload with `dev:api`)
4. Run code generation in frontend: `pnpm --filter web codegen`
5. Use generated types and hooks in frontend components

Example:
```typescript
@Resolver(() => Todo)
export class TodoResolver {
  @Query(() => [Todo])
  @UseGuards(GqlAuthGuard)
  async todos(@CurrentUser() user: User): Promise<Todo[]> {
    return this.todoService.findByUser(user.id);
  }
}
```

### Add Authentication to Resolvers

Protect queries/mutations requiring authentication:
```typescript
@Resolver()
export class TodoResolver {
  @Query(() => [Todo])
  @UseGuards(GqlAuthGuard)  // Add this guard
  async todos(@CurrentUser() user: User) {  // Injects authenticated user
    // Only authenticated users reach here
  }
}
```

### Implement Many-to-Many Relationships

Example from TagModule:
```typescript
@Entity('todos')
export class Todo {
  @ManyToMany(() => Tag, tag => tag.todos, { eager: true })
  @JoinTable()
  tags: Tag[];
}

// In resolver:
@Mutation(() => Todo)
async addTagToTodo(
  @Args('tagId') tagId: string,
  @Args('todoId') todoId: string,
): Promise<Todo> {
  return this.todoService.addTagToTodo(todoId, tagId);
}
```

### Working with Complex Queries

SearchModule demonstrates QueryBuilder patterns:
```typescript
// In service
const todos = this.todoRepository
  .createQueryBuilder('todo')
  .where('todo.title ILIKE :keyword', { keyword: `%${keyword}%` })
  .andWhere('todo.priority = :priority', { priority })
  .andWhere('todo.userId = :userId', { userId })
  .leftJoinAndSelect('todo.tags', 'tags')
  .getMany();
```

### Add a New Database Entity

1. Create entity file: `apps/api/src/[module]/entities/[entity].entity.ts`
2. Use TypeORM + GraphQL decorators (@Entity, @ObjectType, @Field)
3. Create service (`[entity].service.ts`) with business logic
4. Create resolver (`[entity].resolver.ts`) with GraphQL operations
5. Create module (`[entity].module.ts`) registering providers
6. Schema auto-syncs in development (check database logs)

### Implementing JWT Token Refresh Flow

When modifying auth flows or creating new authenticated endpoints:

1. **Protect Resolver**: Add `@UseGuards(GqlAuthGuard)` and `@CurrentUser()` decorator:
```typescript
@Resolver()
export class MyResolver {
  @Mutation(() => MyType)
  @UseGuards(GqlAuthGuard)
  async myMutation(@CurrentUser() user: User): Promise<MyType> {
    // User is guaranteed to be authenticated
  }
}
```

2. **Use TokenService for token operations**: Inject and use for token management
```typescript
constructor(private tokenService: TokenService) {}

const { accessToken, refreshToken, expiresIn } =
  await this.tokenService.generateTokenPair(user, userAgent, ipAddress);
```

3. **Frontend Token Refresh**: Handled automatically via Apollo Client AuthLink with built-in refresh logic

### Working with E-Commerce Orders

Complete order flow with inventory management:

1. **Create Order** (service layer):
```typescript
// In OrderService: Reserve inventory, create order, clear cart
const order = await this.orderService.createOrder(userId, cartItems);
// Internally: 1) Reserves inventory 2) Creates order items 3) Clears cart
```

2. **Handle Payment Callbacks**: Process payment confirmations:
```typescript
// In PaymentService: Confirm inventory, update order status
await this.paymentService.confirmPayment(orderId, transactionId);
// Internally: 1) Confirms reserved inventory 2) Updates order status
```

3. **Inventory Concurrency**: QueryBuilder with version check for optimistic locking
```typescript
// Multiple concurrent updates safe due to version-based locking
const updated = await this.skuRepository
  .createQueryBuilder()
  .update(ProductSku)
  .set({ stock: () => 'stock - :quantity', version: () => 'version + 1' })
  .where('id = :id AND version = :version')
  .setParameters({ id, quantity, version })
  .execute();
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

## E-Commerce System Architecture ⭐ **NEW**

### Overview

The e-commerce module is a complete, production-ready system with:
- Multi-tier product catalog with SKUs and inventory management
- Real-time stock tracking with concurrency control (optimistic locking)
- Shopping cart with persistence
- Complete order lifecycle management
- Multi-gateway payment processing (Stripe, PayPal)

### Sub-Modules

**ProductModule** (`apps/api/src/ecommerce/product/`):
- Product entities: ProductCategory (hierarchical), Product, ProductSku, ProductImage, ProductAttribute
- Advanced filtering and search capabilities
- SKU management with pricing and inventory references
- Infinite-level category hierarchy with materialized path optimization

**InventoryModule** (`apps/api/src/ecommerce/inventory/`):
- Stock level tracking per SKU
- Optimistic locking (`ProductSku.version`) for concurrent updates
- Inventory reservation during order processing
- Inventory confirmation/release on payment success/cancellation
- Prevents overselling with concurrent operation tests

**CartModule** (`apps/api/src/ecommerce/cart/`):
- ShoppingCart entity (persistent per user)
- ShoppingCartItem entities with quantity management
- Real-time price calculations
- Cart persistence across sessions

**OrderModule** (`apps/api/src/ecommerce/order/`):
- Order entity with order status tracking
- OrderItem entities linking to Products/SKUs
- Order history queries per user
- Order logs for audit trail and state transitions
- Transactional order creation with inventory reservation

**PaymentModule** (`apps/api/src/ecommerce/payment/`):
- Strategy pattern implementation for payment gateways
- Stripe integration for credit card processing
- PayPal integration for PayPal account payments
- Payment transaction tracking
- Webhook handling for payment confirmations

### Key E-Commerce Patterns

**Optimistic Locking** (Inventory Concurrency):
```typescript
// ProductSku has version column for lock management
// Multiple users can read inventory simultaneously
// Write succeeds only if version matches; retried on mismatch
```

**Transaction Management**:
- Order creation wraps inventory reserve, cart clear, and order creation
- Rollback on payment failure releases reserved inventory
- Database-level transaction isolation prevents race conditions

**Query Optimization**:
- QueryBuilder with eager loading to prevent N+1 queries
- DataLoader integration planned for batch loading relationships
- Indexed queries on userId, SKU, and order status

### Frontend Pages

**Shop** (`apps/web/src/app/shop/page.tsx`):
- Product listing with advanced filtering
- Category navigation
- Search functionality

**Product Detail** (`apps/web/src/app/shop/[id]/page.tsx`):
- Product images gallery
- SKU/variant selector
- Inventory status display
- Add-to-cart button

**Cart** (`apps/web/src/app/cart/page.tsx`):
- Cart items list with quantity adjustment
- Price calculation and totals
- Remove items functionality
- Proceed-to-checkout button

**Checkout** (`apps/web/src/app/checkout/page.tsx`):
- Order review and confirmation
- Shipping address selection
- Payment method selection (Stripe/PayPal)
- Order total summary

**Orders** (`apps/web/src/app/orders/page.tsx`):
- Order history list per user
- Order status tracking
- Order detail view with items

## Testing

```bash
pnpm test                                              # Run all tests
pnpm --filter api test                                # Backend tests only
pnpm --filter api test:watch                          # Watch mode
pnpm --filter api test:cov                            # Coverage report
pnpm --filter api test -- inventory.service.spec.ts  # Single test file
pnpm --filter web test                                # Frontend tests only
```

**Example: Inventory Concurrency Test**:
```bash
pnpm --filter api test -- inventory.service.concurrent.spec.ts
# Tests optimistic locking with multiple concurrent stock updates
# Verifies no overselling occurs under concurrent conditions
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
- Use separate terminals for `pnpm dev:api` and `pnpm dev:web` (or use `pnpm dev` for both)
- Hot-reload enabled in both backend and frontend
- GraphQL Studio available at http://localhost:4000/apollo-studio
- Database schema auto-syncs in development mode (watch logs for schema changes)
- Run `pnpm --filter web codegen` after backend schema changes to regenerate types
- Test changes quickly: `pnpm test` for unit tests or specific test file with Jest

### Key Architectural Patterns
- **Code-First GraphQL**: Entities decorated with @ObjectType generate schema automatically
- **TypeORM Decorators**: Same entity handles both database mapping and GraphQL exposure
- **User Isolation**: All user queries filtered by authenticated user ID (multi-tenant safety)
- **Repository Pattern**: Services use injected repositories for data access
- **GraphQL Guards**: @UseGuards(GqlAuthGuard) protects sensitive operations
- **Eager Loading**: Many-to-many relationships (tags) use eager: true to auto-fetch

### Performance & Scalability
- pnpm hoisted dependencies reduce disk usage
- Docker multi-stage builds minimize container sizes
- Apollo Client caching prevents redundant queries
- TypeORM query optimization with proper indexing
- User data isolation ensures multi-tenant safety

### E-Commerce-Specific Performance Patterns
- **Optimistic Locking**: Prevents overselling in high-concurrency scenarios (no pessimistic table locks)
- **Composite Database Indexes**: (userId, isRevoked), (productId, stock), (orderId, status) for fast queries
- **Eager Loading**: Many-to-many relationships (Products → Categories, Orders → Items) use `eager: true`
- **Batch Operations**: Order creation batches multiple item inserts for efficiency
- **Transaction Isolation**: Serializable isolation level for order processing ensures data consistency
- **Query Caching**: Apollo Client caches product listings and category hierarchies to minimize backend hits

## Documentation & References

### Key Documentation Files

- **IMPLEMENTATION_SUMMARY.md**: Summary of JWT refresh token implementation with detailed test results
- **ECOMMERCE_IMPLEMENTATION_ROADMAP.md**: Complete e-commerce development roadmap with 8 phases
  - Phase 1: Product management services
  - Phase 2: Inventory management with concurrency control
  - Phase 3: Shopping cart system
  - Phase 4: Order processing
  - Phase 5: Payment integration
  - Phase 6: Product reviews
  - Phase 7: Frontend implementation
  - Phase 8: Testing and optimization

### GraphQL Schema & Operations

**Auth Mutations**:
- `register(registerInput)` → AuthResponse (includes user + tokens)
- `login(loginInput)` → AuthResponse
- `refreshToken(refreshTokenInput)` → TokenResponse (new access token)
- `logout(refreshToken)` → Boolean (revoke single device)
- `logoutAll` → Boolean (revoke all devices)

**E-Commerce Queries** (planned/implemented):
- `products(filter, pagination)` → [Product]
- `productDetail(id)` → Product
- `cart` → ShoppingCart
- `orders` → [Order]
- `order(id)` → Order

**E-Commerce Mutations** (planned/implemented):
- `addToCart(productId, quantity)` → ShoppingCart
- `removeFromCart(cartItemId)` → ShoppingCart
- `createOrder(cartItems, shippingAddress)` → Order
- `processPayment(orderId, paymentMethod)` → PaymentResult

## Troubleshooting

### Port Conflicts
If ports 3000, 4000, or 5432 are already in use:
```bash
# Find process using port
lsof -i :4000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues
1. Verify PostgreSQL is running: `docker-compose -f docker-compose.dev.yml ps`
2. Check credentials in `apps/api/.env` match database setup
3. View database logs: `docker-compose -f docker-compose.dev.yml logs postgres`

### Module Resolution Errors
```bash
# Clear and reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### GraphQL Schema Not Updating
- Restart backend server: `pnpm dev:api`
- Check schema generation: `schema.gql` should exist at `apps/api/src/schema.gql`
- Run codegen for frontend: `pnpm --filter web codegen`

### Hot Reload Not Working
1. Ensure you're using `pnpm dev:api` (not `pnpm build`)
2. Check file system permissions for watched directories
3. Try restarting the development server

## Git Workflow

### Creating a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### Making Changes
1. Make code changes in feature branch
2. Run tests: `pnpm test`
3. Run linter: `pnpm lint`
4. Build to verify: `pnpm build`

### Committing
```bash
git add .
git commit -m "Descriptive message about changes"
git push origin feature/your-feature-name
```

### Schema Changes Workflow
When modifying backend entities or resolvers:
1. Make changes to backend in `apps/api/src/`
2. Restart backend to verify it compiles
3. Regenerate frontend types: `pnpm --filter web codegen`
4. Test in frontend with new types available
