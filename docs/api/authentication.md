# API 认证说明

## JWT 认证流程

本项目使用 **JWT (JSON Web Token)** 实现无状态认证。

### 认证流程

```
┌──────────────┐
│ 1. 用户注册   │
│ 或登录        │
└──────────────┘
       │
       ▼
┌──────────────────────────┐
│ 2. 发送邮箱和密码        │
│ POST /api/auth/register  │
│ POST /api/auth/login     │
└──────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 3. 服务器验证并返回 JWT Token       │
│ {                                   │
│   "accessToken": "jwt...",          │
│   "user": { ... }                   │
│ }                                   │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 4. 客户端保存 Token（localStorage）  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 5. 后续请求在请求头中包含 Token     │
│ Authorization: Bearer <token>       │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 6. 服务器验证 Token 是否有效        │
│ 有效 → 返回数据                     │
│ 无效 → 返回 401 Unauthorized        │
└─────────────────────────────────────┘
```

---

## 步骤详解

### 第 1 步：注册或登录

**注册**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'
```

**登录**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### 第 2 步：获取 Token

两个端点都返回：
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDMwNzk2MDAsImV4cCI6MTcwMzE2NjAwMH0.xxx...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### 第 3 步：保存 Token

在前端（JavaScript）保存 Token：
```javascript
// 注册或登录后
const response = await fetch('/api/auth/register', { /* ... */ });
const data = await response.json();

// 保存 token
localStorage.setItem('token', data.accessToken);
```

### 第 4 步：在请求中使用 Token

获取用户列表时，在请求头中包含 Token：
```bash
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## JWT Token 结构

JWT Token 由三部分组成，用点号 (.) 分隔：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDMwNzk2MDAsImV4cCI6MTcwMzE2NjAwMH0.
xxx
│                                               │
│                                               └── 签名部分
│                                                   （验证 Token 是否被篡改）
│
└── Header（头部）     Payload（负载）
    声明算法和类型      包含声明数据
```

**Header** (解码后)
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** (解码后)
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // 用户 ID
  "email": "user@example.com",                    // 邮箱
  "iat": 1703079600,                              // Token 创建时间
  "exp": 1703166000                               // Token 过期时间
}
```

---

## Token 有效期

- **创建时间**: 用户注册或登录时创建
- **有效期**: 24 小时
- **过期后**: 需要重新登录获取新 Token

---

## 认证错误处理

### 缺少 Token
```bash
curl -X GET http://localhost:4000/api/users
# 返回 401 Unauthorized
```

**错误响应**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Token 无效或过期
```bash
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer invalid-token-123"
# 返回 401 Unauthorized
```

**错误响应**
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

---

## 前端实现示例

### 注册流程
```javascript
async function register(email, name, password) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password })
  });

  const data = await response.json();

  if (response.ok) {
    // 保存 token
    localStorage.setItem('token', data.accessToken);
    return data.user;
  } else {
    throw new Error(data.message);
  }
}
```

### 使用 Token 发送请求
```javascript
async function getUsers() {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/users', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    // Token 过期，需要重新登录
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  return await response.json();
}
```

### 登出流程
```javascript
function logout() {
  // 简单的登出就是删除本地存储的 token
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

---

## 安全最佳实践

1. **不要在 URL 中传递 Token** - 始终在 Authorization 头中传递
2. **使用 HTTPS** - 生产环境必须使用 HTTPS
3. **保护 JWT_SECRET** - 环境变量中安全存储秘钥
4. **定期更新 Token** - 考虑实现 Token 刷新机制
5. **验证 Token 签名** - 服务器必须验证 Token 的真实性

---

## 常见问题

### Q: 如何判断 Token 是否过期？
A: 当发送请求返回 401 Unauthorized 时，表示 Token 已过期或无效，需要重新登录。

### Q: 如何在多个标签页共享 Token？
A: 使用 `localStorage` 保存 Token 后，所有标签页都可以访问，无需重新登录。

### Q: 如何安全地删除 Token？
A: 简单地从 localStorage 中删除即可。可选的做法是向服务器发送登出请求（需要服务器支持 Token 黑名单）。

---

**最后更新**: 2025-12-20
