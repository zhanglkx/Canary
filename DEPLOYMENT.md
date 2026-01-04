# 🚀 自动部署配置指南

本项目配置了基于 GitHub Actions 的自动化部署流程，当代码推送到 `main` 分支时，会自动构建并部署到生产服务器。

## 📋 部署流程

### 1. 构建阶段（GitHub Actions）
- ✅ 在 GitHub Actions 上构建（资源充足，速度快）
- ✅ 构建 NestJS API（TypeScript -> JavaScript）
- ✅ 构建 Next.js Web（SSR + Static）
- ✅ 打包构建结果和依赖

### 2. 部署阶段（服务器）
- ✅ 上传构建结果到服务器
- ✅ 停止现有服务
- ✅ 备份当前版本
- ✅ 构建 Docker 镜像（仅运行时，无需编译）
- ✅ 启动新服务
- ✅ 健康检查

## ⚙️ 配置步骤

### 1. 在 GitHub 仓库配置 Secrets

进入仓库 Settings -> Secrets and variables -> Actions，添加以下 secrets：

```
SERVER_HOST=8.159.144.140
SERVER_USER=root
SSH_PRIVATE_KEY=<你的SSH私钥内容>
```

### 2. SSH 私钥配置

你需要将本地的 SSH 私钥内容添加到 GitHub Secrets：

```bash
# 查看私钥内容（包括 -----BEGIN 和 -----END 行）
cat ~/.ssh/aliyun_key.pem
```

复制完整内容（包括开头和结尾的标记行）到 `SSH_PRIVATE_KEY`。

### 3. 服务器配置

确保服务器上已经配置好：

```bash
# 1. 创建项目目录
mkdir -p /opt/canary

# 2. 创建环境变量文件
cat > /opt/canary/.env.clean << 'EOF'
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=你的数据库密码
DATABASE_NAME=canary_production
JWT_SECRET=你的JWT密钥
JWT_EXPIRATION=7d
STRIPE_SECRET_KEY=你的Stripe密钥
STRIPE_WEBHOOK_SECRET=你的Stripe Webhook密钥
PAYPAL_CLIENT_ID=你的PayPal客户端ID
PAYPAL_CLIENT_SECRET=你的PayPal密钥
FRONTEND_URL=http://8.159.144.140
NEXT_PUBLIC_API_URL=http://8.159.144.140/api
NODE_ENV=production
PORT=4000
EOF

# 3. 设置权限
chmod 600 /opt/canary/.env.clean
```

## 🔄 触发部署

### 方式 1：自动触发
推送代码到 `main` 分支：

```bash
git push origin main
```

### 方式 2：手动触发
在 GitHub 仓库页面：
1. 进入 Actions 标签
2. 选择 "Deploy to Production" 工作流
3. 点击 "Run workflow"

## 📊 监控部署

### 查看部署日志
在 GitHub Actions 页面查看实时日志。

### 检查服务器状态
```bash
# SSH 登录服务器
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 进入项目目录
cd /opt/canary

# 查看服务状态
export $(cat .env.clean | xargs)
docker-compose -f docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 优化说明

### 为什么这样设计？

1. **GitHub Actions 构建**
   - ✅ 免费且资源充足
   - ✅ 缓存依赖，加速构建
   - ✅ 避免服务器资源不足

2. **仅部署构建结果**
   - ✅ 服务器上不需要 Node.js 编译
   - ✅ Docker 构建快速（仅 copying files）
   - ✅ 减少部署时间 90%+

3. **自动回滚机制**
   - ✅ 每次部署前自动备份
   - ✅ 部署失败可快速恢复

### 构建时间对比

| 方式 | 构建时间 | 说明 |
|------|---------|------|
| 服务器直接构建 | 5-8分钟 | CPU受限，内存不足 |
| GitHub Actions | 2-3分钟 | 资源充足，有缓存 |
| 仅部署镜像 | 30-60秒 | 只复制文件 |

## 🎯 访问地址

部署成功后访问：

- **Web前端**: http://8.159.144.140
- **API后端**: http://8.159.144.140/api

## ⚠️ 注意事项

1. **首次部署**：需要在服务器上手动创建 `.env.clean` 文件
2. **数据库迁移**：如有数据库变更，需要手动运行迁移
3. **SSL证书**：建议配置域名和 HTTPS（使用 Let's Encrypt）
4. **监控告警**：建议配置服务监控和告警（如 UptimeRobot）

## 🔐 安全建议

1. 不要在代码中提交敏感信息
2. 定期更新 SSH 密钥
3. 使用 GitHub Secrets 管理所有敏感配置
4. 配置防火墙，只开放必要端口（80, 443, 22）
5. 定期更新依赖包，修复安全漏洞

## 🐛 故障排查

### 部署失败？

1. 查看 GitHub Actions 日志
2. SSH 登录服务器检查日志：
   ```bash
   cd /opt/canary
   export $(cat .env.clean | xargs)
   docker-compose -f docker-compose.prod.yml logs
   ```

### 服务无法访问？

1. 检查服务状态：
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. 检查 Nginx 配置：
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

### 回滚到上一个版本

```bash
cd /opt/canary

# 停止当前服务
export $(cat .env.clean | xargs)
docker-compose -f docker-compose.prod.yml down

# 恢复备份
rm -rf apps libs
cp -r backup/* .

# 重启服务
docker-compose -f docker-compose.prod.yml up -d
```

