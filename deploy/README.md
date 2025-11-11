# Canary 项目部署指南

本指南介绍如何在阿里云服务器（Alibaba Cloud Linux 3）上部署 Canary 项目。

## 部署方式

### 方式一：本地部署（推荐）

适用于直接在服务器上运行部署脚本的场景。

#### 步骤 1: 准备服务器环境

```bash
# 1. 克隆项目到服务器
git clone <your-repo-url> /opt/canary-source
cd /opt/canary-source

# 2. 运行环境配置脚本
sudo ./deploy/setup-env.sh
```

#### 步骤 2: 配置环境变量

```bash
# 编辑生产环境配置文件
nano .env.production

# 重要：修改以下配置项
# - POSTGRES_PASSWORD: 数据库密码
# - JWT_SECRET: JWT 密钥
# - NEXT_PUBLIC_API_URL: API 地址（如果需要外网访问，改为服务器公网IP）
```

#### 步骤 3: 执行部署

```bash
# 运行本地部署脚本
sudo ./deploy/local-deploy.sh
```

### 方式二：远程部署

适用于从本地机器远程部署到服务器的场景。

#### 步骤 1: 配置服务器信息

编辑 `deploy/aliyun-deploy.sh` 文件：

```bash
# 修改服务器配置
SERVER_USER="root"                    # 服务器用户名
SERVER_HOST="your-server-ip"          # 服务器IP地址
```

#### 步骤 2: 执行远程部署

```bash
# 在本地项目目录运行
./deploy/aliyun-deploy.sh
```

## 部署后管理

### 服务管理

```bash
# 查看服务状态
systemctl status canary

# 启动服务
systemctl start canary

# 停止服务
systemctl stop canary

# 重启服务
systemctl restart canary
```

### Docker 管理

```bash
# 进入部署目录
cd /opt/canary

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启特定服务
docker-compose restart api
docker-compose restart web

# 重新构建并启动
docker-compose up -d --build
```

### 日志查看

```bash
# 查看所有服务日志
cd /opt/canary && docker-compose logs -f

# 查看特定服务日志
cd /opt/canary && docker-compose logs -f api
cd /opt/canary && docker-compose logs -f web
cd /opt/canary && docker-compose logs -f postgres
cd /opt/canary && docker-compose logs -f redis
```

## 访问应用

部署完成后，可以通过以下地址访问：

- **前端应用**: http://your-server-ip:3000
- **GraphQL API**: http://your-server-ip:4000/graphql
- **API 健康检查**: http://your-server-ip:4000/health

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -tlnp | grep :3000
   netstat -tlnp | grep :4000
   
   # 停止占用端口的进程
   sudo kill -9 <PID>
   ```

2. **Docker 服务未启动**
   ```bash
   # 启动 Docker 服务
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **权限问题**
   ```bash
   # 确保使用 root 权限运行部署脚本
   sudo ./deploy/local-deploy.sh
   ```

4. **防火墙阻止访问**
   ```bash
   # 检查防火墙状态
   sudo firewall-cmd --list-all
   
   # 开放端口
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --permanent --add-port=4000/tcp
   sudo firewall-cmd --reload
   ```

### 重新部署

如果需要重新部署：

```bash
# 停止现有服务
cd /opt/canary && docker-compose down

# 更新代码
cd /opt/canary-source && git pull

# 重新部署
sudo ./deploy/local-deploy.sh
```

## 备份和恢复

### 自动备份

部署脚本会自动创建备份：
- 备份位置: `/opt/backups/canary/`
- 备份格式: `backup-YYYYMMDD-HHMMSS.tar.gz`

### 手动备份

```bash
# 创建完整备份
sudo tar -czf /opt/backups/canary/manual-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /opt/canary .

# 备份数据库
cd /opt/canary
docker-compose exec postgres pg_dump -U canary_user canary_db > backup.sql
```

### 恢复备份

```bash
# 停止服务
cd /opt/canary && docker-compose down

# 恢复文件
sudo tar -xzf /opt/backups/canary/backup-YYYYMMDD-HHMMSS.tar.gz -C /opt/canary

# 启动服务
cd /opt/canary && docker-compose up -d
```

## 性能优化

### 系统优化

部署脚本已自动应用以下优化：
- 增加文件描述符限制
- 优化网络参数
- 配置系统服务

### 应用优化

1. **数据库连接池**
   - 在 `.env.production` 中调整数据库连接数

2. **Redis 缓存**
   - 确保 Redis 服务正常运行
   - 监控缓存命中率

3. **静态资源**
   - 使用 CDN 加速静态资源
   - 启用 gzip 压缩

## 监控和维护

### 健康检查

```bash
# API 健康检查
curl http://localhost:4000/health

# 前端健康检查
curl http://localhost:3000
```

### 系统监控

```bash
# 查看系统资源使用情况
htop
df -h
free -h

# 查看 Docker 资源使用
docker stats
```

### 定期维护

建议定期执行以下维护任务：

```bash
# 清理 Docker 镜像和容器
docker system prune -f

# 更新系统包
sudo yum update -y

# 检查日志文件大小
du -sh /var/log/
```

## 安全建议

1. **修改默认密码**
   - 数据库密码
   - JWT 密钥

2. **配置 HTTPS**
   - 使用 Let's Encrypt 证书
   - 配置 Nginx 反向代理

3. **防火墙配置**
   - 只开放必要端口
   - 配置 fail2ban

4. **定期更新**
   - 定期更新系统和依赖包
   - 监控安全漏洞

## 联系支持

如果遇到问题，请：
1. 检查日志文件
2. 查看本文档的故障排除部分
3. 提交 Issue 到项目仓库
