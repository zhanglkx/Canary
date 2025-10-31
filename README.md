# Learning NestJS + Next.js + GraphQL

A full-stack monorepo learning project built with modern technologies: NestJS 10, Next.js 15, GraphQL, TypeScript, PostgreSQL, and Docker.

## Tech Stack

### Backend (NestJS 10)
- **Framework**: NestJS 10
- **API Layer**: GraphQL with Apollo Server
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer

### Frontend (Next.js 15)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **GraphQL Client**: Apollo Client
- **Code Generation**: GraphQL Code Generator
- **UI**: React 19

### DevOps
- **Package Manager**: pnpm 9+
- **Containerization**: Docker & Docker Compose
- **Monorepo**: pnpm workspaces

## Project Structure

```
learning-nest-next/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/        # Authentication module
│   │   │   ├── user/        # User module
│   │   │   ├── todo/        # Todo module
│   │   │   ├── common/      # Shared guards, decorators
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                 # Next.js Frontend
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── lib/         # Apollo Client, utilities
│       │   └── components/  # React components
│       ├── Dockerfile
│       └── package.json
├── libs/
│   └── shared/              # Shared types, constants, utils
│       └── src/
│           ├── types.ts
│           ├── constants.ts
│           └── utils.ts
├── docker-compose.yml       # Production compose
├── docker-compose.dev.yml   # Development compose (DB only)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd learning-nest-next
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

**Backend** (`apps/api/.env`):
```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your configuration.

**Frontend** (`apps/web/.env.local`):
```bash
cp apps/web/.env.local.example apps/web/.env.local
```

### Development

#### Option 1: Local Development (Recommended for learning)

1. Start PostgreSQL with Docker:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. Run the backend:
```bash
pnpm dev:api
```

The API will be available at http://localhost:4000/graphql

3. In a new terminal, run the frontend:
```bash
pnpm dev:web
```

The web app will be available at http://localhost:3000

#### Option 2: Full Docker Setup

```bash
docker-compose up --build
```

This will start:
- PostgreSQL on port 5432
- NestJS API on port 4000
- Next.js web on port 3000

### Scripts

Root level:
- `pnpm install` - Install all dependencies
- `pnpm dev` - Run both API and web in parallel
- `pnpm dev:api` - Run only the API
- `pnpm dev:web` - Run only the web app
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages

API:
- `pnpm --filter api dev` - Run API in watch mode
- `pnpm --filter api build` - Build API
- `pnpm --filter api test` - Run API tests

Web:
- `pnpm --filter web dev` - Run web in dev mode
- `pnpm --filter web build` - Build web for production
- `pnpm --filter web codegen` - Generate GraphQL types

## Features

### Backend Features
- User registration and login with JWT authentication
- GraphQL API with type-safe schema
- Todo CRUD operations with user isolation
- Password hashing with bcrypt
- Database relationships with TypeORM
- Input validation with decorators
- GraphQL Playground for API testing

### Frontend Features
- Modern Next.js 15 App Router
- Apollo Client for GraphQL queries/mutations
- Type-safe GraphQL operations with code generation
- JWT token management
- Responsive design with Tailwind CSS
- Dark mode support

## API Endpoints

### GraphQL Endpoint
- **URL**: http://localhost:4000/graphql
- **Playground**: Available in development mode

### Main Queries
```graphql
query {
  me {
    id
    email
    username
  }

  todos {
    id
    title
    completed
  }
}
```

### Main Mutations
```graphql
mutation Register {
  register(registerInput: {
    email: "user@example.com"
    username: "username"
    password: "password123"
  }) {
    accessToken
    user {
      id
      email
    }
  }
}

mutation CreateTodo {
  createTodo(createTodoInput: {
    title: "My first todo"
    description: "Description here"
  }) {
    id
    title
  }
}
```

## Learning Path

This project is designed for learning. Here's a suggested path:

1. **Setup & Infrastructure**
   - Understand monorepo structure with pnpm workspaces
   - Explore Docker configuration for services
   - Review TypeScript configurations

2. **Backend (NestJS)**
   - Study module architecture (User, Auth, Todo)
   - Learn GraphQL schema-first vs code-first approach
   - Understand decorators and dependency injection
   - Explore JWT authentication with Passport
   - Study TypeORM entities and relationships

3. **Frontend (Next.js)**
   - Learn Next.js 15 App Router patterns
   - Understand Apollo Client setup and usage
   - Study GraphQL Code Generator workflow
   - Explore React 19 features
   - Practice Tailwind CSS utilities

4. **Full-Stack Integration**
   - Connect frontend to GraphQL API
   - Implement authentication flow
   - Build CRUD operations
   - Handle errors and loading states

## Database Schema

### Users Table
- id (UUID, Primary Key)
- email (String, Unique)
- username (String)
- password (String, Hashed)
- createdAt (Timestamp)
- updatedAt (Timestamp)

### Todos Table
- id (UUID, Primary Key)
- title (String)
- description (String, Nullable)
- completed (Boolean)
- userId (UUID, Foreign Key)
- createdAt (Timestamp)
- updatedAt (Timestamp)

## Deployment

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up --build -d
```

2. Check logs:
```bash
docker-compose logs -f
```

3. Stop services:
```bash
docker-compose down
```

### Aliyun ECS Deployment

1. Install Docker and Docker Compose on your ECS instance
2. Clone the repository
3. Update environment variables for production
4. Run with Docker Compose:
```bash
docker-compose up -d
```

5. Set up Nginx as reverse proxy (optional):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /graphql {
        proxy_pass http://localhost:4000/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Check if ports 3000, 4000, or 5432 are already occupied
   - Stop the conflicting process or change the port in configuration

2. **Database connection failed**
   - Ensure PostgreSQL is running
   - Check database credentials in .env file
   - Wait for database health check to pass

3. **Module not found errors**
   - Run `pnpm install` in the root directory
   - Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`

4. **GraphQL schema not found**
   - Ensure the API is running
   - Schema is auto-generated at apps/api/src/schema.gql

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [TypeORM Documentation](https://typeorm.io/)
- [pnpm Documentation](https://pnpm.io/)

## License

MIT

## Contributing

This is a learning project. Feel free to fork and experiment!
