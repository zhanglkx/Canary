# 🚀 代码更新部署指南

## 📋 快速开始

当你修改代码后，只需执行一条命令即可部署到阿里云：

```bash
./deploy.sh
```

就这么简单！🎉

---

## 📖 详细步骤说明

### 步骤 1️⃣: 修改代码

```bash
# 在本地修改代码
vim apps/api/src/xxx.ts
vim apps/web/src/xxx.tsx

# 测试代码（可选但推荐）
pnpm dev  # 本地运行测试
```

### 步骤 2️⃣: 提交代码到 Git（推荐）

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

### 步骤 3️⃣: 执行部署脚本

```bash
# 一键部署
./deploy.sh

# 或者带详细日志
./deploy.sh --verbose
```

### 步骤 4️⃣: 等待部署完成

部署过程大约需要 **6-10 分钟**：
- 🔨 拉取基础镜像 (1 分钟)
- 🔨 本地构建镜像 (3-5 分钟)
- 📦 打包镜像 (30 秒)
- ⬆️  上传到服务器 (2-3 分钟)
- 🚀 服务器加载和启动 (1 分钟)

### 步骤 5️⃣: 验证部署

```bash
# 访问网站
open http://8.159.144.140

# 或手动检查
curl http://8.159.144.140/health
curl http://8.159.144.140/graphql
```

---

## 🎯 完整工作流程

```
┌─────────────────────────────────────────────────────────┐
│  你的工作流程                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 修改代码                                              │
│     ↓                                                    │
│  2. git commit & push （可选）                           │
│     ↓                                                    │
│  3. 运行 ./deploy.sh                                     │
│     ↓                                                    │
│  4. 等待 6-10 分钟                                        │
│     ↓                                                    │
│  5. 访问 http://8.159.144.140                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ deploy.sh 脚本详解

### 脚本做了什么？

1. **拉取基础镜像** - 确保 PostgreSQL 和 Nginx 镜像是最新的
2. **本地构建** - 在你的电脑上构建 Docker 镜像（网络稳定）
3. **验证镜像** - 检查镜像是否构建成功
4. **打包镜像** - 压缩镜像为 .tar.gz 文件（~300MB）
5. **上传到服务器** - 通过 SSH 上传镜像文件
6. **加载镜像** - 在服务器上加载镜像
7. **启动服务** - 停止旧容器，启动新容器
8. **健康检查** - 验证服务是否正常运行

### 脚本输出示例

```bash
==========================================
🚀 部署到阿里云服务器
==========================================

步骤 1/6: 拉取基础镜像...
✓ postgres:16-alpine 已拉取
✓ nginx:alpine 已拉取

步骤 2/6: 本地构建镜像...
✓ canary-api-prod:latest 构建成功
✓ canary-web-prod:latest 构建成功

步骤 3/6: 验证镜像...
canary-api-prod:latest   381MB
canary-web-prod:latest   695MB
✓ 镜像验证通过

步骤 4/6: 打包镜像...
✓ 镜像打包完成，大小: 288M

步骤 5/6: 上传镜像到服务器...
[====================] 100%

步骤 6/6: 服务器部署...
✓ 镜像加载成功
✓ 旧容器已停止
✓ 新容器已启动

==========================================
✅ 部署成功！
访问: http://8.159.144.140
==========================================
```

---

## ⚠️ 常见问题

### Q1: 本地构建失败怎么办？

**可能原因**：
- Docker 未启动
- 磁盘空间不足
- 网络问题

**解决方法**：
```bash
# 检查 Docker 状态
docker ps

# 清理 Docker 缓存
docker system prune -a

# 重新运行
./deploy.sh
```

### Q2: 上传速度太慢怎么办？

**原因**: 镜像文件较大（~300MB），网络上传需要时间

**解决方法**：
- 等待上传完成（通常 2-3 分钟）
- 检查网络连接
- 考虑使用 CDN 或对象存储

### Q3: 服务启动后访问 502 错误？

**可能原因**：
- 服务还在启动中（等待 1-2 分钟）
- 数据库连接失败
- 环境变量配置错误

**解决方法**：
```bash
# SSH 到服务器检查
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 查看容器状态
docker ps

