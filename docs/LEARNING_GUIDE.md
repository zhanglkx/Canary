# 📚 Canary 学习项目 - 功能规划与学习指南

## 🎯 项目定位
这是一个**最小化全栈学习项目**，目的是帮助后端小白理解：
- 什么是前后端分离
- 如何设计 RESTful API
- 如何实现用户认证
- 如何组织后端代码

**原则**：功能最小、代码清晰、注释完整、易于扩展

---

## 📋 当前已实现的功能 (MVP - 最小可行产品)

### ✅ 已完成
| 功能 | 位置 | 说明 |
|------|------|------|
| 用户注册 | POST /api/auth/register | 创建新用户账户 |
| 用户登录 | POST /api/auth/login | 验证身份并返回 JWT token |
| 获取用户列表 | GET /api/users | 获取所有注册用户 |
| 获取单个用户 | GET /api/users/:id | 根据 ID 获取用户信息 |
| 系统健康检查 | GET /api/health | 验证 API 服务是否正常 |

---

## 🚀 待实现的功能清单（按优先级）

### 第一阶段：用户管理完整化 (优先级: ⭐⭐⭐⭐⭐)
```
[ ] 编辑用户信息     PATCH /api/users/:id
[ ] 删除用户账户     DELETE /api/users/:id
[ ] 修改密码        PATCH /api/users/:id/password
[ ] 用户信息验证    GET /api/users/:id/profile (需要认证)
[ ] 获取当前登录用户 GET /api/auth/me
```

### 第二阶段：安全性增强 (优先级: ⭐⭐⭐⭐)
```
[ ] 密码加密        使用 bcrypt 替代明文存储
[ ] 刷新 token      POST /api/auth/refresh 获取新 token
[ ] 登出功能        POST /api/auth/logout
[ ] Token 黑名单    防止已登出 token 继续使用
[ ] 错误消息优化    返回更友好的错误提示
```

### 第三阶段：数据验证 (优先级: ⭐⭐⭐)
```
[ ] 邮箱格式验证    验证是否为有效邮箱
[ ] 密码强度验证    要求大小写字母+数字+特殊符号
[ ] 用户名唯一性    注册时检查重复
[ ] 请求数据清理    防止 XSS 和数据污染
```

### 第四阶段：业务功能 (优先级: ⭐⭐)
```
[ ] 用户文章功能    用户可以发布文章
[ ] 文章评论功能    用户可以评论文章
[ ] 文章点赞功能    用户可以点赞文章
[ ] 用户关注功能    用户可以关注其他用户
[ ] 用户搜索功能    按用户名/邮箱搜索用户
```

### 第五阶段：文件与媒体 (优先级: ⭐)
```
[ ] 头像上传        上传用户头像图片
[ ] 文章配图        上传文章配图
[ ] 文件存储        使用云存储或本地存储
[ ] 文件管理        删除/替换文件
```

### 第六阶段：高级功能 (优先级: ⭐ - 可选)
```
[ ] 分页查询        POST /api/users?page=1&limit=10
[ ] 数据筛选        按条件过滤用户
[ ] 排序功能        按创建时间/更新时间排序
[ ] 全文搜索        高效搜索文章和用户
[ ] 缓存机制        使用 Redis 缓存热数据
[ ] WebSocket       实时通知功能
```

---

## 🗂️ 当前项目结构说明

### 前端 (apps/frontend)
```
简单登录页面 → 仅用于理解前后端通信
- 演示 HTTP 请求
- 演示 JWT token 存储
- 演示错误处理
```

### 后端 (apps/backend)
```
4 个核心模块 → 理解如何组织代码

1. Auth Module (认证模块)
   - 用户登录/注册逻辑
   - JWT token 生成
   - 认证中间件

2. Users Module (用户模块)
   - 用户数据管理
   - 用户查询接口
   - 用户信息验证

3. Database Layer (数据库层)
   - User Entity (用户数据表)
   - TypeORM 配置

4. Common Layer (公共层)
   - 异常处理
   - 全局管道
   - 响应格式统一
```

---

## 💡 学习要点

### 后端核心概念
1. **MVC 架构** - 理解 Module/Service/Controller 的职责分离
2. **RESTful API** - 理解 HTTP 方法 (GET/POST/PATCH/DELETE)
3. **数据库** - 理解表、字段、关系等基本概念
4. **认证** - 理解 JWT token 和无状态认证
5. **异常处理** - 理解如何返回错误信息
6. **中间件** - 理解请求处理流程

### 前端核心概念
1. **API 调用** - 理解 fetch/axios 如何调用后端
2. **Token 存储** - 理解如何在浏览器保存认证信息
3. **错误处理** - 理解如何处理 API 错误
4. **组件通信** - 理解如何在组件间传递数据

