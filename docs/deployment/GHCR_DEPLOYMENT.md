# GHCR 部署方案说明

## 概述

本项目使用 GitHub Container Registry (GHCR) 作为 Docker 镜像仓库，实现可靠的自动化部署。

## 与旧方案的区别

| 特性 | 旧方案（远程构建） | 新方案（GHCR） |
|------|-------------------|----------------|
| 构建位置 | 远程服务器 | GitHub Actions |
| SSH 连接时间 | 20-30 分钟 | 2-3 分钟 |
| 失败率 | 高（SSH 超时） | 低 |
| 服务器资源占用 | 高 | 低 |
| 镜像缓存 | 无 | 有（GHA 缓存） |

## 工作流程

```
代码推送 → GitHub Actions 构建镜像 → 推送到 GHCR → SSH 到服务器 → 拉取镜像 → 启动服务
```

## 配置步骤

### 1. GitHub Secrets 配置

在 GitHub 仓库 Settings → Secrets → Actions 中配置：

| Secret 名称 | 描述 | 必需 |
|------------|------|------|
| `SERVER_HOST` | 服务器 IP | 是 |
| `SERVER_USER` | SSH 用户名 | 是 |
| `SSH_PRIVATE_KEY` | SSH 私钥 | 是 |
| `NEXT_PUBLIC_API_URL` | API 地址 | 否 |

### 2. 服务器准备

```bash
# 1. 创建项目目录
sudo mkdir -p /opt/canary
cd /opt/canary

# 2. 创建环境配置文件
cat > .env.production << 'EOF'
# GHCR 配置
GHCR_OWNER=zhanglkx
IMAGE_TAG=latest

# 数据库配置
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=canary_production

# JWT 配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d

# 其他配置
NEXT_PUBLIC_API_URL=http://your-domain.com/api
FRONTEND_URL=http://your-domain.com
EOF

# 3. 设置权限
chmod 600 .env.production
```

### 3. 触发部署

推送代码到 `main` 或 `master` 分支，或手动触发：

1. 进入 GitHub 仓库 → Actions
2. 选择 "Deploy via GHCR"
3. 点击 "Run workflow"

## 本地测试

### 测试镜像构建

```bash
# API 镜像
docker build -f apps/api/Dockerfile.local -t canary-api:test .

# Web 镜像
docker build -f apps/web/Dockerfile.local -t canary-web:test .
```

### 测试服务启动

```bash
# 设置环境变量
export GHCR_OWNER=zhanglkx
export DATABASE_PASSWORD=test_password
export JWT_SECRET=test_secret

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

## 故障排除

### 镜像拉取失败

```bash
# 检查 GHCR 登录状态
docker login ghcr.io

# 手动拉取镜像测试
docker pull ghcr.io/zhanglkx/canary-api:latest
```

### 服务启动失败

```bash
# 查看容器日志
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs web

# 检查容器状态
docker-compose -f docker-compose.prod.yml ps
```

### GitHub Actions 构建失败

1. 检查 Actions 日志中的具体错误
2. 确认 Dockerfile 路径正确
3. 检查 GHCR 权限配置

## 镜像管理

### 查看已发布的镜像

访问 GitHub 仓库 → Packages 查看所有镜像版本。

### 清理旧镜像

```bash
# 在服务器上清理旧镜像
docker image prune -a --filter "until=168h"
```

## 回滚部署

如需回滚到之前的版本：

```bash
cd /opt/canary

# 指定版本标签
export IMAGE_TAG=abc1234  # 使用 git commit sha

# 拉取指定版本
docker-compose -f docker-compose.prod.yml pull

# 重启服务
docker-compose -f docker-compose.prod.yml up -d
```
