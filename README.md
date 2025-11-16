# 🚀 快速部署参考

## 一键部署

```bash
./deploy.sh
```

## 常用命令

### 本地开发
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建项目
pnpm lint         # 代码检查
```

### 部署相关
```bash
./deploy.sh                    # 部署到阿里云
curl http://8.159.144.140      # 检查网站
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
- 🔍 GraphQL: http://8.159.144.140/graphql

## 文档索引

- `HOW_TO_DEPLOY.md` - 详细部署指南（必读）
- `DEPLOYMENT_ISSUES_RESOLUTION.md` - 问题排查指南
- `deploy.sh` - 一键部署脚本

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

💡 **提示**: 修改代码后直接运行 `./deploy.sh` 即可部署！
