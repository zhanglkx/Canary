# 后端 Debug 模式使用指南

## 概述

本项目已配置了多种调试方式，方便开发者在不同场景下调试 NestJS GraphQL API。

## 调试方式

### 1. VS Code 集成调试 (推荐)

#### 启动方式
1. 在 VS Code 中打开项目
2. 按 `F5` 或点击调试面板中的"开始调试"
3. 选择 "Debug NestJS API" 配置

#### 可用配置
- **Debug NestJS API**: 标准调试模式，支持热重载
- **Debug NestJS API (Attach)**: 附加到已运行的调试进程
- **Debug NestJS API (Production Build)**: 调试生产构建版本

#### 功能特性
- ✅ 断点调试
- ✅ 变量查看
- ✅ 调用栈追踪
- ✅ 热重载
- ✅ TypeScript 源码映射

### 2. 命令行调试

#### 从项目根目录启动
```bash
# 标准调试模式 (端口 9229)
pnpm debug:api

# 调试模式 + 断点暂停 (启动时暂停等待调试器)
pnpm debug:api:brk

# 生产构建调试
pnpm debug:api:prod
```

#### 从 API 目录启动
```bash
cd apps/api

# 标准调试模式
pnpm debug

# 调试模式 + 断点暂停
pnpm debug:brk

# 生产构建调试
pnpm debug:prod
```

### 3. Chrome DevTools 调试

#### 启动步骤
1. 使用命令行启动调试模式：
   ```bash
   pnpm debug:api
   ```

2. 打开 Chrome 浏览器，访问：
   ```
   chrome://inspect
   ```

3. 点击 "Open dedicated DevTools for Node"

4. 在 DevTools 中设置断点和调试

### 4. 其他调试工具

#### WebStorm/IntelliJ IDEA
1. 创建 Node.js 运行配置
2. 设置以下参数：
   - **JavaScript file**: `node_modules/@nestjs/cli/bin/nest.js`
   - **Application parameters**: `start --debug --watch`
   - **Working directory**: `apps/api`

#### Visual Studio
使用 Node.js Tools for Visual Studio 连接到调试端口 9229

## 调试端口

- **默认调试端口**: 9229
- **API 服务端口**: 4000
- **GraphQL Playground**: http://localhost:4000/graphql

## 环境变量

调试模式下的关键环境变量：

```bash
NODE_ENV=development
PORT=4000
DEBUG_PORT=9229
FRONTEND_URL=http://localhost:3000
```

## 常用调试技巧

### 1. 设置断点
- 在 VS Code 中点击行号左侧设置断点
- 使用 `debugger;` 语句在代码中设置断点

### 2. 查看 GraphQL 查询
访问 http://localhost:4000/graphql 使用 GraphQL Playground

### 3. 日志调试
```typescript
console.log('调试信息:', variable);
console.error('错误信息:', error);
```

### 4. 数据库调试
- 检查 `dev.db` SQLite 数据库文件
- 使用 TypeORM 日志功能

## 故障排除

### 端口被占用
```bash
# 查找占用端口的进程
lsof -i :4000
lsof -i :9229

# 终止进程
kill -9 <PID>
```

### 调试器无法连接
1. 确保使用了 `--debug` 或 `--inspect` 参数
2. 检查防火墙设置
3. 确认端口 9229 未被其他进程占用

### 热重载不工作
1. 确保使用了 `--watch` 参数
2. 检查文件监听权限
3. 重启调试会话

## 性能调试

### 内存使用监控
```bash
# 启动时添加内存监控
node --inspect --max-old-space-size=4096 dist/main.js
```

### CPU 性能分析
在 Chrome DevTools 中使用 Profiler 标签页进行 CPU 性能分析。

## 安全注意事项

⚠️ **重要**: 调试模式仅用于开发环境，生产环境中请勿启用调试端口！

- 调试端口 9229 不应在生产环境中暴露
- 使用防火墙限制调试端口访问
- 生产部署时移除所有 `debugger;` 语句
