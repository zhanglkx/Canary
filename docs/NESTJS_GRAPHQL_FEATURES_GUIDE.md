# NestJS + GraphQL 常见功能和技术完整指南

**项目**: Canary Todo Application
**日期**: 2025-11-03
**版本**: 1.0

## 目录

1. [核心功能清单](#核心功能清单)
2. [鉴权和授权](#鉴权和授权)
3. [数据验证](#数据验证)
4. [文件操作](#文件操作)
5. [分页和筛选](#分页和筛选)
6. [缓存和性能优化](#缓存和性能优化)
7. [错误处理](#错误处理)
8. [请求限流](#请求限流)
9. [日志和监控](#日志和监控)
10. [数据库高级特性](#数据库高级特性)
11. [GraphQL高级特性](#graphql高级特性)
12. [实时功能](#实时功能)
13. [测试](#测试)
14. [部署和安全](#部署和安全)

---

## 核心功能清单

### 已实现功能 ✅
- [x] JWT 认证和授权
- [x] 用户注册和登录
- [x] 基于用户隔离的数据查询
- [x] GraphQL 解析器和服务
- [x] TypeORM 数据库映射
- [x] CORS 跨域配置
- [x] 批量操作
- [x] 高级搜索和筛选
- [x] 统计和分析
- [x] 评论和标签系统

### 待实现功能 📋
- [ ] 刷新令牌（Refresh Token）
- [ ] 角色基础访问控制（RBAC）
- [ ] 文件上传和下载
- [ ] 分页和游标
- [ ] Redis 缓存
- [ ] 请求限流
- [ ] 详细错误处理和验证
- [ ] 审计日志
- [ ] WebSocket 实时功能
- [ ] 软删除

---

## 鉴权和授权

### 1. 刷新令牌实现 (Refresh Token)

**为什么需要**:
- JWT 有过期时间，需要机制获取新令牌
- 防止令牌泄露风险
- 提升用户体验（自动刷新）

**实现计划**:

#### 创建 RefreshToken 实体

```typescript
// apps/api/src/auth/entities/refresh-token.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;

  @Column()
  isRevoked: boolean;

  @ManyToOne(() => User, user => user.refreshTokens, { onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 更新认证服务

```typescript
// apps/api/src/auth/auth.service.ts
async generateTokens(userId: string, email: string) {
  // 访问令牌 (短期)
  const accessToken = this.jwtService.sign(
    { sub: userId, email },
    { expiresIn: '15m' }
  );

  // 刷新令牌 (长期)
  const refreshToken = this.jwtService.sign(
    { sub: userId, type: 'refresh' },
    { expiresIn: '7d' }
  );

  // 存储刷新令牌到数据库
  await this.refreshTokenRepository.save({
    userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: false,
  });

  return { accessToken, refreshToken };
}

async refreshAccessToken(refreshToken: string) {
  try {
    // 验证刷新令牌
    const payload = this.jwtService.verify(refreshToken);

    // 检查是否被撤销
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isRevoked: false }
    });

    if (!storedToken) {
      throw new Error('Refresh token has been revoked');
    }

    // 获取用户信息
    const user = await this.userRepository.findOne(payload.sub);

    // 生成新的访问令牌
    const newAccessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' }
    );

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}

async revokeRefreshToken(refreshToken: string) {
  await this.refreshTokenRepository.update(
    { token: refreshToken },
    { isRevoked: true }
  );
}
```

#### GraphQL 解析器

```typescript
// apps/api/src/auth/auth.resolver.ts
@Mutation(() => AuthResponse)
async refreshToken(@Args('refreshToken') refreshToken: string) {
  const result = await this.authService.refreshAccessToken(refreshToken);
  return result;
}

@Mutation(() => Boolean)
@UseGuards(GqlAuthGuard)
async logout(@CurrentUser() user: User, @Args('refreshToken') refreshToken: string) {
  await this.authService.revokeRefreshToken(refreshToken);
  return true;
}
```

### 2. 角色基础访问控制（RBAC）

**实现步骤**:

#### 创建 Role 枚举和实体扩展

```typescript
// apps/api/src/common/enums/role.enum.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}
```

#### 更新 User 实体

```typescript
// apps/api/src/user/user.entity.ts
@Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
role: UserRole;
```

#### 创建 Role 守卫

```typescript
// apps/api/src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

#### Role 装饰器

```typescript
// apps/api/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/role.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

#### 使用示例

```typescript
// apps/api/src/user/user.resolver.ts
@Query(() => [User])
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async getAllUsers() {
  return this.userService.findAll();
}
```

---

## 数据验证

### 输入 DTO 验证

```typescript
// apps/api/src/auth/dto/register.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @Field()
  @IsString()
  @MinLength(3, { message: '用户名至少3个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: '用户名只能包含字母、数字、下划线和连字符' })
  username: string;

  @Field()
  @IsString()
  @MinLength(8, { message: '密码至少8个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  })
  password: string;
}
```

### 自定义验证器

```typescript
// apps/api/src/common/validators/is-unique.validator.ts
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';

@ValidatorConstraint({ name: 'isUniqueEmail', async: true })
@Injectable()
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(private userService: UserService) {}

  async validate(email: string) {
    const user = await this.userService.findByEmail(email);
    return !user; // 邮箱不存在时返回 true
  }

  defaultMessage() {
    return '邮箱已被注册';
  }
}

export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueEmailConstraint,
    });
  };
}
```

---

## 文件操作

### 文件上传和附件

#### 创建文件模块

```typescript
// apps/api/src/file/file.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Todo } from '../todo/todo.entity';

@Entity('files')
@ObjectType()
export class File {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  filename: string;

  @Column()
  @Field()
  originalName: string;

  @Column()
  @Field()
  mimeType: string;

  @Column()
  @Field()
  size: number;

  @Column()
  @Field()
  path: string;

  @ManyToOne(() => Todo, todo => todo.attachments, { onDelete: 'CASCADE' })
  todo: Todo;

  @Column('uuid')
  todoId: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;
}
```

#### 文件服务

```typescript
// apps/api/src/file/file.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { File } from './file.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    todoId: string,
    userId: string,
  ): Promise<File> {
    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('文件大小不能超过 5MB');
    }

    // 生成唯一文件名
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;

    // 保存文件
    const uploadDir = path.join(process.cwd(), 'uploads', userId);
    await fs.mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);

    // 保存文件记录到数据库
    const fileRecord = this.fileRepository.create({
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: filepath,
      todoId,
    });

    return this.fileRepository.save(fileRecord);
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const file = await this.fileRepository.findOne(fileId);

    if (!file) {
      throw new Error('文件不存在');
    }

    // 删除物理文件
    try {
      await fs.unlink(file.path);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }

    // 删除数据库记录
    await this.fileRepository.delete(fileId);
    return true;
  }

  async getFile(fileId: string): Promise<Buffer> {
    const file = await this.fileRepository.findOne(fileId);

    if (!file) {
      throw new Error('文件不存在');
    }

    return fs.readFile(file.path);
  }
}
```

---

## 分页和筛选

### 通用分页 DTO

```typescript
// apps/api/src/common/dto/pagination.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, Min, Max } from 'class-validator';

@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number = 1;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

@InputType()
export class SortInput {
  @Field()
  field: string;

  @Field()
  direction: 'ASC' | 'DESC';
}
```

### 分页响应类型

```typescript
// apps/api/src/common/types/paginated.type.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export function Paginated<T>(classRef: Type<T>): any {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [classRef])
    items: T[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    totalPages: number;

    @Field(() => Boolean)
    hasNextPage: boolean;
  }

  return PaginatedType;
}
```

### 使用分页

```typescript
// apps/api/src/todo/dto/todos-paginated.type.ts
import { Paginated } from '../../common/types/paginated.type';
import { Todo } from '../todo.entity';
import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TodosPaginated extends Paginated(Todo) {}
```

#### 解析器中使用

```typescript
// apps/api/src/todo/todo.resolver.ts
@Query(() => TodosPaginated)
@UseGuards(GqlAuthGuard)
async todos(
  @CurrentUser() user: User,
  @Args('pagination') pagination: PaginationInput,
  @Args('sort', { nullable: true }) sort?: SortInput,
): Promise<TodosPaginated> {
  const offset = (pagination.page - 1) * pagination.limit;

  let query = this.todoRepository
    .createQueryBuilder('todo')
    .where('todo.userId = :userId', { userId: user.id });

  if (sort) {
    query = query.orderBy(`todo.${sort.field}`, sort.direction);
  }

  const [items, total] = await query
    .skip(offset)
    .take(pagination.limit)
    .getManyAndCount();

  const totalPages = Math.ceil(total / pagination.limit);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
    hasNextPage: pagination.page < totalPages,
  };
}
```

---

## 缓存和性能优化

### Redis 缓存集成

```bash
# 安装依赖
pnpm add @nestjs/cache-manager cache-manager redis
```

#### 缓存模块配置

```typescript
// apps/api/src/cache/cache.module.ts
import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';

@Module({
  imports: [
    NestCacheModule.register<RedisClientOptions>({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 5 * 60 * 1000, // 5 分钟
    }),
  ],
})
export class CacheModule {}
```

#### 使用缓存

```typescript
// apps/api/src/todo/todo.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class TodoService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private todoRepository: Repository<Todo>,
  ) {}

  async getTodoStats(userId: string): Promise<TodoStats> {
    // 尝试从缓存获取
    const cached = await this.cacheManager.get(`todo-stats:${userId}`);
    if (cached) {
      return cached;
    }

    // 计算统计
    const stats = await this.calculateStats(userId);

    // 缓存结果（TTL 10 分钟）
    await this.cacheManager.set(`todo-stats:${userId}`, stats, 10 * 60 * 1000);

    return stats;
  }

  async updateTodo(userId: string, todoId: string, data: any) {
    const todo = await this.todoRepository.save(data);

    // 更新后清除缓存
    await this.cacheManager.del(`todo-stats:${userId}`);
    await this.cacheManager.del(`user-todos:${userId}`);

    return todo;
  }
}
```

### DataLoader 防止 N+1 查询

```typescript
// apps/api/src/common/dataloaders/user.dataloader.ts
import { Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { UserService } from '../../user/user.service';

@Injectable()
export class UserDataLoader {
  constructor(private userService: UserService) {}

  createLoader() {
    return new DataLoader<string, User>(async (userIds) => {
      const users = await this.userService.findByIds(userIds);
      const userMap = new Map(users.map(u => [u.id, u]));
      return userIds.map(id => userMap.get(id));
    });
  }
}
```

---

## 错误处理

### 全局异常过滤器

```typescript
// apps/api/src/common/filters/graphql-exception.filter.ts
import { Catch, ArgumentsHost, HttpException, BadRequestException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof BadRequestException) {
      const response = exception.getResponse();
      const message = Array.isArray(response['message'])
        ? response['message'].join(', ')
        : response['message'];

      return new GraphQLError(message, {
        extensions: {
          code: 'BAD_REQUEST',
          validationErrors: response['validationErrors'],
        },
      });
    }

    if (exception instanceof HttpException) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.getStatus(),
        },
      });
    }

    return new GraphQLError('Internal Server Error', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}
