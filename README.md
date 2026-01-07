# 🚀 Canary - 全栈电商平台

一个使用 NestJS + Next.js + TypeScript 构建的现代化电商平台，支持自动化部署。

## ⚡ 快速开始

### 📦 自动部署（推荐）

配置好 GitHub Secrets 后，推送代码即可自动部署：

```bash
git push origin main  # 自动触发部署！
```

详细配置步骤：查看 [QUICK_SETUP.md](./QUICK_SETUP.md)

### 🔧 手动部署

```bash
./deploy.sh
```

## 🎯 访问地址

- **生产环境**: http://8.159.144.140
- **API 文档**: http://8.159.144.140/api

## 常用命令

### 本地开发
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建项目
pnpm lint         # 代码检查
```

### 调试开发
```bash
# 快速启动调试
docker-compose up -d postgres   # 启动数据库
# 然后在 VS Code 中按 F5，选择 "🎯 完整全栈调试"

# 验证调试配置
./scripts/verify-debug-config.sh

# 查看调试文档
cat DEBUG_QUICKSTART.md         # 快速启动指南
cat docs/DEBUG_SETUP.md         # 详细调试指南
```

### 部署相关
```bash
# 自动部署（推荐）
git push origin main              # 推送到 main 分支自动部署

# 手动部署
./deploy.sh                       # 一键部署脚本

# 检查部署状态
curl http://8.159.144.140         # 检查网站
curl http://8.159.144.140/api     # 检查 API

# 查看部署日志
# 访问: https://github.com/你的用户名/Canary/actions
```

### 服务器管理
```bash
# SSH 登录
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 查看容器状态
docker ps

# 查看日志
docker logs canary-api-prod -f
docker logs canary-web-prod -f

# 重启服务
cd /opt/canary
docker compose -f docker-compose.prod.yml --env-file .env.production restart

# 停止服务
docker compose -f docker-compose.prod.yml --env-file .env.production down

# 启动服务
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## 访问地址

- 🌐 主页: http://8.159.144.140
- 💚 健康检查: http://8.159.144.140/health
- 🔍 REST API: http://8.159.144.140/api

## 文档索引

### 部署相关
- `QUICK_SETUP.md` - **快速配置指南（5分钟搞定）⭐ 新手首选**
- `DEPLOYMENT.md` - 完整自动化部署指南（GitHub Actions）
- `CI_CD_STRATEGY.md` - CI/CD 策略和架构说明
- `HOW_TO_DEPLOY.md` - 手动部署指南（传统方式）
- `DEPLOYMENT_ISSUES_RESOLUTION.md` - 问题排查指南
- `setup-github-secrets.sh` - GitHub Secrets 配置助手
- `deploy.sh` - 一键部署脚本（备用）

### 调试开发
- `DEBUG_QUICKSTART.md` - 调试快速启动（3 步开始）⭐
- `DEBUG_SUMMARY.md` - 调试配置完成总结
- `docs/DEBUG_SETUP.md` - 详细调试指南（1000+ 行）
- `docs/DEBUG_TEST_GUIDE.md` - 调试测试验证指南
- `scripts/verify-debug-config.sh` - 调试配置验证脚本

### 架构文档
- `docs/架构原理与运行机制.md` - 项目架构详解

## 紧急问题

### 502 错误
```bash
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140
docker logs canary-api-prod --tail 50
docker logs canary-web-prod --tail 50
```

### 服务重启
```bash
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140
cd /opt/canary
docker compose restart
```

### 数据库问题
```bash
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140
docker logs canary-db-prod --tail 50
```

---

💡 **新用户提示**: 
1. 首次部署？查看 [QUICK_SETUP.md](./QUICK_SETUP.md) 5分钟配置自动部署
2. 需要手动部署？直接运行 `./deploy.sh`
3. 遇到问题？查看 [CI_CD_STRATEGY.md](./CI_CD_STRATEGY.md) 了解部署策略
