# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Canary** is a full-stack monorepo e-commerce learning platform demonstrating modern web development with NestJS, Next.js, REST API, TypeScript, and PostgreSQL. The project features production-ready patterns including Docker containerization, type safety, and comprehensive e-commerce functionality (product catalog, inventory management, shopping cart, orders, and payment processing).

**Recent Major Change**: Migrated from GraphQL to REST API (all code and comments cleaned, migrations complete)

## Quick Start Commands

### Setup & Installation

```bash
# Install dependencies
pnpm install

# Start PostgreSQL (development database only)
docker-compose -f docker-compose.dev.yml up -d

# Setup environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env as needed
```

### Development

```bash
# Run both API and Web in parallel
pnpm dev

# Run services separately (in different terminals)
pnpm dev:api       # NestJS backend on http://localhost:4000/api
pnpm dev:web       # Next.js frontend on http://localhost:3000

# Building
pnpm build              # Build all packages
pnpm build:api          # Build backend only
pnpm build:web          # Build frontend only
```

### Code Quality

```bash
pnpm lint               # Lint all packages
pnpm test               # Run all tests
pnpm --filter api test              # Backend tests only
pnpm --filter api test:watch        # Backend tests in watch mode
pnpm --filter api test:cov          # Backend tests with coverage
pnpm --filter api test -- inventory.service.spec.ts  # Single test file
```

### Debugging

```bash
pnpm debug:api          # Debug backend with hot reload
pnpm debug:api:brk      # Debug backend and break on first line
pnpm debug:api:prod     # Debug production build (no hot reload)
```

Connect debugger to `127.0.0.1:9229` in your IDE (VS Code, Chrome DevTools)

### Database & Seeding

```bash
# Seed products into database
pnpm --filter api seed:products

# Clear and reseed
pnpm --filter api seed:products:reseed

# Clear seed data
pnpm --filter api seed:products:clear
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
│   ├── api/          # NestJS Backend (REST API)
│   └── web/          # Next.js Frontend (React)
├── libs/
│   ├── shared/       # Shared types, constants, utilities
│   ├── shared-types/ # Dedicated types library
│   └── utils/        # Utility functions
├── docs/             # Comprehensive documentation (50+ files)
├── scripts/          # Utility scripts
└── docker-compose.yml, docker-compose.dev.yml
```

### Technology Stack

**Backend**:
- **Framework**: NestJS 11.0.0 with REST API (migrated from GraphQL)
- **Database**: PostgreSQL 16 with TypeORM 0.3.20 ORM
- **Authentication**: JWT with Passport strategies (JWT & Local)
- **Validation**: class-validator & class-transformer
- **E-Commerce**: Stripe & PayPal payment integration
- **TypeScript**: 5.7.2
- **Testing**: Jest 29.7.0 with Supertest
- **Linting**: ESLint 9.15.0 with Prettier 3.4.2

**Frontend**:
- **Framework**: Next.js 16.1.0 with App Router
- **UI Library**: React 19.2.3
- **Styling**: Less 4.2.0 with CSS Modules
- **HTTP Client**: Axios 1.13.2
- **Icons**: Lucide React 0.552.0
- **TypeScript**: 5.7.2

**DevOps**:
- **Container**: Docker multi-stage builds, Docker Compose
- **Package Manager**: pnpm 9+
- **Deployment**: Aliyun ECS, Docker environments

### Data Flow Architecture

```
Frontend (Next.js + React + Axios)
    ↓ (REST over HTTP)
REST API Layer (NestJS Controllers)
    ↓ (TypeORM queries)
Database Layer (PostgreSQL)
    ↓
Shared Library (@shared package - types & utils)
```

**Key Points**:
- All API communication is REST (no GraphQL)
- JWT tokens in `Authorization: Bearer {token}` headers for authenticated requests
- CORS enabled for localhost:3000, localhost:3001, localhost:3002, and 8.159.144.140 (Aliyun)
- Global API prefix: `/api`
- Development: pnpm hot-reload enabled for both services

## NestJS Backend Architecture

### Entry Point & Configuration

**Main Entry** (`apps/api/src/main.ts`):
- Creates NestJS app instance
- Enables CORS for frontend hosts
- Sets global API prefix `/api`
- Applies global validation pipe (class-validator)
- Listens on port 4000 (configurable via `PORT` env var)

**Root Module** (`apps/api/src/app.module.ts`):
- ConfigModule configured globally for environment variables
- TypeORM configured with PostgreSQL connection
- Database auto-synchronization enabled in development (synchronize: true)
- All feature modules imported and registered

