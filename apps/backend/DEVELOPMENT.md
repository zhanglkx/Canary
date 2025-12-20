# Backend Development Guide

## Getting Started

### Installation
```bash
cd apps/backend
pnpm install
```

### Development Server
```bash
pnpm run dev
```

The API will be available at `http://localhost:4000`

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── health/
│   └── health.controller.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── dto/
│       └── auth.dto.ts
└── users/
    ├── users.module.ts
    ├── users.service.ts
    ├── users.controller.ts
    ├── entities/
    │   └── user.entity.ts
    └── dto/
        └── user.dto.ts
```

## Modules

### AppModule
Main module that imports all feature modules:
- AuthModule
- UsersModule
- ConfigModule
- TypeOrmModule

### AuthModule
Handles authentication:
- Login
- Register
- JWT token generation

### UsersModule
User management:
- CRUD operations
- User validation
- Database operations

## Database

### Configuration
SQLite is configured by default for development:
```env
DATABASE_URL=sqlite:./db.sqlite
```

### Entities
- User entity in `src/users/entities/user.entity.ts`

### Migrations
Currently using synchronize mode. For production:
```bash
pnpm run typeorm migration:generate
pnpm run typeorm migration:run
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/login
POST /api/auth/register
```

### Users
```
GET /api/users
GET /api/users/:id
POST /api/users
PATCH /api/users/:id
DELETE /api/users/:id
```

## Authentication

JWT tokens expire in 24 hours. Include token in Authorization header:
```
Authorization: Bearer <token>
```

## Validation

Use `class-validator` decorators:
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

## Error Handling

NestJS exceptions are automatically caught and formatted:
```typescript
throw new ConflictException('User already exists');
throw new NotFoundException('User not found');
throw new UnauthorizedException('Invalid credentials');
```

## Testing

Run tests:
```bash
pnpm run test
pnpm run test:watch
```

E2E tests:
```bash
pnpm run test:e2e
```

## Linting

```bash
pnpm run lint
pnpm run type-check
```

## Build

```bash
pnpm run build
pnpm run start:prod
```

## API Documentation

Swagger documentation available at:
```
http://localhost:4000/api/docs
```

Automatically generated from decorators:
```typescript
@ApiTags('Users')
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() { ... }
}
```

## Environment Variables

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=sqlite:./db.sqlite
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

## Debugging

### NestJS Debug Mode
```bash
pnpm run dev -- --inspect
```

### Database Debugging
Enable logging in `app.module.ts`:
```typescript
TypeOrmModule.forRoot({
  logging: true,
  logger: 'advanced-console',
})
```

### Request Logging
Implement middleware for request logging

## Performance

- Use database indexes on frequently queried fields
- Implement caching for frequently accessed data
- Use DTOs for response serialization
- Implement pagination for large result sets

## Common Issues

### Port 4000 already in use
```bash
lsof -i :4000
kill -9 <PID>
```

### Database locked
```bash
rm db.sqlite
pnpm run dev  # Will recreate
```

### Module not found
```bash
pnpm install
npm run type-check
```

## Resources

- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [Class Validator](https://github.com/typestack/class-validator)
- [Swagger/OpenAPI](https://swagger.io)

## Next Steps

1. Implement password hashing (bcrypt)
2. Add email verification
3. Implement refresh token strategy
4. Add request rate limiting
5. Implement RBAC (Role-based access control)
6. Add comprehensive error handling
7. Set up database migrations
8. Implement audit logging
