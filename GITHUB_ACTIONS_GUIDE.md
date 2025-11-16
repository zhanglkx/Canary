# GitHub Actions CI/CD 配置指南

本项目已配置自动化 CI/CD 流程，可在代码推送或 PR 合并时自动部署到阿里云服务器。

## 🎯 工作流程说明

### 1. CI 工作流 (`.github/workflows/ci.yml`)

**触发条件**：
- 推送到 `main`、`master` 或 `develop` 分支
- 创建或更新 Pull Request 到 `main` 或 `master` 分支

**执行任务**：
- ✅ 代码质量检查 (Lint)
- ✅ 后端测试 (API Tests with PostgreSQL)
- ✅ 前端构建测试 (Web Build)
- ✅ Docker 镜像构建测试

### 2. 部署工作流 (`.github/workflows/deploy.yml`)

**触发条件**：
- 直接推送到 `main` 或 `master` 分支
- Pull Request 合并到 `main` 或 `master` 分支

**执行步骤**：
1. 检出代码
2. 打包项目文件
3. 上传到阿里云服务器
4. 在服务器上解压和部署
5. 构建 Docker 镜像
6. 启动服务
7. 验证部署结果

## ⚙️ GitHub Secrets 配置

在开始使用 CI/CD 之前，需要在 GitHub 仓库中配置以下 Secrets：

### 配置步骤

1. 打开 GitHub 仓库：https://github.com/zhanglkx/Canary

2. 点击 **Settings** → **Secrets and variables** → **Actions**

3. 点击 **New repository secret** 添加以下密钥：

#### Secret 1: ALIYUN_HOST
- **Name**: `ALIYUN_HOST`
- **Value**: `8.159.144.140`
- **说明**: 阿里云服务器的公网 IP

#### Secret 2: ALIYUN_SSH_KEY
- **Name**: `ALIYUN_SSH_KEY`
- **Value**: 你的 SSH 私钥内容
- **获取方法**:
  ```bash
  cat ~/.ssh/aliyun_key.pem
  ```
- **重要**: 复制完整的私钥内容，包括开头的 `-----BEGIN RSA PRIVATE KEY-----` 和结尾的 `-----END RSA PRIVATE KEY-----`

### 验证配置

配置完成后，你应该看到两个 Secrets：
- ✅ ALIYUN_HOST
- ✅ ALIYUN_SSH_KEY

## 🚀 使用方法

### 方式 1：直接推送到主分支（自动部署）

```bash
# 提交代码
git add .
git commit -m "feat: 添加新功能"

# 推送到主分支（会触发 CI/CD）
git push origin main
```

### 方式 2：通过 Pull Request（推荐）

```bash
# 创建新分支
git checkout -b feature/new-feature

# 提交代码
git add .
git commit -m "feat: 添加新功能"

# 推送到新分支
git push origin feature/new-feature

# 在 GitHub 上创建 Pull Request
# PR 创建时会触发 CI 测试
# PR 合并后会自动触发部署
```

## 📊 查看执行状态

### 在 GitHub 上查看

1. 打开仓库：https://github.com/zhanglkx/Canary
2. 点击顶部的 **Actions** 标签
3. 查看工作流执行历史和日志

### 工作流状态徽章

你可以在 README.md 中添加状态徽章：

```markdown
[![CI](https://github.com/zhanglkx/Canary/workflows/CI%20-%20Build%20and%20Test/badge.svg)](https://github.com/zhanglkx/Canary/actions)
[![Deploy](https://github.com/zhanglkx/Canary/workflows/Deploy%20to%20Aliyun%20ECS/badge.svg)](https://github.com/zhanglkx/Canary/actions)
```

## 🔍 工作流详细说明

### CI 工作流

#### 1. 代码检查 (Lint)
```yaml
- 安装依赖
- 运行 ESLint 和 Prettier 检查
- 报告代码质量问题
```

#### 2. 后端测试
```yaml
- 启动 PostgreSQL 测试数据库
- 构建 API 项目
- 运行单元测试和集成测试
```

#### 3. 前端构建测试
```yaml
- 安装依赖
- 构建 Next.js 应用
- 验证构建是否成功
```

#### 4. Docker 镜像构建测试
```yaml
- 构建 API Docker 镜像
- 构建 Web Docker 镜像
- 使用缓存加速构建
```

### 部署工作流

#### 1. 打包项目
```bash
tar czf canary-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.next' \
  --exclude='.git' \
  .
```

#### 2. 上传到服务器
```bash
scp canary-deploy.tar.gz root@SERVER:/opt/
```

#### 3. 服务器部署脚本
```bash
# 停止现有服务
docker compose down

# 清理资源
docker system prune -f

# 构建并启动新服务
docker compose up -d --build

# 验证部署
docker ps
curl http://localhost:4000/health
```