### Module Organization

Each feature follows the NestJS module pattern:

```
Feature Module (e.g., ProductModule)
├── Controller (HTTP request handling)
├── Service (Business logic, @Injectable)
├── Entity (TypeORM + database model)
├── DTO (Request/Response validation)
└── Module (DI configuration)
```

### Key Modules & Their APIs

**AuthModule** (`apps/api/src/auth/`):
- User registration and login with JWT tokens
- JWT token generation and validation
- Multi-device session support with refresh tokens
- Endpoints:
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `POST /api/auth/refresh` - Token refresh
  - `POST /api/auth/logout` - Revoke single device
  - `POST /api/auth/logout-all` - Revoke all devices

**UserModule** (`apps/api/src/user/`):
- User profile management
- User CRUD operations
- Endpoints:
  - `GET /api/users/profile` - Get authenticated user profile
  - `GET /api/users/:id` - Get user by ID
  - `PUT /api/users/:id` - Update user

**TodoModule** (`apps/api/src/todo/`):
- Todo CRUD with user isolation
- Priority enum (LOW, MEDIUM, HIGH, URGENT)
- Optional category relationship
- Endpoints:
  - `GET /api/todos` - List user's todos
  - `POST /api/todos` - Create todo
  - `PATCH /api/todos/:id` - Update todo
  - `DELETE /api/todos/:id` - Delete todo

**CategoryModule** (`apps/api/src/category/`):
- Category management for organizing todos
- One-to-many relationship (Category → Todos)
- Endpoints:
  - `GET /api/categories` - List user's categories
  - `POST /api/categories` - Create category
  - `PATCH /api/categories/:id` - Update category
  - `DELETE /api/categories/:id` - Delete category

**TagModule** (`apps/api/src/tag/`):
- Tag system for organizing todos
- Many-to-many relationship (Tag ↔ Todo)
- Endpoints:
  - `GET /api/tags` - List user's tags
  - `POST /api/tags` - Create tag
  - `POST /api/tags/:id/todos/:todoId` - Add tag to todo
  - `DELETE /api/tags/:id/todos/:todoId` - Remove tag from todo

**SearchModule** (`apps/api/src/search/`):
- Full-text search across todos
- Advanced filtering by priority, completion status, category, tags
- Endpoints:
  - `GET /api/search/todos` - Search todos with filters

**StatsModule** (`apps/api/src/stats/`):
- Todo statistics (total, completed, percentages)
- Priority distribution and overdue task counts
- Endpoints:
  - `GET /api/stats/dashboard` - Get all statistics

**CommentModule** (`apps/api/src/comment/`):
- Comments/discussions on todos
- Author-only delete permissions
- Endpoints:
  - `GET /api/comments` - List comments
  - `POST /api/comments` - Create comment
  - `DELETE /api/comments/:id` - Delete comment

**EcommerceModule** (`apps/api/src/ecommerce/`) ⭐ **MAIN FEATURE**:

Complete e-commerce system with 5 sub-modules:

- **ProductModule**: Product catalog, SKUs, images, categories, attributes
  - `GET /api/products` - List products with filtering
  - `GET /api/products/:id` - Get product details
  - `POST /api/products` - Create product (admin)
  - `PATCH /api/products/:id` - Update product (admin)
  - `DELETE /api/products/:id` - Delete product (admin)

- **InventoryModule**: Stock management with optimistic locking (concurrency control)
  - `GET /api/inventory/sku/:skuId` - Get SKU inventory
  - `PATCH /api/inventory/sku/:skuId` - Update stock

- **CartModule**: Shopping cart management with persistence
  - `GET /api/cart` - Get user's cart
  - `POST /api/cart/items` - Add item to cart
  - `PATCH /api/cart/items/:itemId` - Update cart item quantity
  - `DELETE /api/cart/items/:itemId` - Remove item from cart
  - `DELETE /api/cart` - Clear cart

- **OrderModule**: Order processing and history
  - `GET /api/orders` - List user's orders
  - `GET /api/orders/:id` - Get order details
  - `POST /api/orders` - Create order from cart
  - `PATCH /api/orders/:id/status` - Update order status

- **PaymentModule**: Multi-gateway payment processing
  - `POST /api/payments` - Process payment (Stripe/PayPal)
  - `POST /api/payments/webhook/stripe` - Stripe webhook
  - `POST /api/payments/webhook/paypal` - PayPal webhook
  - `GET /api/payments/:id` - Get payment details

### Authentication Flow

