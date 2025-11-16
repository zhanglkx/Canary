# 🚀 CI/CD 快速开始指南

## 概述

本项目已配置完整的 GitHub Actions CI/CD 流程，可实现：
- ✅ 自动代码质量检查
- ✅ 自动运行测试
- ✅ 自动构建 Docker 镜像
- ✅ 自动部署到阿里云服务器

## 快速配置（5 分钟）

### 步骤 1: 运行配置助手

在项目根目录执行：

```bash
./setup-github-secrets.sh
```

这个脚本会显示你需要配置的所有信息。

### 步骤 2: 配置 GitHub Secrets

1. **打开 GitHub Secrets 页面**
   
   访问：https://github.com/zhanglkx/Canary/settings/secrets/actions

2. **添加 ALIYUN_HOST**
   
   - 点击 **New repository secret**
   - Name: `ALIYUN_HOST`
   - Value: `8.159.144.140`
   - 点击 **Add secret**

3. **添加 ALIYUN_SSH_KEY**
   
   - 再次点击 **New repository secret**
   - Name: `ALIYUN_SSH_KEY`
   - Value: 复制 `setup-github-secrets.sh` 输出的完整 SSH 私钥
   - 点击 **Add secret**

### 步骤 3: 测试 CI/CD

```bash
# 创建测试文件
echo "# Test CI/CD" > test-cicd.txt

# 提交并推送
git add .
git commit -m "test: 测试 CI/CD 流程"
git push origin main
```

### 步骤 4: 查看执行结果

访问：https://github.com/zhanglkx/Canary/actions

你应该会看到两个工作流正在运行：
- 🔍 **CI - Build and Test**: 代码检查和测试
- 🚀 **Deploy to Aliyun ECS**: 自动部署

## 工作流说明

### CI 工作流（每次推送都会触发）

```
推送代码 → 代码检查 → 运行测试 → 构建验证 → 完成
```

包含以下检查：
- Lint 检查（代码风格）
- API 单元测试
- Web 构建测试
- Docker 镜像构建测试

### 部署工作流（推送到 main/master 时触发）

```
推送到 main → 打包项目 → 上传到服务器 → 构建镜像 → 启动服务 → 验证部署
```

自动执行：
1. 打包项目文件
2. 上传到阿里云服务器
3. 停止旧服务
4. 构建新的 Docker 镜像
5. 启动新服务
6. 健康检查
7. 部署验证

## 使用方式

### 方式 1: 直接推送（自动部署）

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main  # 会自动触发部署
```

**适用场景**：
- 紧急修复
- 小型改动
- 独自开发

### 方式 2: Pull Request（推荐）

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发和提交
git add .
git commit -m "feat: 添加新功能"

# 3. 推送分支
git push origin feature/new-feature

# 4. 在 GitHub 上创建 PR
# PR 创建时：运行 CI 测试
# PR 合并后：自动触发部署
```

**适用场景**：
- 团队协作
- 代码审查
- 重要功能
- 多人开发

## 查看状态

### 在 GitHub 上查看

1. 打开仓库：https://github.com/zhanglkx/Canary
2. 点击顶部的 **Actions** 标签
3. 查看工作流执行历史

### 在终端查看（服务器）

```bash
# SSH 登录服务器
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140

# 查看容器状态
docker ps --filter "name=canary"

# 查看部署日志
docker logs canary-api-prod
docker logs canary-web-prod

# 查看最近的部署
ls -lt /opt/canary/backup-* | head -5
```

## 状态徽章

在 README 中添加状态徽章（可选）：

```markdown
[![CI](https://github.com/zhanglkx/Canary/workflows/CI%20-%20Build%20and%20Test/badge.svg)](https://github.com/zhanglkx/Canary/actions)
[![Deploy](https://github.com/zhanglkx/Canary/workflows/Deploy%20to%20Aliyun%20ECS/badge.svg)](https://github.com/zhanglkx/Canary/actions)
```

## 常见问题

### Q: 部署失败了怎么办？

**A:** 
1. 查看 Actions 日志找到错误原因
2. SSH 登录服务器检查：
   ```bash
   cd /opt/canary
   docker logs canary-api-prod --tail 50
   ```
3. 手动回滚（如果需要）：
   ```bash
   docker compose down
   # 恢复备份
   docker compose up -d
   ```

### Q: 如何跳过 CI/CD？

**A:** 在 commit 消息中添加 `[skip ci]`：
```bash
git commit -m "docs: 更新文档 [skip ci]"
```

### Q: 如何只运行 CI 不部署？

**A:** 推送到非主分支：
```bash
git push origin develop  # 只运行 CI，不部署
```

### Q: 如何查看部署历史？

**A:** 访问 Actions 页面查看所有部署记录：
https://github.com/zhanglkx/Canary/actions?query=workflow%3A%22Deploy+to+Aliyun+ECS%22

## 高级配置

### 添加测试环境

创建 `.github/workflows/deploy-staging.yml`:

```yaml
on:
  push:
    branches:
      - develop
```

### 添加 Slack 通知

在工作流中添加：

```yaml
- name: 通知 Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 自动回滚

添加失败时的回滚逻辑：

```yaml
- name: 回滚
  if: failure()
  run: |
    ssh ... "cd /opt/canary && ./rollback.sh"
```

## 安全检查清单

- [x] GitHub Secrets 已配置
- [x] SSH 密钥权限正确（600）
- [ ] 服务器防火墙已配置
- [ ] 阿里云安全组已开放端口
- [ ] 环境变量已在服务器上配置
- [ ] 数据库备份已配置

## 性能优化

### 1. 使用缓存加速构建

工作流已配置 pnpm 缓存和 Docker 构建缓存。

### 2. 并行执行

CI 任务已配置为并行执行：
- Lint
- API 测试
- Web 构建
- Docker 构建

### 3. 增量部署

只在文件变化时重新构建：
```yaml
- uses: dorny/paths-filter@v2
  id: changes
  with:
    filters: |
      api:
        - 'apps/api/**'
      web:
        - 'apps/web/**'
```

## 监控和告警

### 1. 部署通知

所有部署都会在 GitHub 上记录，可以通过邮件接收通知。

### 2. 健康检查

部署后自动检查服务健康状态：
- API 健康检查: `/health`
- 容器状态检查
- 服务响应检查

### 3. 日志聚合

建议配置日志收集服务（如 ELK、Loki）。

## 下一步

1. ✅ 配置 GitHub Secrets
2. ✅ 测试首次部署
3. 📝 配置服务器监控
4. 📝 设置自动备份
5. 📝 添加性能监控
6. 📝 配置 HTTPS

## 相关文档

- [GitHub Actions 详细指南](./GITHUB_ACTIONS_GUIDE.md)
- [阿里云部署指南](./ALIYUN_DEPLOYMENT.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)

## 需要帮助？

- 查看 Actions 日志：https://github.com/zhanglkx/Canary/actions
- 查看详细文档：[GITHUB_ACTIONS_GUIDE.md](./GITHUB_ACTIONS_GUIDE.md)
- 提交 Issue：https://github.com/zhanglkx/Canary/issues

---

**🎉 恭喜！你的 CI/CD 流程已配置完成！**

现在每次推送代码到 main 分支，都会自动部署到阿里云服务器。