## 🛠️ 自定义配置

### 修改部署目录

编辑 `.github/workflows/deploy.yml`，修改部署目录：

```yaml
# 原来
mkdir -p /opt/canary
cd /opt/canary

# 修改为
mkdir -p /your/custom/path
cd /your/custom/path
```

### 添加环境变量

在部署脚本中添加环境变量检查：

```yaml
- name: 检查环境变量
  run: |
    ssh ... << 'ENDSSH'
    if [ ! -f /opt/canary/.env.production ]; then
      echo "错误: .env.production 文件不存在"
      exit 1
    fi
    ENDSSH
```

### 添加通知

使用 GitHub Actions 的通知功能：

```yaml
- name: 发送通知
  if: success()
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.repos.createCommitComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        commit_sha: context.sha,
        body: '🎉 部署成功！'
      })
```

## 🔒 安全建议

### 1. 保护 Secrets
- ❌ 不要在代码中硬编码密钥
- ✅ 使用 GitHub Secrets 存储敏感信息
- ✅ 定期轮换密钥

### 2. 限制分支保护
```
Settings → Branches → Add rule
- Branch name pattern: main
- Require pull request reviews before merging
- Require status checks to pass before merging
```

### 3. SSH 密钥安全
- 使用专用的 SSH 密钥（不要使用个人密钥）
- 限制密钥权限（只允许访问部署目录）
- 定期更新密钥

## 📝 常见问题

### Q1: 部署失败，提示 SSH 连接被拒绝

**解决方案**：
1. 检查 ALIYUN_HOST 是否正确
2. 检查 ALIYUN_SSH_KEY 是否完整
3. 确认服务器 SSH 服务正常运行
4. 检查安全组是否允许 GitHub IP 访问

### Q2: Docker 构建失败

**解决方案**：
```bash
# SSH 登录服务器
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 检查磁盘空间
df -h

# 清理 Docker 资源
docker system prune -a -f

# 手动构建测试
cd /opt/canary
docker compose -f docker-compose.prod.yml build
```

### Q3: 服务启动失败

**解决方案**：
```bash
# 查看容器日志
docker logs canary-api-prod
docker logs canary-web-prod

# 检查环境变量
docker exec canary-api-prod env

# 检查数据库连接
docker exec canary-api-prod nc -zv postgres 5432
```

### Q4: CI 测试通过但部署失败

**可能原因**：
- 服务器磁盘空间不足
- 端口被占用
- 环境变量配置错误
- 数据库未正确初始化

**排查步骤**：
1. 查看 Actions 日志
2. SSH 登录服务器检查
3. 手动运行部署命令测试

## 🎨 工作流可视化

```
┌─────────────────────────────────────────────────────────┐
│                    Push to main/master                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─────────────────────────────────────┐
                     │                                     │
            ┌────────▼────────┐                  ┌─────────▼────────┐
            │   CI Workflow   │                  │ Deploy Workflow  │
            │                 │                  │                  │
            │ • Lint          │                  │ • Package        │
            │ • Test API      │                  │ • Upload         │
            │ • Test Web      │                  │ • Deploy         │
            │ • Test Docker   │                  │ • Verify         │
            └────────┬────────┘                  └─────────┬────────┘
                     │                                     │
                     ▼                                     ▼
            ┌────────────────┐                  ┌──────────────────┐
            │  All Tests Pass │                  │ Service Running  │
            └────────────────┘                  └──────────────────┘
```

## 📖 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [阿里云 ECS 文档](https://help.aliyun.com/product/25365.html)

## 🎯 下一步

1. **配置 GitHub Secrets** ✅
2. **测试 CI/CD 流程** - 推送一个小改动验证
3. **监控部署状态** - 在 Actions 页面查看执行结果
4. **优化工作流** - 根据需要添加更多测试和检查
5. **添加状态徽章** - 在 README 中展示构建状态

## 💡 高级功能

### 环境分离

创建不同环境的部署工作流：

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches:
      - develop

# .github/workflows/deploy-production.yml
on:
  push:
    branches:
      - main
```

### 回滚机制

添加回滚功能：

```yaml
- name: 备份当前版本
  run: |
    ssh ... "
    cd /opt/canary
    tar czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .
    "

- name: 部署失败时回滚
  if: failure()
  run: |
    ssh ... "
    cd /opt/canary
    # 恢复最新备份
    "
```

### 蓝绿部署

实现零停机部署：

```yaml
- name: 蓝绿部署
  run: |
    # 启动新版本（绿）
    docker compose -f docker-compose.green.yml up -d
    # 健康检查
    # 切换流量
    # 停止旧版本（蓝）
```

---

**需要帮助？** 请查看 [GitHub Actions 日志](https://github.com/zhanglkx/Canary/actions) 或提交 Issue。