1. User calls `POST /api/auth/register` or `POST /api/auth/login`
2. LocalStrategy validates credentials via Passport
3. AuthService generates JWT token pair (access + refresh tokens)
4. TokenService stores refresh token in database with device metadata
5. Response includes both tokens with expiration times (access: 15min, refresh: 7 days)
6. Frontend stores tokens in localStorage
7. Subsequent requests: `Authorization: Bearer {accessToken}` header
8. Passport JWT middleware validates token signature and expiration
9. @CurrentUser() decorator injects authenticated user from JWT payload
10. When access token expires: Frontend calls `POST /api/auth/refresh` with refresh token
11. Multi-device support: Each device/session tracked separately for targeted logout

### E-Commerce System Architecture

**Key Patterns**:

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
- TypeORM QueryBuilder with eager loading to prevent N+1 queries
- Indexed queries on userId, SKU, and order status
- Composite database indexes: (userId, isRevoked), (productId, stock), (orderId, status)

### REST API Request/Response Flow

```
Frontend sends HTTP request (GET/POST/PATCH/DELETE)
    ↓
NestJS routing matches controller method
    ↓
Passport middleware validates JWT token (if @UseGuards applied)
    ↓
Controller method executes (Service is injected via DI)
    ↓
Service calls Repository (TypeORM)
    ↓
TypeORM executes SQL query on PostgreSQL
    ↓
Result returned through controller → HTTP response (JSON)
```

### Common Module & Utilities

**GqlAuthGuard** (now RestAuthGuard):
- Intercepts HTTP requests
- Validates JWT from Authorization header
- Extracts user from token payload

**@CurrentUser() Decorator**:
- Injects authenticated user into controller methods
- Works across all protected endpoints

**Common Guards & Decorators** (`apps/api/src/common/`):
- Custom authentication guards
- Parameter extraction decorators
- Shared utilities and types

## Next.js Frontend Architecture

### File Structure

```
apps/web/src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with Providers
│   ├── page.tsx                 # Home page
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx        # Registration page
│   ├── dashboard/page.tsx       # Protected dashboard
│   ├── todos/page.tsx           # Todo management
│   ├── categories/page.tsx      # Category management
│   ├── shop/page.tsx            # E-commerce product listing
│   ├── product/[id]/page.tsx    # Product detail
│   ├── cart/page.tsx            # Shopping cart interface
│   ├── checkout/page.tsx        # Checkout/order creation
│   ├── orders/page.tsx          # Order history and tracking
│   └── profile/page.tsx         # User profile
├── components/
│   ├── layout/                  # Layout components (navbar, footer)
│   ├── features/                # Feature-specific components (e-commerce, todos)
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── axios-client.ts          # Axios HTTP client configuration
│   ├── auth-context.tsx         # React Context for auth state
│   └── api/                     # API request utilities
│       ├── auth/                # Auth API calls
│       ├── todos/               # Todo API calls
│       ├── ecommerce/           # E-commerce API calls
│       └── ...
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
└── styles/                       # Global styles (Less)
```

### State Management

**Axios Client**: Handles all HTTP requests with automatic interceptors
- Request interceptor: Adds JWT token to Authorization header
- Response interceptor: Handles token refresh and error responses
- Centralized in `lib/axios-client.ts`

**Auth Context** (`lib/auth-context.tsx`):
- Manages authentication state (user, token, isAuthenticated)
- Token stored in localStorage for persistence
- Provides useAuth() hook for component access

**Protected Routes**:
- Redirect unauthenticated users to login
- Middleware checks token validity

### Key Patterns

**Page-level Data Fetching**:
- Use `useEffect` with axios for data fetching
- Loading and error states
- Conditional rendering based on auth

**Protected Pages**:
- Check auth token and redirect if needed
- Use custom hooks for auth verification

**Less Styling with CSS Modules**:
- Per-page and per-component `.module.less` files
- Scoped styles prevent conflicts
- Less features: variables, mixins, nesting

### Styled Components Integration

The project uses **Less + CSS Modules** for styling:
- Global styles in `styles/global.less`
- Component-level styles in `[Component].module.less`
- Configured in `next.config.ts` with custom webpack rules

## Database Schema & TypeORM Entities

### Core Entities

**User Entity** (`apps/api/src/user/entities/user.entity.ts`):
- `id`: UUID primary key
- `email`: String, unique
- `username`: String
- `password`: String, hashed with bcryptjs
- `createdAt`, `updatedAt`: Timestamps
- Relations: One User → Many Todos, Categories, Comments, etc.