# 查看日志
docker logs canary-api-prod --tail 50
docker logs canary-web-prod --tail 50
```

### Q4: 如何回滚到上一个版本？

**方法 1: 使用 Git**
```bash
# 回退到上一个提交
git revert HEAD
./deploy.sh
```

**方法 2: 在服务器上**
```bash
# 如果保留了旧镜像
docker images | grep canary
docker tag <old-image-id> canary-api-prod:latest
docker compose up -d
```

---

## 🔧 高级用法

### 只构建不部署

```bash
# 修改 deploy.sh，注释掉上传和部署部分
docker compose -f docker-compose.prod.yml build
```

### 部署到不同服务器

```bash
# 修改脚本中的 ALIYUN_IP
ALIYUN_IP="your.server.ip"
./deploy.sh
```

### 查看详细构建日志

```bash
# 添加 --verbose 参数（需要修改脚本支持）
docker compose -f docker-compose.prod.yml build --progress=plain
```

---

## 📊 部署时间估算

| 阶段 | 时间 | 可优化？ |
|------|------|----------|
| 拉取基础镜像 | 1 分钟 | ✅ 使用缓存 |
| 本地构建 API | 1-2 分钟 | ✅ 使用缓存 |
| 本地构建 Web | 2-3 分钟 | ✅ 使用缓存 |
| 打包镜像 | 30 秒 | ❌ |
| 上传到服务器 | 2-3 分钟 | ⚠️ 取决于网络 |
| 服务器加载启动 | 1 分钟 | ❌ |
| **总计** | **6-10 分钟** | |

### 优化建议

1. **使用 Docker 构建缓存**
   - 首次构建慢，后续只构建变更部分
   - 预计可节省 50% 时间

2. **优化镜像大小**
   - 使用 .dockerignore
   - 多阶段构建
   - 预计减小 30% 镜像大小

3. **使用 CI/CD**
   - GitHub Actions 自动构建
   - 推送到镜像仓库
   - 服务器直接拉取

---

## 🎓 最佳实践

### ✅ 推荐做法

1. **部署前测试**
   ```bash
   pnpm dev       # 本地运行
   pnpm test      # 运行测试
   pnpm lint      # 代码检查
   ```

2. **使用 Git 版本控制**
   ```bash
   git commit -m "feat: xxx"
   git push
   ./deploy.sh
   ```

3. **保留部署日志**
   ```bash
   ./deploy.sh 2>&1 | tee deploy-$(date +%Y%m%d-%H%M%S).log
   ```

4. **定期备份数据**
   ```bash
   # 在服务器上
   docker exec canary-db-prod pg_dump -U postgres > backup.sql
   ```

### ❌ 避免做法

1. ❌ 不测试就直接部署
2. ❌ 修改生产环境配置文件后不提交 Git
3. ❌ 不检查部署结果就离开
4. ❌ 频繁部署（建议批量修改后一起部署）

---

## 📝 部署检查清单

部署前：
- [ ] 代码在本地测试通过
- [ ] 修改已提交到 Git
- [ ] 确认 Docker 已启动
- [ ] 确认 SSH 密钥正确
- [ ] 确认磁盘空间充足（需要 ~2GB）

部署后：
- [ ] 访问网站确认首页正常
- [ ] 测试 API 接口
- [ ] 检查 GraphQL Playground
- [ ] 查看容器日志无错误
- [ ] 验证数据库连接正常

---

## 🆘 紧急回滚

如果部署后发现严重问题：

```bash
# 1. SSH 到服务器
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 2. 查看所有镜像
docker images | grep canary

# 3. 找到上一个版本的镜像 ID
# 例如：92ec3f5e543f (旧版本)

# 4. 回滚
cd /opt/canary
docker compose down
docker tag 92ec3f5e543f canary-api-prod:latest
docker tag e3ae153c07af canary-web-prod:latest
docker compose up -d

# 5. 验证
docker ps
curl http://localhost:4000/health
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**
   ```bash
   # 本地构建日志
   docker compose -f docker-compose.prod.yml build 2>&1 | tee build.log
   
   # 服务器日志
   ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140 \
     'docker logs canary-api-prod --tail 100'
   ```

2. **检查文档**
   - `DEPLOYMENT_ISSUES_RESOLUTION.md` - 问题解决方案
   - `DEPLOYMENT_SOLUTION.md` - 部署方案总览

3. **常用命令**
   ```bash
   # 检查容器状态
   docker ps -a
   
   # 重启服务
   docker compose restart
   
   # 清理资源
   docker system prune -a
   ```

---

## 🎉 总结

**修改代码后部署，就这么简单：**

```bash
# 1. 修改代码
vim your-file.ts

# 2. 部署
./deploy.sh

# 3. 验证
curl http://8.159.144.140/health
```

**记住这三步，你就是部署大师！** 🚀

---

**文档版本**: v1.0  
**最后更新**: 2024-11-16  
**适用环境**: 阿里云 ECS  
**服务器**: 8.159.144.140