---

## 📖 代码阅读顺序（推荐）

### 第 1 天：理解整体流程
1. `apps/backend/src/main.ts` - 应用启动入口
2. `apps/backend/src/app.module.ts` - 应用主模块
3. `apps/frontend/src/app/page.tsx` - 前端主页

### 第 2 天：理解用户认证
1. `apps/backend/src/auth/auth.controller.ts` - 认证接口
2. `apps/backend/src/auth/auth.service.ts` - 认证逻辑
3. `libs/shared-types/src/index.ts` - 前后端共享类型

### 第 3 天：理解用户管理
1. `apps/backend/src/users/users.controller.ts` - 用户接口
2. `apps/backend/src/users/users.service.ts` - 用户逻辑
3. `apps/backend/src/users/entities/user.entity.ts` - 用户数据模型

### 第 4 天：理解数据库
1. `apps/backend/src/app.module.ts` - 数据库配置
2. `apps/backend/src/users/entities/user.entity.ts` - 数据表定义
3. TypeORM 官方文档

### 第 5 天：练习与扩展
- 尝试添加一个新的 API 端点
- 修改现有的业务逻辑
- 调整错误处理方式

---

## 🔧 如何扩展功能

### 例子 1：添加编辑用户功能

**步骤 1**：在 users.controller.ts 中添加路由
```typescript
@Patch(':id')
updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  // 调用 service 更新用户
}
```

**步骤 2**：在 users.service.ts 中实现逻辑
```typescript
async updateUser(id: string, dto: UpdateUserDto) {
  // 查询用户 → 更新数据 → 保存到数据库 → 返回结果
}
```

**步骤 3**：在前端调用此接口
```typescript
await fetchAPI('/users/123', {
  method: 'PATCH',
  body: JSON.stringify({ name: 'New Name' })
})
```

---

## 📊 技术栈快速查询

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Next.js | 16.1 | 页面渲染 |
| 前端语言 | TypeScript | 5.7 | 类型检查 |
| 后端框架 | NestJS | 11 | API 开发 |
| 后端语言 | TypeScript | 5.7 | 类型检查 |
| 数据库 | SQLite | 3 | 本地存储 |
| ORM | TypeORM | 0.3 | 数据库操作 |
| 认证 | JWT | - | 用户认证 |
| 测试 | Jest | 29.7 | 单元测试 |

---

## 🚨 常见问题与解答

### Q1: 为什么要用 JWT？
A: JWT 是无状态的，不需要服务器保存 session，适合分布式系统。

### Q2: 为什么要分 Controller/Service/Entity？
A: 职责分离，便于测试、维护和扩展。Controller 处理请求，Service 处理业务逻辑，Entity 定义数据模型。

### Q3: 如何添加新的数据表？
A: 创建 Entity（定义数据结构）→ 创建 Module（注册 Entity）→ 在 app.module.ts 导入

### Q4: 密码为什么不能明文存储？
A: 黑客如果盗取数据库，会获得所有用户密码。应该使用 bcrypt 加密。

### Q5: Token 过期了怎么办？
A: 使用刷新 token，用刷新 token 换取新的 access token。

---

## 📝 每次开发必读清单

在开发新功能前，务必：

1. ✅ 确认功能在上方清单中
2. ✅ 查看相关的注释和文档
3. ✅ 参考现有代码的模式
4. ✅ 添加完整的代码注释
5. ✅ 更新 `docs/FEATURES.md` 记录完成的功能
6. ✅ 测试新功能是否正常工作
7. ✅ 如有新 API，在 `docs/api/endpoints.md` 中记录

---

## 🎓 推荐学习资源

### 官方文档
- [NestJS 文档](https://docs.nestjs.com) - 后端框架
- [Next.js 文档](https://nextjs.org/docs) - 前端框架
- [TypeORM 文档](https://typeorm.io) - 数据库 ORM
- [TypeScript 文档](https://www.typescriptlang.org/docs) - 类型系统

### 概念学习
- 什么是 REST API？
- 什么是 JWT 认证？
- 什么是中间件？
- 什么是依赖注入？

---

## 📞 需要帮助？

看这些文档：
- 项目整体结构 → `docs/PROJECT_STRUCTURE.md`
- API 文档 → `docs/api/endpoints.md`
- 后端代码说明 → `docs/backend/GUIDE.md`
- 前端代码说明 → `docs/frontend/GUIDE.md`

---

**最后更新**: 2025-12-20
**项目级别**: 🟢 学习初级项目
**代码复杂度**: 🟢 最小化 (便于学习)