```

### 自定义异常类

```typescript
// apps/api/src/common/exceptions/business.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, code: string = 'BUSINESS_ERROR') {
    super(
      {
        message,
        code,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

// 使用示例
throw new BusinessException('Todo 不存在', 'TODO_NOT_FOUND');
```

---

## 请求限流

### Rate Limiting 实现

```bash
# 安装依赖
pnpm add @nestjs/throttler
```

#### 配置限流

```typescript
// apps/api/src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 秒
        limit: 3, // 3 个请求
      },
      {
        name: 'long',
        ttl: 60000, // 1 分钟
        limit: 100, // 100 个请求
      },
    ]),
    // ... other imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

#### 为特定解析器配置限流

```typescript
// apps/api/src/auth/auth.resolver.ts
import { Throttle } from '@nestjs/throttler';

@Mutation(() => AuthResponse)
@Throttle([{ name: 'short', limit: 5 }]) // 短时间内最多 5 次登录尝试
async login(@Args('loginInput') loginInput: LoginInput) {
  return this.authService.login(loginInput);
}
```

---

## 日志和监控

### 结构化日志

```bash
# 安装依赖
pnpm add winston winston-daily-rotate-file
```

#### 日志配置

```typescript
// apps/api/src/common/logger/logger.service.ts
import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const transport = new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [transport],
    });
  }

  log(message: string, context?: string, data?: any) {
    this.logger.info(message, { context, ...data });
  }

  error(message: string, error?: Error, context?: string) {
    this.logger.error(message, { context, stack: error?.stack });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, data?: any) {
    this.logger.debug(message, data);
  }
}
```

