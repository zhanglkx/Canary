# 安装与配置指南

## 前置要求

### 系统要求
- **操作系统**: macOS, Linux, Windows
- **Node.js**: 20.x 或更高版本
- **npm**: 10.x 或更高版本（或 yarn, pnpm）
- **Git**: 2.x 或更高版本
- **可选**: Docker 20.x, Docker Compose 2.x

### 验证环境

```bash
# 检查 Node.js
node --version
# 应该输出: v20.x.x 或更高

# 检查 npm
npm --version
# 应该输出: 10.x.x 或更高

# 检查 Git
git --version
# 应该输出: git version x.x.x
```

---

## 安装步骤

### 1. 安装 pnpm（推荐包管理器）

```bash
# 使用 npm 全局安装 pnpm
npm install -g pnpm@latest

# 验证安装
pnpm --version
# 应该输出: 9.15.0 或更高
```

### 2. 克隆项目

```bash
# 使用 git 克隆项目
git clone <repository-url> Canary
cd Canary

# 或者直接进入现有项目目录
cd /path/to/Canary
```

### 3. 安装依赖

```bash
# 安装所有包的依赖（包括根目录和子包）
pnpm install

# 安装时间: 2-5 分钟（取决于网络速度和机器性能）
```

验证安装成功：
```bash
# 检查 node_modules 是否已创建
ls -la node_modules/

# 检查工作区依赖
pnpm list
```

### 4. 设置环境变量

```bash
# 复制根目录的环境变量模板
cp .env.example .env

# 如果存在后端环境文件
cp apps/backend/.env.local apps/backend/.env || true

# 如果存在前端环境文件
cp apps/frontend/.env.local apps/frontend/.env || true
```

编辑 `.env` 文件（如需要）：
```env
NODE_ENV=development
JWT_SECRET=your-secret-key-here-change-in-production
DATABASE_URL=sqlite:./db.sqlite
```

### 5. 验证安装

```bash
# 检查 TypeScript 编译
pnpm run type-check

# 检查代码格式
pnpm lint

# 如果上面两个命令都通过，说明安装成功
echo "✅ 安装完成！"
```

---

## 首次运行

### 启动开发服务器

```bash
# 同时启动前端和后端
pnpm dev

# 前端会在 http://localhost:3000 启动
# 后端会在 http://localhost:4000 启动
# 按 Ctrl+C 停止服务器
```

### 验证服务器运行

在另一个终端中：

```bash
# 检查前端
curl http://localhost:3000

# 检查后端健康状态
curl http://localhost:4000/api/health
# 应该返回: {"status":"ok","timestamp":"..."}

# 查看 API 文档
curl http://localhost:4000/api/docs
```

---

## 项目结构

```
Canary/
├── apps/
│   ├── frontend/              # Next.js 16 应用
│   │   ├── src/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── backend/               # NestJS 11 应用
│       ├── src/
│       ├── package.json
│       ├── nest-cli.json
│       └── tsconfig.json
│
├── libs/
│   ├── shared-types/          # 共享类型定义
│   │   ├── package.json
│   │   └── src/index.ts
│   │
│   └── utils/                 # 共享工具函数
│       ├── package.json
│       └── src/index.ts
│
├── docs/                      # 文档目录
├── package.json              # 根 package.json
├── pnpm-workspace.yaml       # pnpm 工作区配置
├── turbo.json               # Turbo 构建缓存配置
└── .env.example             # 环境变量模板
```

---

## 包管理器命令

### 使用 pnpm

```bash
# 安装依赖
pnpm install

# 添加依赖到所有工作区
pnpm add package-name

# 添加依赖到特定工作区
pnpm -F @canary/frontend add axios
pnpm -F @canary/backend add @nestjs/swagger

# 在所有工作区运行命令
pnpm -r run script-name

# 在特定工作区运行命令
pnpm -F @canary/frontend dev
pnpm -F @canary/backend dev

# 查看依赖树
pnpm list
```

### 使用 npm （如果不用 pnpm）

```bash
# 在根目录安装
npm install

# 在子工作区安装
npm --prefix apps/frontend install
npm --prefix apps/backend install
```

---

## 开发工作流

### 单独运行各应用

