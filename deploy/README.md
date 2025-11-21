# Canary 项目部署快速参考

> 本文档提供部署相关的快速参考信息

## 🌐 访问地址

| 服务 | URL |
|------|-----|
| 前端应用 | http://8.159.144.140 |
| GraphQL API | http://8.159.144.140/graphql |
| 健康检查 | http://8.159.144.140/api/health |

## 🔑 服务器登录

```bash
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140
```

## 📂 项目位置

```bash
cd /root/canary
```

## ⚡ 常用命令

### 服务管理
```bash
# 启动所有服务
./scripts/start-services.sh

# 停止所有服务
./scripts/stop-services.sh

# 重启所有服务
./scripts/restart-services.sh

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 健康检查
./scripts/health-check.sh
```

### 日志查看
```bash
# 查看 API 日志
./scripts/view-logs.sh api 100

# 查看 Web 日志
./scripts/view-logs.sh web 100

# 查看所有日志
./scripts/view-logs.sh all 50
```

### 数据库管理
```bash
# 备份数据库
./scripts/backup-database.sh

# 连接数据库
docker exec -it $(docker ps --filter "ancestor=postgres:16-alpine" --format "{{.Names}}" | head -1) \
  psql -U postgres -d canary_production

# 查看数据库表
docker exec $(docker ps --filter "ancestor=postgres:16-alpine" --format "{{.Names}}" | head -1) \
  psql -U postgres -d canary_production -c "\dt"
```

### Docker 管理
```bash
# 查看容器状态
docker ps

# 查看容器资源使用
docker stats

# 查看容器日志
docker logs <container_name>

# 进入容器
docker exec -it <container_name> sh

# 重启单个服务
docker-compose -f docker-compose.prod.yml restart <service_name>
```

## 🗂️ 重要文件

| 文件 | 说明 |
|------|------|
| `.env.production` | 生产环境配置 |
| `docker-compose.prod.yml` | Docker Compose 配置 |
| `nginx.prod.conf` | Nginx 配置 |
| `scripts/` | 运维脚本目录 |

## 📊 服务端口

| 服务 | 内部端口 | 外部端口 |
|------|---------|---------|
| Nginx | 80 | 80 |
| Web | 3000 | - |
| API | 4000 | - |
| PostgreSQL | 5432 | - |

## 🔐 数据库配置

- **数据库名**: canary_production
- **用户名**: postgres
- **密码**: CanaryProd2025SecureDB
- **表数量**: 22 张

## 🛠️ 故障排查

### 服务无法访问
1. 检查服务状态: `./scripts/health-check.sh`
2. 查看错误日志: `./scripts/view-logs.sh all`
3. 重启服务: `./scripts/restart-services.sh`

### 数据库连接失败
```bash
# 检查数据库容器状态
docker ps | grep postgres

# 查看数据库日志
./scripts/view-logs.sh postgres

# 重启数据库
docker-compose -f docker-compose.prod.yml restart postgres
```

### API 服务异常
```bash
# 查看 API 日志
./scripts/view-logs.sh api

# 重启 API
docker-compose -f docker-compose.prod.yml restart api
```

### Web 服务异常
```bash
# 查看 Web 日志
./scripts/view-logs.sh web

# 重启 Web
docker-compose -f docker-compose.prod.yml restart web
```

## 📝 更新部署

### 1. 上传新代码包
```bash
# 在本地打包
cd /Users/zlk/Documents/Demo/nest/Canary
tar -czf canary-deploy.tar.gz apps/ libs/ docker-compose.prod.yml nginx.prod.conf package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json

# 上传到服务器
scp -i ~/.ssh/aliyun_key.pem canary-deploy.tar.gz root@8.159.144.140:/root/
```

### 2. 在服务器上部署
```bash
# SSH 登录服务器
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 切换到项目目录
cd /root/canary

# 备份配置
cp .env.production .env.production.backup

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 解压新代码
tar -xzf /root/canary-deploy.tar.gz -C .

# 重新构建
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 检查状态
./scripts/health-check.sh
```

## 📚 详细文档

- [部署完成总结](./部署完成总结.md) - 完整的部署信息和总结
- [运维管理脚本说明](./运维管理脚本说明.md) - 运维脚本详细说明
- [步骤0-8](./步骤0_清理准备工作.md) - 详细的部署步骤文档

## 🎯 快速测试

```bash
# 1. 测试健康检查
curl http://8.159.144.140/api/health

# 2. 测试 GraphQL
curl -X POST http://8.159.144.140/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{__typename}"}'

# 3. 测试前端
curl -I http://8.159.144.140
```

## ⚠️ 注意事项

1. **定期备份**: 建议每天备份数据库
2. **日志监控**: 定期检查日志文件
3. **安全更新**: 定期更新密码和依赖
4. **资源监控**: 关注服务器资源使用情况

## 🚀 下一步

- [ ] 配置 HTTPS 证书
- [ ] 绑定域名
- [ ] 设置自动备份 cron 任务
- [ ] 配置监控和告警

---

**最后更新**: 2025-11-16  
**部署状态**: ✅ 运行中