#### 使用日志

```typescript
// apps/api/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private logger: LoggerService,
    private userService: UserService,
  ) {}

  async login(loginInput: LoginInput) {
    this.logger.log('User login attempt', 'AuthService', { email: loginInput.email });

    try {
      const user = await this.userService.findByEmail(loginInput.email);
      this.logger.log('User found', 'AuthService', { userId: user.id });
      // ...
    } catch (error) {
      this.logger.error('Login failed', error, 'AuthService');
      throw error;
    }
  }
}
```

---

## 数据库高级特性

### 软删除

```typescript
// apps/api/src/common/entities/base.entity.ts
import { Column } from 'typeorm';
import { Field } from '@nestjs/graphql';

export class BaseEntity {
  @Column({ nullable: true })
  @Field({ nullable: true })
  deletedAt?: Date;
}

// 使用 SoftDeleteQueryBuilder
const todos = await this.todoRepository
  .createQueryBuilder('todo')
  .withDeleted() // 包含已删除
  .orWhere('todo.deletedAt IS NULL'); // 或只查询未删除
```

### 数据库索引

```typescript
// apps/api/src/todo/todo.entity.ts
import { Index } from 'typeorm';

@Entity('todos')
@Index(['userId', 'completed']) // 复合索引
@Index(['priority']) // 单字段索引
@Index(['dueDate'])
export class Todo {
  // ...
}
```

