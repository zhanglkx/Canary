# 🚀 阿里云服务器部署指南

本指南将详细介绍如何将 Canary 项目部署到阿里云服务器。

## 📋 前置要求

### 服务器配置
- **CPU**: 2核心以上
- **内存**: 4GB 以上
- **存储**: 40GB 以上 SSD
- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8
- **网络**: 公网 IP，开放端口 80, 443, 22

### 本地环境
- Node.js >= 20
- pnpm >= 9
- Docker
- SSH 客户端

## 🔧 服务器初始化

### 1. 购买阿里云 ECS 实例

1. 登录阿里云控制台
2. 选择 **云服务器 ECS**
3. 点击 **创建实例**
4. 配置实例：
   - **实例规格**: ecs.c6.large (2vCPU 4GB)
   - **镜像**: Ubuntu 20.04 64位
   - **存储**: 40GB ESSD云盘
   - **网络**: 专有网络 VPC
   - **安全组**: 开放 22, 80, 443 端口

### 2. 配置安全组

在阿里云控制台配置安全组规则：

```
入方向规则:
- SSH: 22/22, 0.0.0.0/0
- HTTP: 80/80, 0.0.0.0/0  
- HTTPS: 443/443, 0.0.0.0/0
- 自定义: 3000/3000, 0.0.0.0/0 (开发测试用)
- 自定义: 4000/4000, 0.0.0.0/0 (开发测试用)
```

### 3. 连接服务器

```bash
# 使用 SSH 连接服务器
ssh root@your-server-ip

# 或使用密钥文件
ssh -i your-key.pem root@your-server-ip
```

## 🛠️ 服务器环境配置

### 1. 更新系统

```bash
# Ubuntu
apt update && apt upgrade -y

# CentOS
yum update -y
```

### 2. 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动 Docker 服务
systemctl enable docker
systemctl start docker

# 验证安装
docker --version
```

### 3. 安装 Docker Compose

```bash
# 下载 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 4. 安装其他工具

```bash
# Ubuntu
apt install -y curl wget git unzip

# CentOS  
yum install -y curl wget git unzip
```

## 📦 部署方式

### 方式一：自动化脚本部署（推荐）

1. **配置部署脚本**

```bash
# 在本地项目根目录
cd /path/to/your/canary-project

# 编辑部署脚本配置
vim deploy/aliyun-deploy.sh

# 修改以下变量
SERVER_USER="root"
SERVER_HOST="your-server-ip"  # 替换为你的服务器IP
```

2. **执行部署**

```bash
# 给脚本执行权限
chmod +x deploy/aliyun-deploy.sh

# 执行部署
./deploy/aliyun-deploy.sh
```

### 方式二：手动部署

1. **构建项目**

```bash
# 安装依赖
pnpm install --frozen-lockfile

# 构建项目
pnpm build
```

2. **创建部署包**

```bash
# 创建部署目录
mkdir deployment

# 复制必要文件
cp -r apps/ deployment/
cp -r libs/ deployment/
cp package.json pnpm-workspace.yaml pnpm-lock.yaml deployment/
cp tsconfig.base.json deployment/
cp docker-compose.prod.yml deployment/docker-compose.yml
cp nginx.conf deployment/
cp env.production.example deployment/

# 打包
tar -czf canary-deployment.tar.gz -C deployment .
```

3. **上传到服务器**

```bash
# 上传部署包
scp canary-deployment.tar.gz root@your-server-ip:/opt/

# 连接服务器
ssh root@your-server-ip

# 创建项目目录
mkdir -p /opt/canary
cd /opt/canary

# 解压部署包
tar -xzf /opt/canary-deployment.tar.gz
```

4. **配置环境变量**

```bash
# 复制环境配置文件
cp env.production.example .env.production

# 编辑环境配置
vim .env.production
```

配置内容：

```bash
# 数据库配置
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_secure_password_123
DATABASE_NAME=canary_production

# JWT 配置
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production_123456
JWT_EXPIRATION=7d

# 支付配置（如果需要）
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# 前端配置
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/graphql

# 其他配置
NODE_ENV=production
PORT=4000
```

5. **启动服务**

