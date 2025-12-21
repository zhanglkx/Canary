# Canary 全栈调试配置完成总结

## ✅ 已完成的配置

### 1. VS Code 调试配置
**文件**: `.vscode/launch.json`

已创建 9 个调试配置：
- 🔴 调试后端 (NestJS API)
- 🔴 调试后端 (断点启动)
- 🔴 附加到运行中的后端
- 🟢 调试前端 (Next.js Node)
- 🔵 调试浏览器 (Chrome)
- 🔵 附加到 Chrome
- 🚀 全栈调试 (单进程)
- 🎯 完整全栈调试 (复合配置)
- 🎯 后端 + 浏览器调试 (复合配置)

### 2. TypeScript 源码映射
- ✅ 后端 `apps/api/tsconfig.json` - `sourceMap: true` 已启用
- ✅ 前端 `apps/web/tsconfig.json` - `sourceMap: true` 已添加

### 3. 调试脚本验证
- ✅ `apps/api/package.json` 中的 debug 脚本已确认正确
  - `debug`: 启动调试模式
  - `debug:brk`: 断点启动模式
  - `debug:prod`: 生产环境调试

### 4. 文档和指南
创建了完整的调试文档：
- 📄 `DEBUG_QUICKSTART.md` - 快速启动指南（3 步开始调试）
- 📄 `docs/DEBUG_SETUP.md` - 详细调试指南（1000+ 行完整文档）
- 📄 `docs/DEBUG_TEST_GUIDE.md` - 测试验证指南（具体测试步骤）
- 📄 `scripts/verify-debug-config.sh` - 自动验证脚本

---

## 🚀 如何开始调试

### 方式 1：一键启动（推荐）⭐

```bash
# 第 1 步：启动数据库
docker-compose up -d postgres

# 第 2 步：在 VS Code 中
按 F5 → 选择 "🎯 完整全栈调试" → 开始调试！
```

### 方式 2：分别启动

```bash
# 启动数据库
docker-compose up -d postgres

# 终端 1：启动后端调试
# VS Code: F5 → 选择 "🔴 调试后端"

# 终端 2：启动前端
pnpm --filter web dev

# 浏览器访问
open http://localhost:3000
```

### 方式 3：验证配置

```bash
# 运行验证脚本
./scripts/verify-debug-config.sh

# 查看验证结果和建议
```

---

## 📍 三层调试架构

```
┌─────────────────────────────────────────────────────────┐
│               Canary 调试架构                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  第 1 层: 浏览器 (React 客户端)                          │
│  ├─ 调试工具: Chrome DevTools                           │
│  ├─ 代码位置: apps/web/src/components, app (客户端)     │
│  └─ 调试内容: UI 交互、状态管理、浏览器事件              │
│                    ↓                                      │
│  第 2 层: Next.js Node 端 (SSR 服务器)                   │
│  ├─ 调试工具: VS Code Debugger                          │
│  ├─ 端口: 3000                                           │
│  ├─ 代码位置: apps/web/src (服务器端代码)                │
│  └─ 调试内容: SSR 渲染、API 路由、数据预取               │
│                    ↓                                      │
│  第 3 层: NestJS 后端 (API 服务器)                       │
│  ├─ 调试工具: VS Code Debugger                          │
│  ├─ 端口: 4000, 调试端口: 9229                           │
│  ├─ 代码位置: apps/api/src                               │
│  └─ 调试内容: GraphQL API、业务逻辑、数据库操作          │
│                    ↓                                      │
│  数据层: PostgreSQL                                       │
│  └─ 端口: 5432                                            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 推荐的调试断点位置

### 后端关键断点

#### 1. 应用启动入口
```typescript
// apps/api/src/main.ts:62
console.log(`🚀 Server is running on http://localhost:${port}/graphql`);
```

#### 2. GraphQL Resolver
```typescript
// apps/api/src/auth/auth.resolver.ts
@Mutation(() => AuthPayload)
async register(@Args('registerInput') registerInput: RegisterInput) {
  // 👈 断点：接收 GraphQL 请求
  return this.authService.register(registerInput);
}

