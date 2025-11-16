# 阿里云部署前检查清单

## ✅ 本地配置已完成

- [x] `.env.production` - 已配置阿里云 IP 和生产环境变量
- [x] `nginx.prod.conf` - server_name 已设置为 8.159.144.140
- [x] `docker-compose.prod.yml` - 生产环境 Docker Compose 配置已就绪
- [x] `apps/api/src/main.ts` - CORS 已添加阿里云 IP
- [x] `apps/api/src/app.module.ts` - 数据库 SSL 配置已优化
- [x] `deploy-to-aliyun.sh` - 自动部署脚本已创建

## 📋 部署前检查

### 1. 网络连接

```bash
# 测试 SSH 连接
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140 "echo '连接成功'"
```

### 2. 服务器环境

登录服务器后检查：

```bash
# 检查 Docker 是否安装
docker --version

# 检查 Docker Compose 是否可用
docker compose version
# 或者
docker-compose --version

# 检查磁盘空间
df -h

# 检查内存
free -h
```

### 3. 安全组配置（阿里云控制台）

确保以下端口已开放：
- [ ] 80 (HTTP)
- [ ] 443 (HTTPS，如果需要）
- [ ] 3000 (Next.js，可选，用于调试)
- [ ] 4000 (NestJS API，可选，用于调试)

### 4. 防火墙配置

```bash
# 检查防火墙状态
firewall-cmd --list-all
# 或
iptables -L -n

# 如果需要，开放端口（参考 ALIYUN_DEPLOYMENT.md）
```

## 🚀 快速部署命令

### 步骤 1：在本地执行

```bash
# 运行自动部署脚本
./deploy-to-aliyun.sh
```

### 步骤 2：在服务器上执行

```bash
# SSH 登录
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 进入项目目录
cd /opt/canary

# 检查文件是否上传成功
ls -la

# 启动服务
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 查看服务状态
docker ps

# 查看日志
docker logs canary-api-prod
docker logs canary-web-prod
docker logs canary-nginx-prod
```

### 步骤 3：验证部署

```bash
# 在本地测试
curl http://8.159.144.140/health

# 或在浏览器访问
# http://8.159.144.140
# http://8.159.144.140/graphql
```

## 🔍 服务健康检查

等待 1-2 分钟让所有服务完全启动，然后检查：

```bash
# 在服务器上执行
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 应该看到 4 个容器都在运行：
# - canary-nginx-prod
# - canary-web-prod  
# - canary-api-prod
# - canary-db-prod
```

## ⚠️ 常见问题

### 问题 1: Docker 未安装

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker
systemctl start docker
systemctl enable docker
```

### 问题 2: 端口被占用

```bash
# 检查端口占用
netstat -tulpn | grep -E "80|3000|4000|5432"

# 停止占用端口的服务
systemctl stop nginx  # 如果系统安装了 nginx
```

### 问题 3: 无法拉取镜像

```bash
# 配置 Docker 镜像加速（阿里云）
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": ["https://registry.cn-hangzhou.aliyuncs.com"]
}
EOF
systemctl restart docker
```

### 问题 4: 权限问题

```bash
# 确保有执行权限
chmod +x /opt/canary/deploy-to-aliyun.sh

# 检查目录权限
ls -la /opt/canary
```

## 📊 部署后监控

```bash
# 实时查看日志
docker logs -f canary-api-prod

# 查看资源使用
docker stats

# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' canary-api-prod
```

## 🎉 部署成功标志

- [ ] 所有容器状态为 "Up"
- [ ] http://8.159.144.140 返回前端页面
- [ ] http://8.159.144.140/graphql 返回 GraphQL Playground
- [ ] http://8.159.144.140/health 返回健康状态
- [ ] 可以注册和登录用户
- [ ] 数据库正常连接

## 📝 下一步

部署成功后，建议：

1. **配置 HTTPS**
   - 申请 SSL 证书
   - 更新 Nginx 配置

2. **设置监控**
   - 配置日志收集
   - 设置告警通知

3. **备份策略**
   - 配置自动数据库备份
   - 设置定时备份任务

4. **性能优化**
   - 启用 CDN
   - 优化数据库查询
   - 配置缓存

详细信息请参考 `ALIYUN_DEPLOYMENT.md`
