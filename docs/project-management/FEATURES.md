# 项目功能详解

这是一个为 GraphQL + NestJS + Next.js 初学者设计的完整学习项目。

## 🎯 项目目标

帮助初学者理解和学习：
- GraphQL API 设计和实现
- NestJS 框架架构和模式
- Next.js 前端开发
- 数据库设计和 ORM 使用
- 认证和授权
- 实时通信（评论、通知）

## ✨ 核心功能模块

### 1. 用户认证模块 (Auth Module)

**文件位置**: `apps/api/src/auth/`

**功能**:
- 用户注册 (Register)
- 用户登录 (Login)
- JWT Token 生成和验证
- 本地密码验证策略

**学习重点**:
- 如何实现 Passport 认证策略
- JWT Token 的生成、验证和使用
- 密码加密 (bcryptjs)
- GraphQL 中的认证守卫 (@UseGuards)

**GraphQL 操作示例**:
```graphql
# 注册
mutation {
  register(registerInput: {
    email: "user@example.com"
    username: "username"
    password: "password123"
  }) {
    accessToken
    user { id email username }
  }
}

# 登录
mutation {
  login(loginInput: {
    email: "user@example.com"
    password: "password123"
  }) {
    accessToken
    user { id email }
  }
}

# 获取当前用户
query {
  me {
    id email username todos { id title }
  }
}
```

---

### 2. 用户管理模块 (User Module)

**文件位置**: `apps/api/src/user/`

**功能**:
- 创建用户
- 查询用户信息
- 获取用户的待办事项列表

**学习重点**:
- NestJS 中的 Service 和 Resolver 层级
- 一对多关系的实现 (User → Todos)
- 依赖注入

---

### 3. 待办事项模块 (Todo Module)

**文件位置**: `apps/api/src/todo/`

**功能**:
- 创建待办事项
- 修改待办事项
- 删除待办事项
- 标记完成/未完成
- 优先级设置 (LOW, MEDIUM, HIGH, URGENT)
- 截止日期设置

**学习重点**:
- 枚举类型 (Priority)
- GraphQL @ObjectType 装饰器
- 数据验证 (DTO)
- 业务逻辑与 API 层的分离

**GraphQL 操作示例**:
```graphql
# 创建待办事项
mutation {
  createTodo(createTodoInput: {
    title: "完成项目文档"
    description: "需要写 README 和 API 文档"
    priority: HIGH
    dueDate: "2024-12-31"
  }) {
    id title priority dueDate
    category { name }
    tags { name }
    comments { content author { username } }
  }
}

# 查询用户的所有待办事项
query {
  todos {
    id title completed priority
    user { username }
    category { name }
    tags { id name color }
    comments { id content }
  }
}
```

---

### 4. 分类模块 (Category Module)

**文件位置**: `apps/api/src/category/`

**功能**:
- 创建分类
- 管理分类
- 获取分类统计信息

**学习重点**:
- 一对多关系 (Category → Todos)
- GraphQL 中的聚合查询
- 业务逻辑计算

---

### 5. 评论模块 (Comment Module) ⭐ NEW

**文件位置**: `apps/api/src/comment/`

**功能**:
- 在待办事项上添加评论
- 更新评论
- 删除评论（仅作者可删除）
- 获取待办事项的所有评论

**学习重点**:
- 一对多关系 (Todo → Comments)
- 权限检查和授权
- 创建时间和更新时间的自动管理

**数据库关系**:
```
User (1) ←→ (N) Comment
Todo (1) ←→ (N) Comment
```

**GraphQL 操作示例**:
```graphql
# 为 Todo 添加评论
mutation {
  createComment(createCommentInput: {
    content: "这个任务需要和 PM 确认需求"
    todoId: "todo-uuid"
  }) {
    id content createdAt
    author { username }
  }
}

# 查询 Todo 的所有评论
query {
  comments(todoId: "todo-uuid") {
    id content
    author { username email }
    createdAt updatedAt
  }
}

# 更新评论
mutation {
  updateComment(id: "comment-uuid", content: "更新后的内容") {
    id content updatedAt
  }
}
```