@Mutation(() => AuthPayload)
async login(@Args('loginInput') loginInput: LoginInput) {
  // 👈 断点：处理登录
  return this.authService.login(loginInput);
}
```

#### 3. Service 业务逻辑
```typescript
// apps/api/src/auth/auth.service.ts
async register(registerInput: RegisterInput): Promise<AuthPayload> {
  // 👈 断点：开始处理注册
  const existingUser = await this.usersService.findByEmail(registerInput.email);
  
  if (existingUser) {
    // 👈 断点：检查用户是否存在
    throw new Error('用户已存在');
  }
  
  // 👈 断点：密码加密
  const hashedPassword = await bcrypt.hash(registerInput.password, 10);
  
  // 👈 断点：创建用户
  const user = await this.usersService.create({
    ...registerInput,
    password: hashedPassword,
  });
  
  return { accessToken: '...', user };
}
```

### 前端关键断点

#### 1. Apollo Client 配置
```typescript
// apps/web/src/lib/apollo-client.ts
const authLink = setContext((_, { headers }) => {
  // 👈 断点：添加认证 Token
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
```

#### 2. 页面组件
```typescript
// apps/web/src/app/register/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // 👈 断点：表单提交
  
  const { data } = await register({
    variables: {
      email: formData.email,
      username: formData.username,
      password: formData.password,
    },
  });
  // 👈 断点：收到响应
  
  localStorage.setItem('token', data.register.accessToken);
};
```

#### 3. SSR 页面
```typescript
// apps/web/src/app/page.tsx
export default async function Home() {
  // 👈 断点：服务器端渲染
  // 注意：此代码在 Node.js 服务器端执行
  return <main>...</main>;
}
```

---

## 🔧 调试快捷键

### VS Code 调试快捷键

| 快捷键 | 功能 | 说明 |
|-------|------|------|
| `F5` | 开始调试/继续 | 启动调试或从断点继续执行 |
| `F9` | 切换断点 | 在当前行添加/移除断点 |
| `F10` | 单步跳过 (Step Over) | 执行当前行，不进入函数 |
| `F11` | 单步进入 (Step Into) | 进入函数内部 |
| `Shift+F11` | 单步跳出 (Step Out) | 跳出当前函数 |
| `Shift+F5` | 停止调试 | 终止当前调试会话 |
| `Ctrl+Shift+F5` | 重启调试 | 停止并重新启动 |

### Chrome DevTools 快捷键

| 快捷键 | 功能 |
|-------|------|
| `F12` | 打开开发者工具 |
| `Cmd+Option+I` (Mac) | 打开开发者工具 |
| `Ctrl+Shift+C` | 选择元素 |
| `Cmd+P` | 快速打开文件 |

---

## 📊 调试流程示例

### 完整的用户注册流程调试

```
1. 用户在浏览器中填写注册表单
   ↓
2. 点击"创建账号"按钮
   ↓
3. [前端断点 1] apps/web/src/app/register/page.tsx - handleSubmit
   - 查看表单数据
   - 按 F5 继续
   ↓
4. [前端断点 2] apps/web/src/lib/apollo-client.ts - authLink
   - 查看请求头
   - 按 F5 继续
   ↓
5. [后端断点 3] apps/api/src/auth/auth.resolver.ts - register
   - 查看接收到的数据
   - 按 F11 进入 authService
   ↓
6. [后端断点 4] apps/api/src/auth/auth.service.ts - register
   - 单步执行 (F10) 查看每一步
   - 查看密码加密过程
   - 查看数据库操作
   - 按 F5 继续
   ↓
7. 返回响应到前端
   ↓
8. [前端断点 5] apps/web/src/app/register/page.tsx - 收到响应
   - 查看返回的 accessToken
   - 查看用户数据
   ↓
9. 页面跳转到 Dashboard
```

---

## 🧪 验证调试配置

### 自动验证

```bash
# 运行验证脚本
./scripts/verify-debug-config.sh

# 脚本会检查：
# ✓ Node.js 版本
# ✓ pnpm 版本
# ✓ 项目依赖
# ✓ Docker 和数据库
# ✓ 端口占用情况
# ✓ VS Code 配置
# ✓ TypeScript 配置
# ✓ 后端构建状态
```

### 手动验证

按照 `docs/DEBUG_TEST_GUIDE.md` 中的步骤进行完整测试：

- [ ] 测试 1: 后端断点调试
- [ ] 测试 2: 前端 Next.js 调试
- [ ] 测试 3: 浏览器端调试
- [ ] 测试 4: 全栈联调
- [ ] 测试 5: 高级调试功能（条件断点、日志点）

---

## 📚 文档结构

```
Canary/
├── .vscode/
│   └── launch.json              # VS Code 调试配置 ⭐
│
├── docs/
│   ├── DEBUG_SETUP.md           # 详细调试指南 (1000+ 行)
│   ├── DEBUG_TEST_GUIDE.md      # 测试验证指南
│   └── 架构原理与运行机制.md     # 项目架构文档
│
├── scripts/
│   └── verify-debug-config.sh   # 自动验证脚本
│
├── DEBUG_QUICKSTART.md          # 快速启动指南 (本文件)
│
├── apps/
│   ├── api/                     # NestJS 后端
│   │   ├── src/
│   │   │   ├── main.ts         # 后端入口 (推荐断点)
│   │   │   ├── auth/           # 认证模块 (推荐断点)
│   │   │   └── ...
│   │   └── package.json        # 包含 debug 脚本
│   │
│   └── web/                     # Next.js 前端
│       ├── src/
│       │   ├── app/            # 页面组件 (推荐断点)
│       │   ├── lib/            # Apollo Client (推荐断点)
│       │   └── ...
│       └── tsconfig.json       # sourceMap 已启用
│
└── docker-compose.yml           # 数据库配置
```

---

## 🎓 学习路径

### 新手 → 熟练

1. **第一周：基础调试**
   - 学会设置断点
   - 学会单步执行 (F10, F11)
   - 学会查看变量

2. **第二周：进阶调试**
   - 使用条件断点
   - 使用日志点
   - 使用监视表达式

3. **第三周：全栈调试**
   - 同时调试前后端
   - 理解完整的请求流程
   - 使用 Chrome DevTools

4. **第四周：高级技巧**
   - 性能分析
   - 内存泄漏检测
   - 远程调试

---

## 💡 调试技巧

### 1. 使用 GraphQL Playground 测试 API

```bash
# 后端启动后，访问：
http://localhost:4000/graphql

# 在 Playground 中测试 Query/Mutation
# 可以在 Resolver 中设置断点观察
```

### 2. 使用 Apollo Client DevTools

```bash
# 在 Chrome 中安装扩展：
# Apollo Client DevTools

# 可以查看：
# - 所有 GraphQL 请求
# - 缓存状态
# - 查询历史
```

### 3. 查看数据库内容

```bash
# 连接到数据库
docker exec -it learning-nest-next-db-dev psql -U postgres -d learning_nest_next

# 查看所有表
\dt

# 查询用户
SELECT * FROM users;

# 退出
\q
```

### 4. 启用 TypeORM 日志

```typescript
// apps/api/src/app.module.ts
TypeOrmModule.forRoot({
  // ...其他配置
  logging: true,  // 👈 启用 SQL 日志
  logger: 'advanced-console',
}),
```

---

## ⚠️ 常见问题

### Q1: 调试器无法连接？

```bash
# 检查端口
lsof -i :9229
lsof -i :4000

# 杀死占用进程
kill -9 <PID>

# 重新构建
pnpm --filter api build

# 重启调试器
```

### Q2: 断点显示灰色不工作？

```bash
# 确保 sourceMap 启用
# apps/api/tsconfig.json 和 apps/web/tsconfig.json 中
# "sourceMap": true

# 重新构建
pnpm --filter api build

# 重启调试器
```

### Q3: 数据库连接失败？

```bash
# 启动数据库
docker-compose up -d postgres

# 检查状态
docker ps | grep postgres

# 查看日志
docker logs learning-nest-next-db-dev

# 测试连接
docker exec learning-nest-next-db-dev pg_isready -U postgres
```

---

## 🎉 完成！

你现在已经拥有完整的 Canary 全栈调试环境！

### 快速开始：

```bash
# 1. 启动数据库
docker-compose up -d postgres

# 2. 在 VS Code 中按 F5
# 选择：🎯 完整全栈调试

# 3. 开始调试！
```

### 推荐阅读顺序：

1. 📄 `DEBUG_QUICKSTART.md` (本文件) - 快速上手
2. 📄 `docs/DEBUG_TEST_GUIDE.md` - 测试验证
3. 📄 `docs/DEBUG_SETUP.md` - 深入学习
4. 📄 `docs/架构原理与运行机制.md` - 理解架构

---

## 📞 获取帮助

- 查看详细文档：`docs/DEBUG_SETUP.md`
- 运行验证脚本：`./scripts/verify-debug-config.sh`
- 查看项目架构：`docs/架构原理与运行机制.md`

---

**祝你调试愉快！🚀**
