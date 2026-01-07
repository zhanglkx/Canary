# 🔧 CI/CD 策略说明

## 📊 当前架构

### CI（持续集成）- `ci.yml`
用于代码质量检查和基础测试：

```yaml
触发条件: Push/PR 到 main/master/develop
运行内容:
  ✅ 代码质量检查 (Lint)
  ✅ 后端单元测试 (API Tests)
  ✅ 前端构建测试 (Web Build)
  ⚠️ Docker 构建测试 (已禁用)
```

### CD（持续部署）- `deploy.yml`
用于生产环境部署：

```yaml
触发条件: Push 到 main 分支
运行内容:
  1. 在 GitHub Actions 上构建应用
  2. 打包构建结果
  3. 上传到服务器
  4. 使用运行时 Dockerfile 构建镜像
  5. 部署并健康检查
```

## ❓ 为什么禁用 Docker 构建测试？

### 旧方案的问题

原来的 `apps/api/Dockerfile` 和 `apps/web/Dockerfile` 会在容器内：
1. 安装所有依赖（包括 devDependencies）
2. 编译 TypeScript -> JavaScript
3. 构建 Next.js 应用

**问题**：
- ❌ 构建时间长（5-8分钟）
- ❌ 容易因依赖问题失败
- ❌ 消耗大量 CI 资源
- ❌ 在 CI 和服务器上重复构建

### 新方案的优势

使用**预构建 + 运行时部署**策略：

```
GitHub Actions (构建)
    ↓
  构建结果
    ↓
  上传到服务器
    ↓
运行时 Dockerfile (仅复制文件)
    ↓
  快速部署
```

**优势**：
- ✅ 构建一次，到处使用
- ✅ GitHub Actions 资源充足，构建快速
- ✅ 服务器部署只需 30-60 秒
- ✅ 减少 90%+ 部署时间
- ✅ 更可靠，失败率低

## 📝 文件对比

### 旧的 Dockerfile（已废弃）
```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine
RUN pnpm install --frozen-lockfile
RUN pnpm build  # ❌ 在容器内构建，慢且易失败
```

### 新的 Dockerfile.runtime（使用中）
```dockerfile
# apps/api/Dockerfile.runtime
FROM node:20-alpine
COPY apps/api/dist ./apps/api/dist  # ✅ 只复制预构建结果
COPY libs/shared ./libs/shared
# 快速启动，不需要编译
```

## 🎯 CI/CD 工作流

### 开发流程

```bash
# 1. 开发和测试
git checkout -b feature/new-feature
# ... 编码 ...
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 2. 创建 PR
# GitHub 会自动运行 CI 检查：
#   - Lint
#   - API Tests  
#   - Web Build

# 3. 合并到 main
git checkout main
git merge feature/new-feature
git push origin main

# 4. 自动部署
# GitHub 会自动运行部署流程：
#   - 构建应用
#   - 上传到服务器
#   - 部署新版本
```

### 测试和部署时间

| 阶段 | 时间 | 说明 |
|------|------|------|
| **CI 检查** | 2-3 分钟 | Lint + Tests + Build |
| **CD 构建** | 2-3 分钟 | 在 GitHub Actions 构建 |
| **CD 部署** | 1-2 分钟 | 上传和部署 |
| **总计** | **3-5 分钟** | 从推送到部署完成 |

## 🔄 如果需要 Docker 构建测试

如果你确实需要测试 Docker 构建，可以：

### 方案1：本地测试（推荐）

```bash
# 先本地构建
cd apps/api && pnpm build
cd ../web && pnpm build

# 测试运行时 Dockerfile
docker build -f apps/api/Dockerfile.runtime -t test-api .
docker build -f apps/web/Dockerfile.runtime -t test-web .
```

### 方案2：重新启用 CI Docker 测试

编辑 `.github/workflows/ci.yml`：

```yaml
test-docker:
  name: Docker 构建测试
  runs-on: ubuntu-latest
  if: false  # 改为 if: true 来启用
```

但这会增加 3-5 分钟的 CI 时间。

## 📚 相关文档

- **部署指南**: `DEPLOYMENT.md`
- **快速配置**: `QUICK_SETUP.md`
- **部署工作流**: `.github/workflows/deploy.yml`
- **CI 工作流**: `.github/workflows/ci.yml`

## 💡 最佳实践

1. **开发时**：使用本地构建测试
2. **PR 时**：CI 自动运行代码检查
3. **合并时**：自动部署到生产环境
4. **出问题时**：查看 GitHub Actions 日志
5. **需要回滚**：参考 `DEPLOYMENT.md` 的回滚指南