```bash
# 终端 1: 运行前端
pnpm -F @canary/frontend dev

# 终端 2: 运行后端
pnpm -F @canary/backend dev

# 访问:
# 前端: http://localhost:3000
# 后端: http://localhost:4000
```

### 构建生产版本

```bash
# 构建所有应用
pnpm build

# 构建特定应用
pnpm -F @canary/frontend build
pnpm -F @canary/backend build

# 输出位置:
# 前端: apps/frontend/.next/
# 后端: apps/backend/dist/
```

### 运行生产版本

```bash
# 前端生产服务器
pnpm -F @canary/frontend start

# 后端生产服务器
pnpm -F @canary/backend start:prod
```

---

## 代码质量检查

```bash
# 运行所有检查
pnpm run lint && pnpm run type-check && pnpm test

# 只运行 ESLint
pnpm lint

# 只运行 TypeScript 类型检查
pnpm run type-check

# 只运行测试
pnpm test

# 运行测试并持续监听
pnpm run test:watch

# 自动格式化代码
pnpm -r exec prettier --write .
```

---

## Docker 设置

### 使用 Docker Compose

```bash
# 启动所有服务（PostgreSQL, Backend, Frontend）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止所有服务
docker-compose down

# 停止并删除数据
docker-compose down -v
```

### 服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| PostgreSQL | localhost:5432 | 数据库 |
| Backend | http://localhost:4000 | NestJS API |
| Frontend | http://localhost:3000 | Next.js 应用 |
| API Docs | http://localhost:4000/api/docs | Swagger 文档 |

---

## 数据库初始化

### SQLite（默认）

```bash
# 数据库会在首次启动时自动创建
# 文件位置: apps/backend/db.sqlite

# 重置数据库
rm apps/backend/db.sqlite
pnpm -F @canary/backend dev  # 重新启动自动创建
```

### PostgreSQL（可选）

```bash
# 使用 Docker Compose 启动 PostgreSQL
docker-compose up -d postgres

# 更新 DATABASE_URL 环境变量
# .env 中改为：
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/canary_db
```

---

## 常见问题排查

### 问题 1: 找不到命令

```bash
# 错误: command not found: pnpm

# 解决方案:
npm install -g pnpm@latest
```

### 问题 2: 端口已被占用

```bash
# 错误: listen EADDRINUSE: address already in use :::3000

# 查找占用端口的进程
lsof -i :3000
lsof -i :4000

# 关闭进程
kill -9 <PID>

# 或者改变端口
PORT=3001 pnpm -F @canary/frontend dev
```

### 问题 3: 依赖冲突

```bash
# 清除所有缓存和 node_modules
pnpm run clean
pnpm store prune

# 重新安装
pnpm install
```

### 问题 4: 数据库连接错误

```bash
# 确保 DATABASE_URL 环境变量正确设置
cat .env | grep DATABASE_URL

# 对于 SQLite，确保文件路径正确
# 对于 PostgreSQL，确保数据库服务正在运行
docker-compose ps
```

---

## IDE 设置

### VS Code

推荐安装的扩展：
- ESLint
- Prettier - Code formatter
- Thunder Client (API 测试)
- REST Client (HTTP 请求)
- TypeScript Vue Plugin (Volar)

#### VS Code settings.json

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## 性能优化

### 构建优化

```bash
# 使用 Turbo 构建缓存（自动启用）
pnpm build

# 查看构建性能
pnpm build --profile
```

### 开发优化

```bash
# 只安装必要的依赖
pnpm install --prod

# 使用链接的依赖（已在 pnpm-workspace 中配置）
pnpm list --depth=0
```

---

## 升级依赖

```bash
# 检查过时的包
pnpm outdated

# 升级到最新版本
pnpm update --latest

# 交互式升级
pnpm update --latest --interactive

# 升级特定工作区
pnpm -F @canary/frontend update --latest
```

---

## 下一步

- 🚀 启动开发服务器: `pnpm dev`
- 📖 阅读 [学习路线](../guides/LEARNING_GUIDE.md)
- 🔧 查看 [后端开发指南](../backend/DEVELOPMENT.md)
- 🎨 查看 [前端开发指南](../frontend/DEVELOPMENT.md)

---

**最后更新**: 2025-12-20