```bash
# 启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 🌐 域名和 SSL 配置

### 1. 域名解析

在域名服务商处添加 A 记录：

```
类型: A
主机记录: @
记录值: your-server-ip
TTL: 600
```

### 2. SSL 证书配置

#### 使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
apt install -y certbot

# 申请证书
certbot certonly --standalone -d your-domain.com

# 证书路径
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### 使用阿里云 SSL 证书

1. 在阿里云控制台申请免费 SSL 证书
2. 下载 Nginx 格式证书
3. 上传到服务器 `/opt/canary/ssl/` 目录

### 3. 更新 Nginx 配置

```bash
# 编辑 Nginx 配置
vim /opt/canary/nginx.conf

# 更新域名和证书路径
server_name your-domain.com;
ssl_certificate /opt/canary/ssl/cert.pem;
ssl_certificate_key /opt/canary/ssl/key.pem;
```

### 4. 重启服务

```bash
cd /opt/canary
docker-compose restart nginx
```

## 🔄 CI/CD 自动化部署

### 1. 配置 GitHub Actions

项目已包含 `.github/workflows/deploy.yml` 配置文件。

### 2. 设置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

```
SERVER_HOST: your-server-ip
SERVER_USER: root
SERVER_SSH_KEY: your-private-ssh-key
SERVER_PORT: 22
```

### 3. 生成 SSH 密钥

```bash
# 在本地生成密钥对
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 将公钥添加到服务器
ssh-copy-id root@your-server-ip

# 将私钥内容添加到 GitHub Secrets
cat ~/.ssh/id_rsa
```

### 4. 自动部署

推送代码到 main 分支即可触发自动部署：

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

## 📊 监控和维护

### 1. 服务状态监控

```bash
# 查看容器状态
docker-compose ps

# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres
```

### 2. 数据库备份

```bash
# 创建备份脚本
cat > /opt/canary/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/canary"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T postgres pg_dump -U postgres canary_production > $BACKUP_DIR/db_backup_$DATE.sql

# 保留最近30天的备份
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +30 -delete

echo "数据库备份完成: $BACKUP_DIR/db_backup_$DATE.sql"
EOF

chmod +x /opt/canary/backup.sh

# 设置定时备份
crontab -e
# 添加：0 2 * * * /opt/canary/backup.sh
```

### 3. 日志轮转

```bash
# 配置 Docker 日志轮转
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

### 4. 系统监控

```bash
# 安装 htop
apt install -y htop

# 监控系统资源
htop

# 监控磁盘使用
df -h

# 监控网络连接
netstat -tulpn
```

## 🚨 故障排除

### 常见问题

1. **容器启动失败**
```bash
# 查看详细错误
docker-compose logs api
docker-compose logs web

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

2. **数据库连接失败**
```bash
# 检查数据库容器
docker-compose exec postgres psql -U postgres -d canary_production

# 检查网络连接
docker network ls
docker network inspect canary_canary-network
```

3. **端口占用**
```bash
# 查看端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000

# 杀死占用进程
kill -9 <pid>
```

4. **内存不足**
```bash
# 查看内存使用
free -h

# 清理 Docker 资源
docker system prune -a
```

### 性能优化

1. **数据库优化**
```sql
-- 连接数据库
docker-compose exec postgres psql -U postgres -d canary_production

-- 查看连接数
SELECT count(*) FROM pg_stat_activity;

-- 优化配置
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

2. **应用优化**
```bash
# 增加 Node.js 内存限制
# 在 docker-compose.yml 中添加环境变量
NODE_OPTIONS: "--max-old-space-size=2048"
```

## 📞 技术支持

如果在部署过程中遇到问题，可以：

1. 查看项目文档：`docs/` 目录
2. 检查日志文件：`docker-compose logs`
3. 查看 GitHub Issues
4. 联系技术支持

## 🎉 部署完成

部署成功后，你可以通过以下地址访问应用：

- **前端应用**: https://your-domain.com
- **GraphQL API**: https://your-domain.com/graphql
- **Apollo Studio**: https://your-domain.com/apollo-studio

恭喜！你已经成功将 Canary 项目部署到阿里云服务器！