### 审计日志

```typescript
// apps/api/src/common/entities/auditable.entity.ts
import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class AuditableEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string; // 用户ID

  @Column({ nullable: true })
  updatedBy: string; // 用户ID
}
```

---

## GraphQL 高级特性

### 字段解析器（Field Resolvers）

```typescript
// apps/api/src/todo/todo.entity.ts
@ObjectType()
export class Todo {
  // ... other fields

  @Field()
  @ResolveField(() => Category, { nullable: true })
  async category(@Parent() todo: Todo) {
    // 只在需要时加载 category
    return this.categoryService.findOne(todo.categoryId);
  }
}
```

### GraphQL 复杂类型和联合

```typescript
// apps/api/src/search/types/search-result.type.ts
import { ObjectType, Field, createUnionType } from '@nestjs/graphql';

@ObjectType()
export class TodoResult {
  @Field()
  id: string;
  // ...
}

@ObjectType()
export class CommentResult {
  @Field()
  id: string;
  // ...
}

export const SearchResult = createUnionType({
  name: 'SearchResult',
  types: () => [TodoResult, CommentResult],
  resolveType: (value) => {
    if ('todoId' in value) {
      return CommentResult;
    }
    return TodoResult;
  },
});
```

### GraphQL 查询复杂度分析

```bash
pnpm add graphql-query-complexity
```

```typescript
// apps/api/src/app.module.ts
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { QueryComplexityPlugin, ComplexityEstimatorArgs, ComplexityEstimator } from 'graphql-query-complexity';

const complexityEstimator: ComplexityEstimator = (options: ComplexityEstimatorArgs) => {
  return options.childComplexity * 2;
};

GraphQLModule.forRoot({
  driver: ApolloDriver,
  plugins: [new QueryComplexityPlugin({ estimators: [complexityEstimator], maximumComplexity: 100 })],
})
```

---

## 实时功能

### GraphQL Subscriptions (WebSocket)

```bash
pnpm add @nestjs/subscriptions graphql-ws ws
```

#### 实现实时通知

