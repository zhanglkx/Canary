# NestJS + GraphQL 项目结构说明

## 项目概览

这是一个基于 NestJS 和 GraphQL 构建的现代全栈应用程序。项目采用 monorepo 结构，使用 pnpm workspace 管理多个包。

## 目录结构

```
apps/
  ├── api/                # NestJS 后端应用
  │   ├── src/
  │   │   ├── app.module.ts          # 主模块配置
  │   │   ├── auth/                  # 认证模块
  │   │   ├── user/                  # 用户模块
  │   │   ├── todo/                  # 待办事项模块
  │   │   └── category/              # 分类模块
  │   └── package.json
  │
  └── web/                # Next.js 前端应用
      ├── src/
      │   ├── app/                   # 页面组件
      │   ├── components/            # 共享组件
      │   └── lib/                   # 工具函数
      └── package.json

libs/
  └── shared/            # 共享代码库
```

## 核心模块说明

### 1. 认证模块 (auth/)

认证模块处理用户的身份验证和授权：

- `auth.module.ts` - 模块配置
- `auth.resolver.ts` - GraphQL 解析器
- `auth.service.ts` - 业务逻辑
- `strategies/` - Passport 策略

### 2. 用户模块 (user/)

管理用户相关功能：

- `user.entity.ts` - 用户实体定义
- `user.resolver.ts` - 用户查询和修改
- `user.service.ts` - 用户服务

### 3. 待办事项模块 (todo/)

核心业务逻辑：

- `todo.entity.ts` - 待办事项实体
- `todo.resolver.ts` - GraphQL 操作
- `todo.service.ts` - 业务逻辑
- `dto/` - 数据传输对象

### 4. 分类模块 (category/)

待办事项分类管理：

- `category.entity.ts` - 分类实体
- `category.resolver.ts` - 分类操作
- `category.service.ts` - 分类服务

## 关键文件详解

### 1. app.module.ts

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),      // 环境配置
    GraphQLModule.forRoot(),     // GraphQL 设置
    TypeOrmModule.forRoot(),     // 数据库配置
    AuthModule,                  // 认证模块
    UserModule,                  // 用户模块
    TodoModule,                  // 待办事项模块
    CategoryModule,              // 分类模块
  ]
})
```

### 2. todo.resolver.ts

```typescript
@Resolver(() => Todo)
export class TodoResolver {
  @Query(() => [Todo])
  async todos() { ... }        // 查询所有待办事项

  @Mutation(() => Todo)
  async createTodo() { ... }   // 创建待办事项
}
```

### 3. auth.service.ts

```typescript
export class AuthService {
  async validateUser() { ... }  // 用户验证
  async login() { ... }        // 用户登录
  async register() { ... }     // 用户注册
}
```

## GraphQL 类型系统

### 1. 实体定义

```typescript
@ObjectType()
export class Todo {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;
}
```

### 2. 输入类型

```typescript
@InputType()
export class CreateTodoInput {
  @Field()
  title: string;
}
```

### 3. 响应类型

```typescript
@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}
```

## 开发工具集成

1. **GraphQL Playground**
   - 访问路径：`/graphql`
   - 用途：API 测试和文档

2. **Apollo Studio**
   - 访问路径：`/apollo-studio`
   - 功能：高级 API 开发工具

## 认证流程

1. 用户注册/登录
2. 获取 JWT Token
3. 在后续请求中使用 Token

```graphql
mutation Login {
  login(loginInput: {
    email: "user@example.com"
    password: "password123"
  }) {
    accessToken
    user {
      id
      email
    }
  }
}
```

## 数据关系

1. **User - Todo**: 一对多
2. **User - Category**: 一对多
3. **Todo - Category**: 多对一

## 开发建议

1. 使用 TypeScript 装饰器
2. 保持代码模块化
3. 遵循 GraphQL 最佳实践
4. 实现适当的错误处理
5. 添加完整的测试覆盖

## 部署考虑

1. 环境变量配置
2. 数据库迁移
3. API 文档生成
4. 性能监控
5. 错误追踪

## 学习资源

1. [NestJS 官方文档](https://docs.nestjs.com)
2. [GraphQL 官方文档](https://graphql.org)
3. [TypeORM 文档](https://typeorm.io)
4. [Apollo Server 文档](https://www.apollographql.com/docs/apollo-server)

这个项目结构说明旨在帮助开发者快速理解项目架构和关键概念。建议先阅读本文档，再深入研究具体的代码实现。