---

### 6. 标签系统 (Tag Module) ⭐ NEW

**文件位置**: `apps/api/src/tag/`

**功能**:
- 创建标签
- 添加标签到待办事项
- 从待办事项移除标签
- 删除标签
- 查询用户的所有标签

**学习重点**:
- **多对多关系** (Many-to-Many) - 最重要的学习点！
- 联接表 (Junction Table) 的自动创建
- @ManyToMany 和 @JoinTable 装饰器

**数据库关系**:
```
Tag (N) ←→ (N) Todo
       ↓
   联接表 (自动创建)
```

**为什么是多对多？**
- 一个标签可以被多个 Todo 使用 (例如 "紧急" 标签)
- 一个 Todo 可以有多个标签 (例如 "紧急"、"后端"、"重要")

**GraphQL 操作示例**:
```graphql
# 创建标签
mutation {
  createTag(createTagInput: {
    name: "紧急"
    color: "#FF5733"
  }) {
    id name color
  }
}

# 为 Todo 添加标签（体现多对多关系）
mutation {
  addTagToTodo(tagId: "tag-uuid", todoId: "todo-uuid") {
    id title
    tags { id name color }
  }
}

# 从 Todo 移除标签
mutation {
  removeTagFromTodo(tagId: "tag-uuid", todoId: "todo-uuid") {
    id title tags { id name }
  }
}

# 查询用户的所有标签
query {
  tags {
    id name color
    todos { id title }
  }
}
```

---

### 7. 搜索和过滤模块 (Search Module) ⭐ NEW

**文件位置**: `apps/api/src/search/`

**功能**:
- 按关键词搜索 (全文搜索)
- 按优先级过滤
- 按完成状态过滤
- 按分类过滤
- 按标签过滤
- 高级搜索（多条件组合）

**学习重点**:
- GraphQL InputType (输入类型)
- QueryBuilder - 复杂数据库查询
- ILIKE - 模糊匹配（数据库不敏感大小写）
- 多条件组合查询

**GraphQL 操作示例**:
```graphql
# 简单搜索
query {
  searchTodos(filter: {
    keyword: "项目"
    priority: HIGH
    completed: false
  }) {
    id title priority completed
  }
}

# 高级搜索
query {
  advancedSearch(
    keyword: "需求"
    priorities: [URGENT, HIGH]
    sortBy: "dueDate"
  ) {
    id title priority dueDate
  }
}
```

---

### 8. 统计和分析模块 (Stats Module) ⭐ NEW

**文件位置**: `apps/api/src/stats/`

**功能**:
- 待办事项统计 (总数、完成数、未完成数、完成百分比)
- 优先级分布统计
- 逾期任务统计
- 分类统计
- 仪表板数据（综合统计）

**学习重点**:
- 数据聚合查询
- 复杂的计算逻辑
- GraphQL ObjectType - 自定义返回类型

**GraphQL 操作示例**:
```graphql
# 获取待办事项统计
query {
  todoStats {
    total
    completed
    pending
    completionPercentage
    urgentCount
    highCount
    mediumCount
    lowCount
    overdueCount
  }
}

# 获取分类统计
query {
  categoryStats {
    categoryName
    totalTodos
    completedTodos
  }
}

# 获取完整仪表板数据
query {
  dashboard {
    todoStats {
      total completed completionPercentage
    }
    categoryStats {
      categoryName totalTodos
    }
    recentTodosCount
  }
}
```

---

## 🏗️ 项目架构

### 后端架构 (NestJS)

```
AppModule
├── AuthModule (认证)
├── UserModule (用户)
├── TodoModule (待办)
├── CategoryModule (分类)
├── CommentModule (评论) ⭐
├── TagModule (标签) ⭐
├── StatsModule (统计) ⭐
└── SearchModule (搜索) ⭐
```

### 分层架构

每个功能模块都遵循 NestJS 的标准分层架构：