```typescript
// apps/api/src/subscription/subscription.module.ts
import { Module } from '@nestjs/common';
import { SubscriptionResolver } from './subscription.resolver';

@Module({
  providers: [SubscriptionResolver],
})
export class SubscriptionModule {}
```

```typescript
// apps/api/src/subscription/subscription.resolver.ts
import { Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Todo } from '../todo/todo.entity';

const pubSub = new PubSub();

@Resolver()
export class SubscriptionResolver {
  @Subscription(() => Todo, {
    resolve: (value) => value,
  })
  todoCreated() {
    return pubSub.asyncIterator(['todoCreated']);
  }
}
```

#### 发布事件

```typescript
// apps/api/src/todo/todo.service.ts
import { PubSub } from 'graphql-subscriptions';

export class TodoService {
  constructor(
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  async createTodo(createTodoInput: CreateTodoInput) {
    const todo = await this.todoRepository.save(createTodoInput);

    // 发布事件
    this.pubSub.publish('todoCreated', { todoCreated: todo });

    return todo;
  }
}
```

---

## 测试

### 单元测试

```typescript
// apps/api/src/todo/todo.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TodoService } from './todo.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Todo } from './todo.entity';

describe('TodoService', () => {
  let service: TodoService;
  let repository: Repository<Todo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        {
          provide: getRepositoryToken(Todo),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
    repository = module.get<Repository<Todo>>(getRepositoryToken(Todo));
  });

  it('should create a todo', async () => {
    const createTodoInput = { title: 'Test Todo' };
    const todo = { id: '1', ...createTodoInput };

    jest.spyOn(repository, 'create').mockReturnValue(todo as any);
    jest.spyOn(repository, 'save').mockResolvedValue(todo);

    expect(await service.create(createTodoInput)).toEqual(todo);
  });
});
```

### GraphQL 集成测试

```typescript
// apps/api/src/todo/todo.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('TodoResolver (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should query todos', async () => {
    const query = `{
      todos {
        id
        title
        completed
      }
    }`;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200);

    expect(response.body.data.todos).toBeDefined();
  });
});
```

---

## 部署和安全

### 环境变量管理

```bash
# apps/api/.env.example
NODE_ENV=production
PORT=4000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=secure_password
DATABASE_NAME=canary_prod

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=15m

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/var/uploads

# CORS
FRONTEND_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

### 安全最佳实践

1. **输入验证和消毒**
   ```typescript
   // 使用 class-validator 和 class-transformer
   @UseFilters(ValidationExceptionFilter)
   @UseInterceptors(ClassSerializerInterceptor)
   ```

2. **速率限制**
   - GraphQL 查询复杂度限制
   - 请求频率限制

3. **CORS 配置**
   ```typescript
   app.enableCors({
     origin: process.env.FRONTEND_URL,
     credentials: true,
   });
   ```

4. **HTTPS**
   - 在生产环境使用 SSL/TLS
   - 使用 HSTS 头部

5. **依赖项安全**
   ```bash
   pnpm audit
   pnpm update
   ```

6. **敏感信息保护**
   - 不记录密码
   - 不在错误信息中泄露敏感数据

---

## 实施路线图

### Phase 1: 认证增强 (1-2 天)
- [ ] 实现刷新令牌
- [ ] 添加 RBAC
- [ ] 创建审计日志

### Phase 2: 数据管理 (2-3 天)
- [ ] 实现文件上传
- [ ] 添加分页
- [ ] 软删除支持

### Phase 3: 性能优化 (2 天)
- [ ] Redis 缓存集成
- [ ] DataLoader 实现
- [ ] 数据库索引优化

### Phase 4: 高级特性 (3-4 天)
- [ ] 实时订阅
- [ ] 高级错误处理
- [ ] 请求限流

### Phase 5: 测试和部署 (2-3 天)
- [ ] 单元测试覆盖
- [ ] 集成测试
- [ ] CI/CD 配置

---

## 总结

这份指南涵盖了 NestJS + GraphQL 开发中的核心功能和最佳实践。根据项目需求选择实施，确保代码质量和系统稳定性。

**下一步**:
1. 根据优先级选择功能实施
2. 为每个功能编写测试
3. 更新 API 文档
4. 进行代码审查
5. 部署到测试环境

