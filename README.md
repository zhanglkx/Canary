# 🚀 Canary - Full-Stack Monorepo

A modern full-stack application built with **Next.js 16** and **NestJS 11** using TypeScript 5.3+, featuring SSR, API documentation, authentication, and more.

## 📋 Tech Stack

### Frontend
- **Next.js 16.1** - React framework with App Router
- **React 19.2** - UI library
- **TypeScript 5.3** - Type safety
- **CSS Modules** - Scoped styling
- **Jest + React Testing Library** - Testing
- **Turbopack** - Default bundler (experimental)
- **Partial Pre-Rendering (PPR)** - Performance optimization

### Backend
- **NestJS 11** - Node.js framework
- **TypeORM 0.3** - ORM for database
- **Passport + JWT** - Authentication
- **Swagger 7.4** - API documentation
- **SQLite** - Default database (can switch to PostgreSQL)
- **class-validator** - Data validation
- **Jest** - Testing

### Shared Libraries
- **@canary/shared-types** - Shared TypeScript interfaces
- **@canary/utils** - Common utilities and helpers

### DevOps
- **pnpm 9.15** - Package manager with workspaces
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Turbo** - Monorepo task scheduling

## 📁 Project Structure

```
canary/
├── apps/
│   ├── frontend/           # Next.js 16 app
│   │   ├── src/
│   │   │   ├── app/        # App Router pages
│   │   │   ├── auth/       # Authentication pages
│   │   │   └── dashboard/  # User dashboard
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   └── jest.config.js
│   │
│   └── backend/            # NestJS 11 API
│       ├── src/
│       │   ├── auth/       # Authentication module
│       │   ├── users/      # User management
│       │   ├── health/     # Health check
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── nest-cli.json
│       └── tsconfig.json
│
├── libs/
│   ├── shared-types/       # Shared TypeScript types
│   │   └── src/index.ts
│   │
│   └── utils/              # Shared utilities
│       └── src/index.ts
│
├── docker-compose.yml      # Docker Compose config
├── .env.example            # Environment template
├── pnpm-workspace.yaml     # Workspace config
├── turbo.json              # Turbo config
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20.x or higher
- **pnpm** 9.15+
- **Docker** (optional, for containerized development)

### Local Development Setup

1. **Clone and Install Dependencies**
```bash
# Install dependencies
pnpm install

# Setup environment files
cp .env.example .env
cp apps/backend/.env.local apps/backend/.env
cp apps/frontend/.env.local apps/frontend/.env
```

2. **Development Servers**

Start both frontend and backend in development mode:
```bash
pnpm run dev
```

This starts:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Swagger Docs: `http://localhost:4000/api/docs`

### Running Individual Apps

```bash
# Frontend only
pnpm -F @canary/frontend run dev

# Backend only
pnpm -F @canary/backend run dev

# Or using filter shorthand
pnpm --filter frontend dev
pnpm --filter backend dev
```

## 🏗️ Building for Production

Build all applications:
```bash
pnpm run build
```

Build specific app:
```bash
pnpm -F @canary/frontend build
pnpm -F @canary/backend build
```

## 🧪 Testing

Run all tests:
```bash
pnpm run test
```

Run tests in watch mode:
```bash
pnpm -F @canary/frontend run test:watch
pnpm -F @canary/backend run test:watch
```

## 🔍 Linting & Type Checking

```bash
# Lint all code
pnpm run lint

# Type check all packages
pnpm run type-check

# Format code
pnpm -r exec prettier --write .
```

## 🐳 Docker Development

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This starts:
- PostgreSQL database on `5432`
- Backend API on `4000`
- Frontend on `3000`

## 📚 API Documentation

### Authentication Endpoints

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

### User Endpoints

**Get All Users**
```http
GET /api/users
Authorization: Bearer <token>
```

**Get User by ID**
```http
GET /api/users/{id}
Authorization: Bearer <token>
```

**Create User**
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

**Update User**
```http
PATCH /api/users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Delete User**
```http
DELETE /api/users/{id}
Authorization: Bearer <token>
```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=sqlite:./db.sqlite
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## 📦 Monorepo Commands

### Workspace Management

```bash
# Install dependencies for all packages
pnpm install

# Clean all node_modules and build artifacts
pnpm run clean

# Run command in specific workspace
pnpm -F @canary/frontend run dev
pnpm --filter backend build

# Run command in all workspaces
pnpm -r run lint
pnpm -r --parallel run dev
```

### Available Scripts

| Command | Description |
|---------|------------|
| `pnpm dev` | Start dev servers for frontend & backend |
| `pnpm build` | Build all packages |
| `pnpm start` | Start production servers |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm clean` | Clean all build artifacts |

## 🔧 Configuration Files

### Frontend
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript config
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Code formatting
- `jest.config.js` - Jest testing config

### Backend
- `nest-cli.json` - NestJS CLI config
- `tsconfig.json` - TypeScript config
- `.eslintrc.js` - ESLint rules
- `.prettierrc` - Code formatting

## 🎯 Features & Implementation

### ✅ Implemented
- [x] Next.js 16 frontend with App Router
- [x] NestJS 11 backend with modules architecture
- [x] User authentication (login/register)
- [x] JWT-based authorization
- [x] CRUD user operations
- [x] Swagger API documentation
- [x] Shared type definitions
- [x] Shared utilities library
- [x] Environment configuration
- [x] Docker containerization
- [x] CSS Modules styling
- [x] Type-safe monorepo setup

### 🚧 To Implement
- [ ] Password hashing (bcrypt)
- [ ] Email verification
- [ ] Password reset flow
- [ ] Role-based access control (RBAC)
- [ ] Rate limiting
- [ ] API request logging
- [ ] Database seeding
- [ ] Error handling middleware
- [ ] Request validation
- [ ] Database migrations
- [ ] Frontend state management (Redux/Zustand)
- [ ] Advanced testing (e2e with Cypress/Playwright)

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Database Issues
```bash
# Reset SQLite database
rm apps/backend/db.sqlite

# Restart backend to recreate schema
pnpm -F @canary/backend run dev
```

### Dependencies Issues
```bash
# Clean install
pnpm run clean
pnpm install

# Update dependencies to latest
pnpm update --latest --interactive
```

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [pnpm Workspace](https://pnpm.io/workspaces)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ✨ Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review commit history for examples

---

**Built with ❤️ using Next.js 16 + NestJS 11**

Last Updated: December 2025