```
Module
├── Entity (数据库模型)
├── Service (业务逻辑)
├── Resolver (GraphQL 端点)
├── DTO (数据验证)
└── Module (模块定义)
```

### 数据库关系

```
User (1) ←→ (N) Todo (一用户多待办)
  ↓
User (1) ←→ (N) Category (一用户多分类)
  ↓
User (1) ←→ (N) Comment (一用户多评论)
  ↓
User (1) ←→ (N) Tag (一用户多标签)

Todo (1) ←→ (N) Comment (一待办多评论)
Todo (N) ←→ (N) Tag (待办与标签多对多)
Category (1) ←→ (N) Todo (一分类多待办)
```

---

## 🚀 快速开始

### 1. 启动后端

```bash
# 启动 PostgreSQL 数据库
docker-compose -f docker-compose.dev.yml up -d

# 启动 NestJS 后端
pnpm dev:api

# 访问 Apollo Studio
# http://localhost:4000/apollo-studio
```

### 2. 启动前端

```bash
# 在另一个终端启动 Next.js 前端
pnpm dev:web

# 访问前端
# http://localhost:3000
```

---

## 📚 学习路径

### 第一阶段：理解 GraphQL 基础
1. 访问 Apollo Studio: http://localhost:4000/apollo-studio
2. 查看 GraphQL Schema（Documentation）
3. 尝试注册和登录
4. 尝试创建待办事项

### 第二阶段：理解关系映射
1. 创建分类和待办事项
2. 理解一对多关系
3. 添加标签到待办事项
4. 理解多对多关系

### 第三阶段：高级功能
1. 添加评论到待办事项
2. 使用搜索功能过滤
3. 查看统计数据
4. 理解权限控制

### 第四阶段：前端集成
1. 查看如何在 Next.js 中使用 Apollo Client
2. 理解认证 Token 的传递
3. 实现完整的 CRUD 操作

---

## 💡 关键学习概念

### 1. GraphQL vs REST

**REST API** (传统方式):
```
GET /users/123
GET /users/123/todos
GET /users/123/todos/456
```

**GraphQL** (这个项目):
```
query {
  me {
    id email
    todos { id title priority }
  }
}
```

### 2. NestJS 依赖注入

```typescript
@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}
}

// 使用
@Resolver()
export class TodoResolver {
  constructor(private todoService: TodoService) {}
}
```

### 3. TypeORM 关系

- **一对多**: @OneToMany() + @ManyToOne()
- **多对多**: @ManyToMany() + @JoinTable()

### 4. 权限检查

```typescript
@UseGuards(GqlAuthGuard) // 需要认证
async createTodo(
  @CurrentUser() user: User  // 自动注入当前用户
) {
  // 只有已登录用户才能执行此操作
}
```

---

## 🔍 代码注释说明

整个项目中的所有文件都有**详细的中文注释**，包括：

1. **文件头注释** - 说明文件的功能
2. **类和函数注释** - 解释做什么和为什么
3. **行内注释** - 解释关键的代码逻辑
4. **装饰器说明** - 解释 TypeORM 和 GraphQL 装饰器

### 注释示例

```typescript
/**
 * Todo 实体定义
 *
 * 这个文件展示了 NestJS 中 GraphQL 和 TypeORM 的强大整合：
 * 1. TypeORM 装饰器用于数据库映射
 * 2. GraphQL 装饰器用于 API Schema 生成
 * 3. 一个类同时服务于两个目的
 */
@Entity('todos')
@ObjectType()
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)  // GraphQL 字段
  id: string;

  // ... 更多字段
}
```

---

## 📝 总结

这个项目为初学者提供了一个完整的、有详细注释的 GraphQL + NestJS + Next.js 学习资源。

通过学习这个项目，你将理解：
- ✅ GraphQL API 的设计和实现
- ✅ NestJS 的模块化架构
- ✅ TypeORM 的各种关系映射
- ✅ 认证和授权的实现
- ✅ 复杂数据库查询
- ✅ 如何组织可维护的代码结构

祝学习愉快！🎉
