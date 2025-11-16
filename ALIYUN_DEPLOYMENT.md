# Canary 项目 - 阿里云服务器部署指南

## 服务器信息

- **公网 IP**: `8.159.144.140`
- **SSH 连接**: `ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140`
- **部署目录**: `/opt/canary`

## 已配置的文件

本地已经配置好以下文件以适应阿里云服务器环境：

### 1. `.env.production` - 生产环境配置
- 数据库配置（使用 Docker 内部网络）
- JWT 密钥（已设置安全密钥）
- 前端 URL：`http://8.159.144.140`
- API URL：`http://8.159.144.140/graphql`

### 2. `nginx.prod.conf` - Nginx 配置
- server_name：`8.159.144.140`
- 反向代理配置（API 和 Web）
- Gzip 压缩
- 安全头配置
- 速率限制

### 3. `docker-compose.prod.yml` - Docker Compose 生产配置
- PostgreSQL 数据库
- NestJS API 服务
- Next.js Web 服务
- Nginx 反向代理
- 健康检查配置

### 4. `apps/api/src/main.ts` - API CORS 配置
- 已添加阿里云 IP 到允许的源列表

### 5. `apps/api/src/app.module.ts` - 数据库配置
- SSL 配置通过环境变量控制（默认禁用）

## 部署步骤

### 方式一：使用自动部署脚本（推荐）

```bash
# 在本地项目根目录执行
./deploy-to-aliyun.sh
```

脚本会自动完成：
1. 测试 SSH 连接
2. 创建远程目录
3. 打包项目文件
4. 上传到服务器
5. 解压文件

### 方式二：手动部署

#### 步骤 1：打包项目

```bash
# 在本地项目根目录
tar czf canary-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='*.log' \
    .
```

#### 步骤 2：上传到服务器

```bash
# 上传压缩包
scp -i ~/.ssh/aliyun_key.pem canary-deploy.tar.gz root@8.159.144.140:/opt/

# 登录服务器
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 在服务器上创建目录并解压
mkdir -p /opt/canary
cd /opt/canary
mv /opt/canary-deploy.tar.gz .
tar xzf canary-deploy.tar.gz
rm canary-deploy.tar.gz
```

## 服务器环境要求

### 1. 安装 Docker 和 Docker Compose

```bash
# 检查 Docker 是否已安装
docker --version

# 如果未安装，执行以下命令
curl -fsSL https://get.docker.com | bash -s docker

# 启动 Docker 服务
systemctl start docker
systemctl enable docker

# 验证安装
docker ps
```

### 2. 配置防火墙

```bash
# 开放必要的端口
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=4000/tcp
firewall-cmd --reload

# 或者使用 iptables
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
iptables -A INPUT -p tcp --dport 4000 -j ACCEPT
```

**重要**: 也需要在阿里云控制台的安全组中开放这些端口！

## 启动服务

```bash
# 进入项目目录
cd /opt/canary

# 使用 Docker Compose 启动所有服务
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 或者使用 docker-compose（旧版本）
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## 查看服务状态

```bash
# 查看容器状态
docker ps

# 查看服务日志
docker logs canary-api-prod
docker logs canary-web-prod
docker logs canary-db-prod
docker logs canary-nginx-prod

# 实时查看日志
docker logs -f canary-api-prod

# 查看所有容器的日志
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f
```

## 访问应用

- **前端应用**: http://8.159.144.140
- **GraphQL API**: http://8.159.144.140/graphql
- **健康检查**: http://8.159.144.140/health
- **Apollo Studio**: http://8.159.144.140/apollo-studio

## 常用管理命令

```bash
# 停止所有服务
docker compose -f docker-compose.prod.yml --env-file .env.production down

# 重启服务
docker compose -f docker-compose.prod.yml --env-file .env.production restart

# 重启单个服务
docker restart canary-api-prod
docker restart canary-web-prod

# 重新构建并启动
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 查看资源使用情况
docker stats

# 清理未使用的镜像和容器
docker system prune -a
```

## 数据备份

```bash
# 备份数据库
docker exec canary-db-prod pg_dump -U postgres canary_production > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20241116.sql | docker exec -i canary-db-prod psql -U postgres canary_production
```

## 更新部署

当需要更新代码时：

```bash
# 在本地重新打包并上传
./deploy-to-aliyun.sh

# SSH 登录服务器
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 进入项目目录
cd /opt/canary

# 停止服务
docker compose -f docker-compose.prod.yml --env-file .env.production down

# 重新构建并启动
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## 故障排查

### 问题 1: 容器无法启动

```bash
# 查看容器日志
docker logs canary-api-prod

# 检查环境变量是否正确
docker exec canary-api-prod env | grep DATABASE
```

### 问题 2: 无法访问服务

```bash
# 检查容器是否运行
docker ps

# 检查端口是否开放
netstat -tulpn | grep -E "80|3000|4000"

# 检查防火墙
firewall-cmd --list-all
```

### 问题 3: 数据库连接失败

```bash
# 检查数据库容器
docker logs canary-db-prod

# 进入数据库容器
docker exec -it canary-db-prod psql -U postgres

# 测试数据库连接
docker exec canary-api-prod nc -zv postgres 5432
```

### 问题 4: Nginx 无法拉取镜像

```bash
# 如果无法拉取 Docker Hub 镜像，可以使用国内镜像源
# 配置 Docker 镜像加速器（阿里云）
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com"
  ]
}
EOF

systemctl restart docker

# 或者直接拉取镜像
docker pull nginx:alpine
```

## 性能优化建议

1. **启用 HTTPS**
   - 申请 SSL 证书（Let's Encrypt）
   - 修改 Nginx 配置添加 HTTPS 支持

2. **配置 CDN**
   - 静态资源使用阿里云 CDN
   - 加速全球访问

3. **数据库优化**
   - 定期备份
   - 配置连接池
   - 添加索引

4. **监控告警**
   - 配置日志收集
   - 设置资源监控
   - 添加告警通知

## 安全建议

1. **修改默认密码**
   - 数据库密码
   - JWT 密钥
   - 支付 API 密钥

2. **启用防火墙**
   - 只开放必要端口
   - 配置白名单

3. **定期更新**
   - Docker 镜像
   - 依赖包
   - 系统安全补丁

4. **备份策略**
   - 每日自动备份数据库
   - 保留至少 7 天备份
   - 异地备份

## 联系支持

如遇到问题，请检查：
1. 服务日志
2. 环境变量配置
3. 网络连接
4. 防火墙设置
5. Docker 服务状态