**Todo Entity** (`apps/api/src/todo/entities/todo.entity.ts`):
- `id`: UUID primary key
- `title`: String, required
- `description`: String, optional
- `completed`: Boolean (default: false)
- `priority`: Enum (LOW, MEDIUM, HIGH, URGENT)
- `dueDate`: Timestamp, optional
- `userId`: UUID foreign key
- `categoryId`: UUID foreign key (optional)
- `createdAt`, `updatedAt`: Timestamps
- Relations: Many Todos → One User, One Category

**Category Entity** (`apps/api/src/category/entities/category.entity.ts`):
- `id`: UUID primary key
- `name`: String
- `color`: String (hex color)
- `icon`: String (emoji or icon name)
- `userId`: UUID foreign key
- `createdAt`, `updatedAt`: Timestamps
- Relations: One Category → Many Todos

### E-Commerce Entities

**Product**, **ProductSku**, **ProductImage**, **ProductAttribute**, **ShoppingCart**, **ShoppingCartItem**, **Order**, **OrderItem**, **PaymentTransaction**

**Auto-migration**: Development mode has `synchronize: true` in TypeORM config to auto-sync schema changes

## Environment Configuration

### Setup

1. **Backend**: Copy `.env.example` to `.env` in `apps/api/`:
```bash
cp apps/api/.env.example apps/api/.env
```

2. **Frontend**: Environment is auto-configured for Next.js dev/build

### Backend Environment Variables (.env)

```env
NODE_ENV=development
PORT=4000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=learning_nest_next
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=900           # 15 minutes in seconds
JWT_REFRESH_EXPIRATION=604800 # 7 days in seconds
DEBUG_PORT=9229
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
```

### Frontend Environment (Next.js)

Configured via build args and runtime environment:
- `NEXT_PUBLIC_API_URL`: API base URL (build-time)
- `NODE_ENV`: Environment mode

## Common Development Tasks

### Add a New REST Endpoint

1. Create/update controller in `apps/api/src/[module]/[module].controller.ts`
2. Define endpoint method with `@Get()`, `@Post()`, `@Patch()`, or `@Delete()` decorator
3. Inject service via constructor
4. Return response (NestJS auto-serializes to JSON)
5. Restart backend (auto-reload with `pnpm dev:api`)
6. Call endpoint from frontend via axios

Example (Backend):
```typescript
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  async getProducts(@Query() filters: FilterDto) {
    return this.productService.findAll(filters);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: User) {
    return this.productService.create(dto, user.id);
  }
}
```

Example (Frontend):
```typescript
const { data } = await axiosClient.get('/products', { params: filters });
```

### Add Authentication to Endpoints

Protect endpoints requiring authentication:

```typescript
@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)  // Add this guard
  async protectedEndpoint(@CurrentUser() user: User) {
    // Only authenticated users reach here
    return { user };
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

// In service:
async addTagToTodo(todoId: string, tagId: string): Promise<Todo> {
  const todo = await this.todoRepository.findOneBy({ id: todoId });
  const tag = await this.tagRepository.findOneBy({ id: tagId });
  todo.tags.push(tag);
  return this.todoRepository.save(todo);
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
2. Use TypeORM decorators (@Entity, @Column, @OneToMany, @ManyToOne, etc.)
3. Create service (`[entity].service.ts`) with CRUD logic
4. Create controller (`[entity].controller.ts`) with HTTP endpoints
5. Create module (`[entity].module.ts`) registering providers
6. Schema auto-syncs in development (check database logs)

### Implementing JWT Token Refresh Flow

When modifying auth flows or creating new authenticated endpoints:

1. **Protect Controller Method**: Add `@UseGuards(JwtAuthGuard)` and `@CurrentUser()` decorator:
```typescript
@Controller('protected')
export class ProtectedController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<UserProfileDto> {
    return this.userService.getProfile(user.id);
  }
}
```

2. **Use TokenService for token operations**: Inject and use for token management
```typescript
constructor(private tokenService: TokenService) {}

