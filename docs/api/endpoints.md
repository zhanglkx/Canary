# API 端点文档

## 基础信息

**Base URL**: `http://localhost:4000/api`

**认证方式**: Bearer Token (JWT)

所有需要认证的端点在请求头中包含:
```
Authorization: Bearer <jwt_token>
```

---

## 📋 端点快速索引

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/health` | 健康检查 | ✗ |
| POST | `/auth/register` | 用户注册 | ✗ |
| POST | `/auth/login` | 用户登录 | ✗ |
| GET | `/users` | 获取所有用户 | ✓ |
| GET | `/users/:id` | 获取单个用户 | ✓ |
| POST | `/users` | 创建用户 | ✓ |
| PATCH | `/users/:id` | 更新用户 | ✓ |
| DELETE | `/users/:id` | 删除用户 | ✓ |

---

## 🏥 健康检查

### 检查 API 健康状态
```http
GET /api/health
```

**响应 (200 OK)**
```json
{
  "status": "ok",
  "timestamp": "2025-12-20T10:30:00.000Z"
}
```

---

## 🔐 认证端点

### 注册新用户
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}
```

**成功响应 (201 Created)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**错误响应 (409 Conflict)**
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

---

### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**成功响应 (200 OK)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**错误响应 (401 Unauthorized)**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## 👥 用户管理端点

### 获取所有用户
```http
GET /api/users
Authorization: Bearer <token>
```

**响应 (200 OK)**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "isActive": true,
    "createdAt": "2025-12-20T10:00:00.000Z",
    "updatedAt": "2025-12-20T10:00:00.000Z"
  }
]
```

---

### 获取单个用户
```http
GET /api/users/{id}
Authorization: Bearer <token>
```

**路径参数**
- `id` (string, required) - 用户 UUID

**响应 (200 OK)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "isActive": true,
  "createdAt": "2025-12-20T10:00:00.000Z",
  "updatedAt": "2025-12-20T10:00:00.000Z"
}
```

**错误响应 (404 Not Found)**
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

---

### 创建用户
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "password": "SecurePass123!"
}
```

**请求体**
- `email` (string, required) - 有效的邮箱地址
- `name` (string, required) - 用户名
- `password` (string, required) - 密码（最少 8 字符）

**响应 (201 Created)**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "isActive": true,
  "createdAt": "2025-12-20T11:00:00.000Z",
  "updatedAt": "2025-12-20T11:00:00.000Z"
}
```

---

### 更新用户
```http
PATCH /api/users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe Smith",
  "email": "jane.smith@example.com"
}
```

**路径参数**
- `id` (string, required) - 用户 UUID

**请求体** (所有字段可选)
- `name` (string) - 用户名
- `email` (string) - 邮箱地址

**响应 (200 OK)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jane.smith@example.com",
  "name": "Jane Doe Smith",
  "isActive": true,
  "createdAt": "2025-12-20T10:00:00.000Z",
  "updatedAt": "2025-12-20T11:30:00.000Z"
}
```

---

### 删除用户
```http
DELETE /api/users/{id}
Authorization: Bearer <token>
```

**路径参数**
- `id` (string, required) - 用户 UUID

**响应 (204 No Content)**
```
(空响应体)
```

**错误响应 (404 Not Found)**
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

---

## 📊 响应格式

### 用户对象结构
```typescript
{
  id: string;              // UUID
  email: string;          // 邮箱地址
  name: string;           // 用户名
  isActive: boolean;      // 是否活跃
  createdAt: string;      // ISO 时间戳
  updatedAt: string;      // ISO 时间戳
}
```

### 认证响应结构
```typescript
{
  accessToken: string;    // JWT Token
  user: {
    id: string;          // UUID
    email: string;       // 邮箱地址
    name: string;        // 用户名
  }
}
```

### 错误响应结构
```typescript
{
  statusCode: number;     // HTTP 状态码
  message: string;       // 错误描述
  error: string;         // 错误类型
}
```

---

## 🔑 JWT Token

**Token 包含信息**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1703079600,
  "exp": 1703166000
}
```

**有效期**: 24 小时

**配置**: 通过 `JWT_SECRET` 环境变量设置秘钥

---

## 📍 HTTP 状态码

| 状态码 | 含义 | 场景 |
|--------|------|------|
| 200 | OK | 成功的 GET, PATCH 请求 |
| 201 | Created | 成功创建资源 |
| 204 | No Content | 成功删除资源 |
| 400 | Bad Request | 请求数据无效 |
| 401 | Unauthorized | 缺少或无效 Token |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如邮箱重复） |
| 500 | Server Error | 服务器内部错误 |

---

## 🌐 CORS 配置

**允许的源**: `http://localhost:3000`
**允许的方法**: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
**允许的请求头**: `Content-Type, Authorization`
**凭证**: `true`

---

**API 版本**: 1.0.0
**最后更新**: 2025-12-20
**文档格式**: OpenAPI 3.0
