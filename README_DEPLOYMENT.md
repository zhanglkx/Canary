# 🚀 Canary 项目部署指南

这是一个基于 **NestJS + Next.js + GraphQL + PostgreSQL** 的全栈电商应用项目。

## 📊 项目架构

```
Canary/
├── apps/
│   ├── api/          # NestJS GraphQL API 后端
│   └── web/          # Next.js 前端应用
├── libs/
│   └── shared/       # 共享类型和工具
├── deploy/           # 部署脚本
├── scripts/          # 构建脚本
└── docs/            # 详细文档
```

## 🛠️ 技术栈

- **后端**: NestJS + GraphQL + TypeORM + PostgreSQL
- **前端**: Next.js 15 + Apollo Client + Tailwind CSS
- **数据库**: PostgreSQL 16
- **容器化**: Docker + Docker Compose
- **部署**: 阿里云 ECS + Nginx

## 🚀 快速开始

### 1. 环境要求

```bash
node --version  # >= 20
pnpm --version  # >= 9
docker --version
```

### 2. 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd Canary

# 安装依赖
pnpm install

# 启动数据库
docker compose -f docker-compose.dev.yml up -d

# 启动开发服务
pnpm dev
```

访问地址：
- 前端: http://localhost:3000
- API: http://localhost:4000/graphql
- Apollo Studio: http://localhost:4000/apollo-studio

### 3. 项目构建

```bash
# 使用构建脚本（推荐）
./scripts/build.sh --prod --test

# 或手动构建
pnpm build
```

## 🌐 部署方案

### 方案一：自动化部署（推荐）

1. **配置服务器信息**
```bash
# 编辑部署脚本
vim deploy/aliyun-deploy.sh

# 修改服务器配置
SERVER_USER="root"
SERVER_HOST="your-server-ip"
```

2. **执行一键部署**
```bash
./deploy/aliyun-deploy.sh
```

### 方案二：Docker 容器化部署

1. **准备环境配置**
```bash
# 复制环境配置文件
cp env.production.example .env.production

# 编辑配置
vim .env.production
```

2. **启动生产环境**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 方案三：CI/CD 自动化

项目已配置 GitHub Actions，推送到 main 分支即可自动部署。

需要在 GitHub 仓库设置中配置以下 Secrets：
- `SERVER_HOST`: 服务器 IP
- `SERVER_USER`: 服务器用户名
- `SERVER_SSH_KEY`: SSH 私钥
- `SERVER_PORT`: SSH 端口

## 📋 阿里云服务器配置

### 1. 服务器规格建议

- **CPU**: 2核心以上
- **内存**: 4GB 以上
- **存储**: 40GB 以上 SSD
- **网络**: 公网 IP，开放端口 80, 443, 22

### 2. 安全组配置

```
入方向规则:
- SSH: 22/22, 0.0.0.0/0
- HTTP: 80/80, 0.0.0.0/0
- HTTPS: 443/443, 0.0.0.0/0
```

### 3. 服务器初始化

```bash
# 连接服务器
ssh root@your-server-ip

# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

## 🔧 环境配置

### 生产环境变量

```bash
# 数据库配置
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=canary_production

# JWT 配置
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRATION=7d

# 前端配置
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/graphql

# 支付配置（可选）
STRIPE_SECRET_KEY=sk_live_xxx
PAYPAL_CLIENT_ID=xxx
```

## 🌐 域名和 SSL

### 1. 域名解析

在域名服务商处添加 A 记录：
```
类型: A
主机记录: @
记录值: your-server-ip
```

### 2. SSL 证书

使用 Let's Encrypt 免费证书：
```bash
# 安装 Certbot
apt install -y certbot

# 申请证书
certbot certonly --standalone -d your-domain.com
```

或使用阿里云 SSL 证书服务。

## 📊 监控和维护

### 1. 服务状态检查

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看资源使用
docker stats
```

### 2. 数据库备份

```bash
# 手动备份
docker-compose exec postgres pg_dump -U postgres canary_production > backup.sql

# 自动备份（添加到 crontab）
0 2 * * * /opt/canary/backup.sh
```

### 3. 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🚨 故障排除

### 常见问题

1. **容器启动失败**
```bash
docker-compose logs api
docker-compose logs web
```

2. **数据库连接失败**
```bash
docker-compose exec postgres psql -U postgres
```

3. **端口占用**
```bash
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000
```

4. **内存不足**
```bash
free -h
docker system prune -a
```

## 📚 详细文档

- [详细部署指南](docs/ALIYUN_DEPLOYMENT_GUIDE.md)
- [项目架构说明](docs/ARCHITECTURE.md)
- [功能特性介绍](docs/FEATURES.md)
- [快速开始指南](docs/QUICKSTART.md)

## 🎯 部署检查清单

- [ ] 服务器环境配置完成
- [ ] 域名解析配置正确
- [ ] SSL 证书安装成功
- [ ] 环境变量配置完整
- [ ] 数据库连接正常
- [ ] 应用服务启动成功
- [ ] 前端页面访问正常
- [ ] API 接口响应正常
- [ ] 监控和备份配置完成

## 📞 技术支持

如遇到问题，请：
1. 查看项目文档
2. 检查应用日志
3. 提交 GitHub Issue

---

🎉 **恭喜！完成部署后，你将拥有一个完整的全栈电商应用！**

# 1. 创建 Docker 守护进程配置
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://99e0hvuv.mirror.aliyuncs.com"]
}
EOF

# 2. 重启 Docker 服务（关键步骤！）
sudo systemctl daemon-reload
sudo systemctl restart docker

# 3. 验证配置
docker info | grep "Registry Mirrors" -A 2
# 应显示：
#  Registry Mirrors:
#   https://99e0hvuv.mirror.aliyuncs.com/

mv /Users/zlk/Downloads/Iterm2.pem ~/.ssh/aliyun_key.pem

ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140