const tokens = await this.tokenService.generateTokenPair(user, userAgent, ipAddress);
```

3. **Frontend Token Refresh**: Handled automatically via Axios interceptor with built-in refresh logic

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

### Deployment to Aliyun ECS

See `docs/deployment/HOW_TO_DEPLOY.md` and `docs/deployment/ALIYUN_DEPLOYMENT_GUIDE.md` for detailed steps.

Quick deployment:
```bash
./deploy.sh
```

Access deployed application:
- Frontend: http://8.159.144.140
- API: http://8.159.144.140/api
- Health check: http://8.159.144.140/health

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

- **pnpm-workspace.yaml**: Defines monorepo packages (`apps/*`, `libs/*`)
- **tsconfig.base.json**: Base TypeScript config with path aliases (`@shared`)
- **apps/api/tsconfig.json**: Backend-specific config (less strict for decorators)
- **apps/web/tsconfig.json**: Frontend-specific config (stricter)
- **apps/api/.env.example**: Backend environment template
- **next.config.ts**: Frontend webpack config (Less support, API URL config)

## Important Notes

### TypeScript & Type Safety
- Strict mode enabled in frontend, more lenient in backend for decorator flexibility
- Shared types in `@shared` library ensure consistency across apps
- REST API removes need for code generation (types defined in DTOs)

### Security Considerations
- CORS restricted to specific hosts (localhost:3000, Aliyun IP)
- JWT secrets via environment variables (never hardcoded)
- Passwords hashed with bcryptjs
- Protected endpoints use JwtAuthGuard and @CurrentUser()
- User queries filtered by authenticated user ID (user isolation)
- Payment processing: Stripe & PayPal webhook validation

### Development Workflow
- Use separate terminals for `pnpm dev:api` and `pnpm dev:web` (or use `pnpm dev` for both)
- Hot-reload enabled in both backend and frontend
- Database schema auto-syncs in development mode (watch logs for schema changes)
- Test changes quickly: `pnpm test` for unit tests or specific test file with Jest

### Key Architectural Patterns
- **Repository Pattern**: Services use injected repositories for data access
- **Dependency Injection**: NestJS DI container manages all providers
- **RESTful Design**: Standard HTTP methods and status codes
- **User Isolation**: All user queries filtered by authenticated user ID (multi-tenant safety)
- **Service Layer**: Business logic separation from HTTP layer
- **Middleware & Guards**: Passport JWT for authentication

### Performance & Scalability
- pnpm hoisted dependencies reduce disk usage
- Docker multi-stage builds minimize container sizes
- TypeORM query optimization with proper indexing and eager loading
- User data isolation ensures multi-tenant safety
- Optimistic locking (inventory) prevents overselling in high-concurrency scenarios
- Composite database indexes for frequently queried combinations

## Documentation & References

### Key Documentation Files
- **docs/architecture/ARCHITECTURE.md** - General architecture overview
- **docs/architecture/BACKEND_ARCHITECTURE_GUIDE.md** - NestJS architecture details
- **docs/architecture/ECOMMERCE_ARCHITECTURE.md** - E-commerce module design
- **docs/deployment/HOW_TO_DEPLOY.md** - Deployment guide
- **docs/troubleshooting/DEBUG_SETUP.md** - Detailed debugging guide
- **docs/ecommerce/ECOMMERCE_IMPLEMENTATION_ROADMAP.md** - E-commerce phases overview
- **docs/project-management/FEATURES.md** - Feature list and learning path
- **docs/project-management/PROJECT_COMPLETION_SUMMARY.md** - Project status

### API Documentation
- REST API runs on `http://localhost:4000/api` (development)
- Swagger/OpenAPI docs: Available at `/api/swagger` when enabled
- All endpoints require appropriate auth guards

### Common Deployment Commands
```bash
# SSH to Aliyun server
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# View container logs
docker logs canary-api-prod -f
docker logs canary-web-prod -f

# Restart services
cd /opt/canary
docker compose -f docker-compose.prod.yml --env-file .env.production restart
```

## Troubleshooting

### Port Conflicts
If ports 3000, 4000, or 5432 are already in use:
```bash
# Find process using port
lsof -i :4000

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

### Hot Reload Not Working
1. Ensure you're using `pnpm dev:api` (not `pnpm build`)
2. Check file system permissions for watched directories
3. Try restarting the development server

### REST API Endpoints Not Responding
1. Verify API is running: `curl http://localhost:4000/health`
2. Check API logs: `pnpm dev:api` terminal
3. Verify authentication tokens are correct
4. Check CORS configuration in `apps/api/src/main.ts`

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
When modifying backend entities or endpoints:
1. Make changes to backend in `apps/api/src/`
2. Restart backend to verify it compiles: `pnpm dev:api`
3. Test endpoint behavior manually or with unit tests
4. Verify frontend can call the endpoint via axios

## Current Branch & Status

**Current Branch**: `feature/rest-api-migration` (clean working tree)
**Main Branch**: `main`
**Status**: REST API migration complete, all GraphQL code removed, project ready for feature development

Recent milestones:
- Migrated from GraphQL to REST API
- Updated styling to Less
- Resolved all TypeScript compilation errors
- Deployed to Aliyun ECS
