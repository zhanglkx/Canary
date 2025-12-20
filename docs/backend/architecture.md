# 后端架构说明

## 概述

后端使用 **NestJS 11** 构建，采用**模块化架构**。这种设计使代码更加模块化、可测试和可维护。

---

## 核心概念

### 什么是模块？

模块是将相关的功能组织在一起的容器。每个模块：
- 负责一个特定的功能区域
- 包含 Controller（处理请求）、Service（业务逻辑）、Entity（数据模型）
- 可以导入其他模块的功能

### 代码结构层次

```
Module
  ├── Controller      (处理 HTTP 请求)
  ├── Service         (业务逻辑)
  ├── Entity          (数据模型)
  └── DTO             (数据验证)
```

---

## 三大模块详解

### 1️⃣ Auth 模块（认证）

**位置**: `apps/backend/src/auth/`

**职责**:
- 处理用户注册
- 处理用户登录
- 生成 JWT Token
- 验证 Token

**文件结构**
```
auth/
├── auth.controller.ts    # 处理 POST /api/auth/register, /api/auth/login
├── auth.service.ts       # 实现注册和登录逻辑
├── auth.module.ts        # 定义模块，导入依赖
├── dto/
│   └── auth.dto.ts       # 定义请求/响应数据结构
└── strategies/           # JWT 策略（未来实现）
```

**关键流程**
```
用户请求
    ↓
AuthController 收到请求
    ↓
AuthService 验证数据和数据库
    ↓
如果成功 → 生成 Token 返回
如果失败 → 返回错误
```

---

### 2️⃣ Users 模块（用户管理）

**位置**: `apps/backend/src/users/`

**职责**:
- 创建用户
- 获取用户列表
- 获取单个用户
- 更新用户信息
- 删除用户

**文件结构**
```
users/
├── users.controller.ts      # 处理 GET, POST, PATCH, DELETE /api/users
├── users.service.ts         # 实现 CRUD 操作
├── users.module.ts          # 定义模块
├── entities/
│   └── user.entity.ts        # TypeORM User 表定义
└── dto/
    └── user.dto.ts           # CreateUserDto, UpdateUserDto
```

**关键流程**
```
客户端请求
    ↓
UsersController 接收请求和 Token
    ↓
验证 Token 是否有效
    ↓
调用 UsersService 处理业务逻辑
    ↓
操作数据库
    ↓
返回结果给客户端
```

---

### 3️⃣ Health 模块（健康检查）

**位置**: `apps/backend/src/health/`

**职责**:
- 提供 API 健康检查端点
- 验证服务是否正常运行

**文件结构**
```
health/
└── health.controller.ts    # 处理 GET /api/health
```

**用途**: 用于监控、负载均衡器检查等

---

## 核心层次

### 1. Controller（控制器）

**作用**: 处理 HTTP 请求

```typescript
// 示例
@Controller('api/users')  // 路由前缀
export class UsersController {
  @Get()                   // GET /api/users
  findAll() {
    // 处理请求
  }

  @Post()                  // POST /api/users
  create(@Body() dto: CreateUserDto) {
    // 处理请求
  }
}
```

**职责**:
- 接收 HTTP 请求
- 验证请求格式
- 调用 Service 处理业务
- 返回响应

### 2. Service（服务）

**作用**: 处理业务逻辑

```typescript
// 示例
@Injectable()
export class UsersService {
  // 这里存放业务逻辑，不直接处理 HTTP 请求

  async findAll() {
    // 查询数据库
    // 处理业务规则
  }

  async create(dto: CreateUserDto) {
    // 验证数据
    // 保存到数据库
  }
}
```

**职责**:
- 实现业务逻辑
- 与数据库交互
- 返回数据给 Controller

### 3. Entity（实体）

**作用**: 定义数据库表结构

```typescript
// 示例
@Entity('users')           // 表名
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;              // UUID 主键

  @Column()
  email: string;           // 邮箱列

  @Column()
  name: string;            // 名字列
}
```

**职责**:
- 定义数据库表
- 定义列和数据类型
- 定义列之间的关系

### 4. DTO（数据传输对象）

**作用**: 定义请求/响应数据结构和验证规则

```typescript
// 示例：注册时接收的数据
export class RegisterDto {
  @IsEmail()               // 验证邮箱格式
  email: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(8)            // 最少 8 个字符
  password: string;
}
```

**职责**:
- 定义数据结构
- 验证输入数据
- 类型提示

---

## 数据流示例

### 创建用户的完整流程

```
1. 前端发送请求
   POST /api/users
   Headers: Authorization: Bearer <token>
   Body: { "email": "user@example.com", "name": "John", "password": "..." }

2. UsersController 接收请求
   ✓ 验证 Authorization 头存在
   ✓ 将 JWT Token 提取出来

3. AuthGuard 中间件验证 Token
   ✓ 解码 Token
   ✓ 检查是否过期
   ✓ 提取用户 ID

4. UsersService 处理业务逻辑
   ✓ 检查邮箱是否已存在
   ✓ 验证数据格式
   ✓ 创建 User 实体
   ✓ 保存到数据库

5. 数据库返回结果
   ✓ 保存成功，返回新用户对象

6. UsersController 返回响应
   HTTP 201 Created
   Body: { "id": "...", "email": "...", "name": "..." }

7. 前端收到响应显示结果
```

---

## 模块导入关系

```
App Module (主模块)
  ├── Auth Module
  │   ├── Auth Controller
  │   ├── Auth Service
  │   └── User Entity (for auth)
  │
  ├── Users Module
  │   ├── Users Controller
  │   ├── Users Service
  │   ├── User Entity (共享)
  │   └── DTOs
  │
  ├── Health Module
  │   └── Health Controller
  │
  └── TypeORM
      └── 数据库配置
```

---

## 依赖注入

NestJS 使用**依赖注入**模式，意思是：

```typescript
// Service 需要数据库
// 不是 Service 自己创建数据库连接
// 而是由 NestJS 注入给它

@Injectable()
export class UsersService {
  // NestJS 自动注入 Repository
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async findAll() {
    // 直接使用 usersRepository
    return this.usersRepository.find();
  }
}
```

**好处**:
- 代码更清晰
- 易于测试（可以注入模拟对象）
- 易于维护

---

## 错误处理

后端使用**全局异常过滤器**统一处理错误：

```typescript
// 抛出异常
throw new BadRequestException('Invalid email');
throw new NotFoundException('User not found');
throw new UnauthorizedException('Invalid token');

// 自动转换为 HTTP 响应
// 400 Bad Request
// 404 Not Found
// 401 Unauthorized
```

---

## 中间件流程

```
请求进入
    ↓
CORS 中间件
    ↓
认证中间件（验证 Token）
    ↓
验证管道（验证 DTO）
    ↓
Controller
    ↓
Service
    ↓
数据库
    ↓
异常过滤器（捕获错误）
    ↓
返回响应
```

---

## 总结

| 组件 | 职责 | 示例 |
|------|------|------|
| **Module** | 组织相关功能 | AuthModule, UsersModule |
| **Controller** | 处理 HTTP 请求 | 接收 POST /api/auth/register |
| **Service** | 业务逻辑 | 检查邮箱是否存在 |
| **Entity** | 数据模型 | User 表定义 |
| **DTO** | 数据验证 | CreateUserDto |

---

## 下一步

- 查看 [模块说明](./modules.md) 了解每个模块的详细实现
- 查看 [数据库配置](./database.md) 了解数据库设置
- 查看代码中的详细注释

---

**最后更新**: 2025-12-20
