# 调试测试指南

本文件提供了具体的测试步骤，用于验证调试配置是否正常工作。

## 测试准备

1. **启动数据库**：
   ```bash
   docker-compose up -d postgres
   ```

2. **确保所有依赖已安装**：
   ```bash
   pnpm install
   ```

## 测试 1: 后端断点调试 ✅

### 目标
验证能否在 NestJS 后端代码中设置断点并命中。

### 步骤

1. **打开后端入口文件**：
   - 文件：`apps/api/src/main.ts`

2. **设置断点**：
   在第 62 行（`console.log` 那一行）点击行号左侧，设置一个红色断点：
   ```typescript
   // 第 62 行
   console.log(`🚀 Server is running on http://localhost:${port}/graphql`);
   ```

3. **启动后端调试**：
   - 按 `F5`
   - 选择 `🔴 调试后端 (NestJS API)`
   - 点击绿色播放按钮

4. **验证结果**：
   - ✅ 程序应该在启动时在断点处暂停
   - ✅ 左侧"变量"面板应该显示 `port` 变量的值（4000）
   - ✅ 底部调试控制台应该显示日志输出

5. **测试调试功能**：
   - 在"监视"面板中添加表达式：`port`
   - 在调试控制台中输入：`port`，应该显示 `4000`
   - 按 `F5` 继续执行

6. **验证服务启动**：
   - 终端应该显示 "🚀 Server is running on..."
   - 在浏览器中访问 http://localhost:4000/graphql
   - 应该看到 GraphQL Playground

### 测试场景 2: GraphQL Resolver 断点

1. **打开 Auth Resolver**：
   - 文件：`apps/api/src/auth/auth.resolver.ts`

2. **找到 login 方法并设置断点**：
   ```typescript
   @Mutation(() => AuthPayload)
   async login(@Args('loginInput') loginInput: LoginInput) {
     // 👈 在这里设置断点
     return this.authService.login(loginInput);
   }
   ```

3. **使用 GraphQL Playground 测试**：
   - 访问 http://localhost:4000/graphql
   - 输入查询：
     ```graphql
     mutation {
       login(loginInput: {
         email: "test@example.com"
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
   - 点击播放按钮

4. **验证结果**：
   - ✅ 程序应该在断点处暂停
   - ✅ 可以看到 `loginInput` 变量的值
   - ✅ 可以使用 `F10` 单步执行，`F11` 进入 `authService.login` 方法

## 测试 2: 前端 Next.js 调试 ✅

### 目标
验证能否在 Next.js 服务器端代码中设置断点。

### 步骤

1. **确保后端已启动**：
   ```bash
   pnpm --filter api dev
   ```

2. **打开前端页面文件**：
   - 文件：`apps/web/src/app/page.tsx`

3. **设置断点**：
   在 `Home` 函数的第一行设置断点：
   ```typescript
   export default function Home() {
     // 👈 在这里设置断点
     return (
       <main>
   ```

4. **启动前端调试**：
   - 按 `F5`
   - 选择 `🟢 调试前端 (Next.js Node)`
   - 等待前端启动（显示 "started server on..."）

5. **触发断点**：
   - 在浏览器中访问 http://localhost:3000
   - 或刷新页面

6. **验证结果**：
   - ✅ 程序应该在服务器端渲染时在断点处暂停
   - ✅ 可以查看函数内的变量
   - ✅ 注意：这是在 Node.js 服务器端执行，不是浏览器

### 测试场景 2: Apollo Client 断点

1. **打开 Apollo Client 配置**：
   - 文件：`apps/web/src/lib/apollo-client.ts`

2. **设置断点**：
   在 `authLink` 的 `setContext` 函数中：
   ```typescript
   const authLink = setContext((_, { headers }) => {
     const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
     // 👈 在这里设置断点
     return {
       headers: {
         ...headers,
         authorization: token ? `Bearer ${token}` : '',
       },
     };
   });
   ```

3. **触发断点**：
   - 访问任何需要 GraphQL 请求的页面
   - 例如：登录页面并提交表单

4. **验证结果**：
   - ✅ 程序应该在发送请求前在断点处暂停
   - ✅ 可以看到 `token` 变量的值
   - ✅ 可以看到完整的 `headers` 对象

## 测试 3: 浏览器端调试 ✅

### 目标
验证能否在浏览器中调试 React 客户端代码。

### 步骤

1. **确保前端已启动**：
   ```bash
   pnpm --filter web dev
   ```

2. **启动 Chrome 调试**：
   - 按 `F5`
   - 选择 `🔵 调试浏览器 (Chrome)`
   - Chrome 会自动打开 http://localhost:3000

3. **打开客户端组件**：
   - 文件：`apps/web/src/components/TodoList.tsx` 或任何客户端组件

4. **设置断点**：
   在任何事件处理函数中设置断点，例如 `onClick`：
   ```typescript
   const handleClick = () => {
     // 👈 在这里设置断点
     console.log('Button clicked');
   };
   ```

5. **触发断点**：
   - 在浏览器中点击相应的按钮或元素

6. **验证结果**：
   - ✅ 程序应该在断点处暂停
   - ✅ 可以使用 VS Code 或 Chrome DevTools 查看变量
   - ✅ 可以看到完整的 React 组件状态

### 测试场景 2: 使用 Chrome DevTools

1. **打开 Chrome DevTools**：
   - 在 Chrome 中按 `F12` 或 `Cmd+Option+I` (Mac)

2. **切换到 Sources 面板**：
   - 找到 `webpack://` 下的源文件
   - 或使用 `Cmd+P` 快速打开文件

3. **设置断点**：
   - 直接在 DevTools 中点击行号设置断点

4. **验证结果**：
   - ✅ VS Code 和 Chrome DevTools 的断点应该同步
   - ✅ 可以在两个工具中查看和修改变量

## 测试 4: 全栈联调 ✅

### 目标
同时调试前端和后端，观察完整的请求链路。

### 步骤

1. **设置多个断点**：

   **后端断点**：
   - `apps/api/src/auth/auth.resolver.ts` 中的 `register` 方法

   **前端断点**：
   - `apps/web/src/app/register/page.tsx` 中的表单提交函数

2. **启动全栈调试**：
   - 按 `F5`
   - 选择 `🎯 完整全栈调试 (后端 + 前端 + 浏览器)`
   - 等待所有服务启动

3. **触发完整流程**：
   - 在浏览器中访问 http://localhost:3000/register
   - 填写注册表单
   - 点击"创建账号"按钮

4. **观察执行流程**：
   - ✅ 首先应该在前端断点处暂停（表单提交）
   - ✅ 按 `F5` 继续，然后在后端断点处暂停（处理请求）
   - ✅ 可以在每个断点处查看请求数据
   - ✅ 可以观察数据如何从前端传递到后端

5. **查看完整的调用栈**：
   - 在"调用堆栈"面板中可以看到完整的调用链
   - 可以点击不同的堆栈帧查看每一层的变量

## 测试 5: 高级调试功能 ✅

### 条件断点

1. **设置条件断点**：
   - 右键点击断点（红色圆点）
   - 选择"编辑断点"
   - 输入条件，例如：`email === 'test@example.com'`

2. **测试**：
   - 只有当条件满足时，程序才会暂停

### 日志点 (Logpoints)

1. **设置日志点**：
   - 右键点击行号
   - 选择"添加日志点"
   - 输入要输出的消息，例如：`User email: {email}`

2. **测试**：
   - 程序不会暂停，但会在调试控制台输出日志

### 监视表达式

1. **添加监视**：
   - 在"监视"面板点击 `+`
   - 输入表达式，例如：
     - `process.env.DATABASE_HOST`
     - `user?.email`
     - `loginInput.password.length`

2. **测试**：
   - 在任何断点处都可以看到这些表达式的值

## 常见问题排查

### 问题 1: 断点显示灰色，无法命中

**原因**：源码映射未正确配置或代码未重新构建

**解决**：
```bash
# 重新构建后端
pnpm --filter api build

# 确保 tsconfig.json 中 sourceMap 为 true
# 已在 apps/web/tsconfig.json 中启用

# 重启调试器
```

### 问题 2: 调试器无法连接

**解决**：
```bash
# 检查端口是否被占用
lsof -i :9229
lsof -i :4000
lsof -i :3000

# 杀死占用进程
kill -9 <PID>

# 重新启动
```

### 问题 3: 数据库连接失败

**解决**：
```bash
# 启动 PostgreSQL
docker-compose up -d postgres

# 检查容器状态
docker ps

# 查看日志
docker logs learning-nest-next-db-dev
```

## 验证清单

完成以下所有测试项：

- [ ] 后端入口文件断点（main.ts）
- [ ] GraphQL Resolver 断点
- [ ] 前端 SSR 断点（page.tsx）
- [ ] Apollo Client 断点
- [ ] 浏览器端组件断点
- [ ] 全栈联调（前端→后端）
- [ ] 条件断点功能
- [ ] 日志点功能
- [ ] 监视表达式功能

## 下一步

完成所有测试后，你就可以：

1. **开发新功能时**：使用调试器理解代码流程
2. **修复 Bug 时**：设置断点定位问题
3. **学习代码时**：单步执行理解架构
4. **性能优化时**：使用 Chrome DevTools 分析

查看更多调试技巧：`docs/DEBUG_SETUP.md`

---

**祝你调试顺利！🎉**
