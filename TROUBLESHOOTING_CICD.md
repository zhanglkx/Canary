# CI/CD 常见问题修复指南

## 问题 1: tar 打包错误 - "file changed as we read it"

### 错误信息
```
tar: .: file changed as we read it
Error: Process completed with exit code 1.
```

### 原因
在 GitHub Actions 运行时，某些文件（如 pnpm 缓存、临时文件）在打包过程中被修改，导致 tar 命令报错并退出。

### 解决方案 ✅

已在以下文件中修复：
- `.github/workflows/deploy.yml`
- `deploy-to-aliyun.sh`

**修复内容**：
1. 添加 `--warning=no-file-changed` 参数，让 tar 忽略文件变化警告
2. 排除更多可能变化的目录：
   - `.pnpm-store` - pnpm 缓存
   - `.turbo` - Turbo 缓存
   - `coverage` - 测试覆盖率文件
   - `tmp`, `temp` - 临时目录
   - `.cache` - 各种缓存目录
   - `.github` - GitHub 配置（不需要部署）

**修复后的打包命令**：
```bash
tar czf canary-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='.pnpm-store' \
  --exclude='.turbo' \
  --exclude='tmp' \
  --exclude='temp' \
  --exclude='.cache' \
  --exclude='canary-deploy.tar.gz' \
  --exclude='canary-deployment.tar.gz' \
  --warning=no-file-changed \
  .
```

---

## 问题 2: SSH 连接失败

### 错误信息
```
Permission denied (publickey)
```

### 解决方案

1. **检查 GitHub Secrets 配置**
   ```bash
   # 确保 ALIYUN_SSH_KEY 包含完整的私钥
   # 包括开头和结尾标记：
   -----BEGIN RSA PRIVATE KEY-----
   ...内容...
   -----END RSA PRIVATE KEY-----
   ```

2. **检查私钥格式**
   ```bash
   # 在本地测试私钥是否有效
   ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140 "echo 'SSH 连接成功'"
   ```

3. **检查私钥权限**
   ```bash
   # GitHub Actions 会自动设置权限为 600
   # 但本地需要手动设置
   chmod 600 ~/.ssh/aliyun_key.pem
   ```

---

## 问题 3: Docker 构建失败

### 错误信息
```
Error response from daemon: No space left on device
```

### 解决方案

SSH 登录服务器清理空间：

```bash
# 登录服务器
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 清理 Docker 资源
docker system prune -a -f

# 检查磁盘空间
df -h

# 清理旧的日志文件
find /var/log -name "*.log" -mtime +7 -delete

# 清理 apt 缓存
apt clean
```

---

## 问题 4: 服务启动后无法访问

### 检查步骤

1. **检查容器状态**
   ```bash
   docker ps --filter "name=canary"
   ```

2. **查看容器日志**
   ```bash
   docker logs canary-api-prod --tail 50
   docker logs canary-web-prod --tail 50
   docker logs canary-nginx-prod --tail 50
   ```

3. **检查端口占用**
   ```bash
   netstat -tulpn | grep -E "80|3000|4000|5432"
   ```

4. **检查防火墙**
   ```bash
   # 检查 iptables
   iptables -L -n

   # 或检查 firewalld
   firewall-cmd --list-all
   ```

5. **检查阿里云安全组**
   - 登录阿里云控制台
   - 检查 ECS 安全组规则
   - 确保开放端口 80、443

---

## 问题 5: 环境变量未生效

### 症状
- 服务启动但功能异常
- 数据库连接失败
- JWT 认证失败

### 解决方案

1. **检查环境文件**
   ```bash
   ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140
   cd /opt/canary
   cat .env.production
   ```

2. **验证环境变量**
   ```bash
   # 检查容器内的环境变量
   docker exec canary-api-prod env | grep -E "DATABASE|JWT"
   ```

3. **重新创建环境文件**
   ```bash
   # 在服务器上
   cd /opt/canary
   
   # 备份旧文件
   cp .env.production .env.production.backup
   
   # 重新创建（参考 .env.production.example）
   nano .env.production
   ```

---

## 问题 6: 数据库连接失败

### 错误信息
```
Unable to connect to the database
```

### 解决方案

1. **检查数据库容器**
   ```bash
   docker ps | grep postgres
   docker logs canary-db-prod
   ```

