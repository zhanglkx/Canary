# ⚡ 快速配置指南

## 🎯 配置 GitHub Secrets（必需）

在开始自动部署前，你需要配置以下 GitHub Secrets：

### 1. 访问 GitHub 仓库设置

```
https://github.com/zhanglkx/Canary/settings/secrets/actions
```

### 2. 添加以下 3 个 Secrets

点击 **"New repository secret"** 分别添加：

#### SECRET 1: SERVER_HOST
```
名称: SERVER_HOST
值: 8.159.144.140
```

#### SECRET 2: SERVER_USER
```
名称: SERVER_USER
值: root
```

#### SECRET 3: SSH_PRIVATE_KEY

```
名称: SSH_PRIVATE_KEY
值: (执行下面的命令获取)
```

**获取 SSH 私钥：**

```bash
# 查看私钥内容
cat ~/.ssh/aliyun_key.pem
```

⚠️ **复制完整内容**，包括：
- `-----BEGIN RSA PRIVATE KEY-----`（开头）
- 中间所有内容
- `-----END RSA PRIVATE KEY-----`（结尾）

## 🚀 触发部署

### 方式 1：自动触发（推荐）

任何推送到 `main` 分支的提交都会自动触发部署：

```bash
git push origin main
```

### 方式 2：手动触发

1. 访问: https://github.com/zhanglkx/Canary/actions
2. 选择左侧的 **"Deploy to Production"**
3. 点击右上角 **"Run workflow"**
4. 选择分支（通常是 `main`）
5. 点击绿色按钮 **"Run workflow"**

## 📊 监控部署进度

1. 访问: https://github.com/zhanglkx/Canary/actions
2. 点击最新的工作流运行
3. 查看实时日志和进度

## ✅ 验证部署

部署成功后，访问以下地址验证：

- **Web前端**: http://8.159.144.140
- **API后端**: http://8.159.144.140/api

## 📖 详细文档

查看完整的部署文档和故障排查：

```bash
# 查看详细文档
cat DEPLOYMENT.md

# 或运行配置助手
./setup-github-secrets.sh
```

## ⏱️ 预计部署时间

- **GitHub Actions 构建**: 2-3 分钟
- **服务器部署**: 1-2 分钟
- **总计**: 约 3-5 分钟

## 🎉 完成！

配置完成后，每次推送代码到 `main` 分支都会自动部署！

