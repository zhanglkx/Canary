# NestJS + GraphQL 项目代码注释指南

## 1. 认证系统 (apps/api/src/auth/)

### auth.module.ts
```typescript
/**
 * 认证模块 - Authentication Module
 * 
 * 功能：
 * 1. JWT 认证集成
 * 2. Passport 策略配置
 * 3. 用户认证服务
 * 
 * 主要组件：
 * - JwtModule: 处理 JWT 令牌
 * - PassportModule: 认证框架
 * - AuthService: 认证业务逻辑
 * - AuthResolver: GraphQL 认证接口
 */
```

### auth.resolver.ts
```typescript
/**
 * 认证解析器 - GraphQL Authentication Resolver
 * 
 * 提供的 GraphQL 操作：
 * 1. login: 用户登录
 * 2. register: 用户注册
 * 3. me: 获取当前用户信息
 * 
 * 使用示例：
 * mutation {
 *   login(loginInput: { email: "user@example.com", password: "password" }) {
 *     accessToken
 *     user { id email }
 *   }
 * }
 */
```

## 2. 待办事项系统 (apps/api/src/todo/)

### todo.entity.ts
```typescript
/**
 * 待办事项实体 - Todo Entity
 * 
 * 展示了 TypeORM 和 GraphQL 的整合：
 * 1. @Entity(): TypeORM 数据库表映射
 * 2. @ObjectType(): GraphQL 类型定义
 * 3. @Field(): GraphQL 字段映射
 * 
 * 字段说明：
 * - id: 唯一标识
 * - title: 标题
 * - description: 描述
 * - completed: 完成状态
 * - priority: 优先级
 * - category: 关联的分类
 * - user: 所属用户
 */
```

### todo.resolver.ts
```typescript
/**
 * 待办事项解析器 - Todo GraphQL Resolver
 * 
 * 提供的操作：
 * 1. Query:
 *    - todos: 获取用户的所有待办事项
 *    - todo(id): 获取单个待办事项
 * 
 * 2. Mutation:
 *    - createTodo: 创建新待办事项
 *    - updateTodo: 更新待办事项
 *    - removeTodo: 删除待办事项
 * 
 * 权限控制：
 * - 使用 @UseGuards(GqlAuthGuard) 确保用户认证
 * - 使用 @CurrentUser() 获取当前用户
 */
```

## 3. 分类管理 (apps/api/src/category/)

### category.entity.ts
```typescript
/**
 * 分类实体 - Category Entity
 * 
 * 功能：
 * 1. 对待办事项进行分类
 * 2. 提供统计信息
 * 
 * 关联关系：
 * - 一个分类属于一个用户（多对一）
 * - 一个分类可以有多个待办事项（一对多）
 */
```

### category.resolver.ts
```typescript
/**
 * 分类解析器 - Category GraphQL Resolver
 * 
 * 提供的功能：
 * 1. 创建分类
 * 2. 更新分类信息
 * 3. 删除分类
 * 4. 查询分类统计
 * 
 * 特色功能：
 * - 自动计算每个分类下的待办事项统计
 * - 支持颜色和图标定制
 */
```

## 4. 用户管理 (apps/api/src/user/)

### user.entity.ts
```typescript
/**
 * 用户实体 - User Entity
 * 
 * 核心功能：
 * 1. 用户信息存储
 * 2. 密码加密
 * 3. 关联数据管理
 * 
 * 关联：
 * - todos: 用户的所有待办事项
 * - categories: 用户创建的所有分类
 */
```

## 5. 前端 GraphQL 集成 (apps/web/src/lib/graphql/)

### queries.ts
```typescript
/**
 * GraphQL 查询定义
 * 
 * 包含：
 * 1. 用户相关查询
 * 2. 待办事项查询
 * 3. 分类查询
 * 
 * 使用 Apollo Client 的 gql 标签模板
 */
```

### mutations.ts
```typescript
/**
 * GraphQL 修改操作定义
 * 
 * 包含：
 * 1. 用户认证操作
 * 2. 待办事项管理
 * 3. 分类管理
 */
```

## 6. Apollo Client 配置 (apps/web/src/lib/)

### apollo-client.ts
```typescript
/**
 * Apollo Client 配置
 * 
 * 功能：
 * 1. GraphQL 请求处理
 * 2. 认证 token 管理
 * 3. 错误处理
 * 4. 缓存配置
 */
```

## 7. 共享工具和类型 (libs/shared/src/)

### types.ts
```typescript
/**
 * 共享类型定义
 * 
 * 包含：
 * 1. API 响应类型
 * 2. 共享接口定义
 * 3. 枚举类型
 */
```

## 使用说明

1. **认证流程**
   - 用户注册/登录
   - 获取 JWT token
   - 在请求头中使用 token

2. **待办事项管理**
   - 创建和管理待办事项
   - 设置优先级和分类
   - 查看统计信息

3. **分类系统**
   - 创建自定义分类
   - 为待办事项分配分类
   - 查看分类统计

## 开发指南

1. **添加新功能**
   - 创建实体（Entity）
   - 实现解析器（Resolver）
   - 添加服务（Service）
   - 更新模块（Module）

2. **GraphQL 开发**
   - 使用 Code First 方式
   - 添加字段装饰器
   - 实现解析器方法

3. **认证集成**
   - 使用 @UseGuards(GqlAuthGuard)
   - 获取当前用户信息
   - 处理认证错误

## 最佳实践

1. **代码组织**
   - 按功能模块分组
   - 保持文件结构一致
   - 使用清晰的命名

2. **类型安全**
   - 使用 TypeScript 装饰器
   - 定义清晰的接口
   - 避免使用 any

3. **错误处理**
   - 使用自定义异常
   - 提供清晰的错误信息
   - 实现全局错误拦截

4. **测试**
   - 单元测试解析器
   - 集成测试 API
   - 端到端测试流程

## 调试技巧

1. **GraphQL Playground**
   - 测试查询和修改
   - 查看 schema 文档
   - 调试认证流程

2. **Apollo Studio**
   - 性能监控
   - 查询分析
   - 错误追踪

希望这个文档能帮助你更好地理解和维护这个项目！