2. **检查数据库健康状态**
   ```bash
   docker inspect --format='{{.State.Health.Status}}' canary-db-prod
   ```

3. **测试数据库连接**
   ```bash
   # 从 API 容器测试连接
   docker exec canary-api-prod nc -zv postgres 5432
   
   # 进入数据库容器
   docker exec -it canary-db-prod psql -U postgres -d canary_production
   ```

4. **重置数据库**
   ```bash
   # 警告：这会删除所有数据
   docker compose -f docker-compose.prod.yml down -v
   docker compose -f docker-compose.prod.yml up -d
   ```

---

## 问题 7: Nginx 配置错误

### 错误信息
```
502 Bad Gateway
```

### 解决方案

1. **检查 Nginx 配置**
   ```bash
   docker exec canary-nginx-prod nginx -t
   ```

2. **查看 Nginx 日志**
   ```bash
   docker logs canary-nginx-prod
   ```

3. **检查上游服务**
   ```bash
   # 确保 API 和 Web 容器正在运行
   docker ps | grep -E "canary-api|canary-web"
   
   # 测试上游服务
   curl http://localhost:4000/health
   curl http://localhost:3000
   ```

4. **重启 Nginx**
   ```bash
   docker restart canary-nginx-prod
   ```

---

## 问题 8: GitHub Actions 超时

### 症状
- 工作流运行超过 6 小时
- 构建卡在某个步骤

### 解决方案

1. **优化 Docker 构建**
   - 使用构建缓存
   - 减少层数
   - 使用 multi-stage build

2. **并行执行任务**
   - 已在 CI 工作流中配置

3. **减少依赖安装时间**
   ```yaml
   # 使用缓存
   - uses: actions/cache@v3
     with:
       path: ~/.pnpm-store
       key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
   ```

---

## 调试技巧

### 1. 在本地模拟 GitHub Actions

```bash
# 安装 act
brew install act  # macOS
# 或
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# 运行工作流
act -j deploy
```

### 2. 启用调试日志

在 GitHub 仓库设置中添加 Secrets：
- `ACTIONS_STEP_DEBUG` = `true`
- `ACTIONS_RUNNER_DEBUG` = `true`

### 3. SSH 到 GitHub Actions Runner

在工作流中添加：

```yaml
- name: 调试 - Setup tmate session
  uses: mxschmitt/action-tmate@v3
  if: failure()
```

---

## 最佳实践

1. **定期清理服务器**
   ```bash
   # 每周清理一次
   docker system prune -a -f
   ```

2. **监控磁盘空间**
   ```bash
   # 设置告警（磁盘使用率 > 80%）
   df -h | awk '$5+0 > 80 {print $0}'
   ```

3. **保持依赖更新**
   ```bash
   pnpm update --latest
   ```

4. **备份数据库**
   ```bash
   # 每日备份
   docker exec canary-db-prod pg_dump -U postgres canary_production > backup.sql
   ```

5. **查看资源使用**
   ```bash
   docker stats --no-stream
   ```

---

## 快速诊断命令

```bash
# 一键诊断脚本
cat > /tmp/diagnose.sh << 'EOF'
#!/bin/bash
echo "=== 容器状态 ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n=== 磁盘空间 ==="
df -h | grep -E "/$|/opt"

echo -e "\n=== 内存使用 ==="
free -h

echo -e "\n=== 最近的日志 ==="
docker logs canary-api-prod --tail 10

echo -e "\n=== 健康检查 ==="
curl -s http://localhost:4000/health || echo "API 不可访问"
curl -s -I http://localhost:3000 | head -1 || echo "Web 不可访问"
EOF

chmod +x /tmp/diagnose.sh
/tmp/diagnose.sh
```

---

## 获取帮助

如果以上方案都无法解决问题：

1. **查看 Actions 日志**
   https://github.com/zhanglkx/Canary/actions

2. **SSH 登录服务器检查**
   ```bash
   ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140
   cd /opt/canary
   ./diagnose.sh
   ```

3. **查看文档**
   - [GITHUB_ACTIONS_GUIDE.md](./GITHUB_ACTIONS_GUIDE.md)
   - [ALIYUN_DEPLOYMENT.md](./ALIYUN_DEPLOYMENT.md)

4. **提交 Issue**
   https://github.com/zhanglkx/Canary/issues

---

**记住**：大部分部署问题都可以通过查看日志和检查配置来解决。保持冷静，逐步排查！🔍
