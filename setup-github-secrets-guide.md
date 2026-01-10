# GitHub Actions 部署配置指南

## 🔧 错误原因分析

GitHub Actions 部署失败的原因是缺少必要的 SSH 连接配置。错误信息：
- `Error: missing server host` - 缺少服务器地址
- `Error: can't connect without a private SSH key or password` - 缺少 SSH 密钥

## 📋 需要配置的 GitHub Secrets

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加以下 secrets：

### 必需的 Secrets

| Secret 名称 | 描述 | 示例值 |
|------------|------|--------|
| `DEPLOY_HOST` | 服务器 IP 地址 | `8.159.144.140` |
| `DEPLOY_USER` | SSH 用户名 | `root` |
| `DEPLOY_KEY` | SSH 私钥内容 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PORT` | SSH 端口（可选） | `22` |

### 可选的 Secrets

| Secret 名称 | 描述 | 默认值 |
|------------|------|--------|
| `DEPLOY_PASSPHRASE` | SSH 密钥密码（如果有） | - |

## 🔑 SSH 密钥获取方法

### 方法 1：使用现有密钥
如果你已经有 SSH 密钥文件（如 `~/.ssh/aliyun_key.pem`）：

```bash
# 查看私钥内容
cat ~/.ssh/aliyun_key.pem
```

复制完整的私钥内容（包括 `-----BEGIN` 和 `-----END` 行）到 `DEPLOY_KEY` secret。

### 方法 2：生成新的 SSH 密钥对

```bash
# 生成新的 SSH 密钥对
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy_key -N ""

# 查看私钥（用于 GitHub Secret）
cat ~/.ssh/github_deploy_key

# 查看公钥（需要添加到服务器）
cat ~/.ssh/github_deploy_key.pub
```

然后将公钥添加到服务器的 `~/.ssh/authorized_keys` 文件中：

```bash
# 在服务器上执行
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 📝 配置步骤

### 1. 在 GitHub 中添加 Secrets

1. 打开你的 GitHub 仓库
2. 点击 Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 依次添加上述必需的 secrets

### 2. 验证服务器连接

在本地测试 SSH 连接：

```bash
# 测试 SSH 连接
ssh -i ~/.ssh/your_key_file root@8.159.144.140

# 或者使用密钥文件
ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140
```

### 3. 验证服务器环境

确保服务器上存在以下目录和文件：

```bash
# 检查项目目录
ls -la /opt/canary/

# 检查环境配置文件
ls -la /opt/canary/.env.clean

# 检查 Docker 和 docker-compose
docker --version
docker-compose --version
```

## 🚀 重新部署

配置完成后，重新触发 GitHub Actions：

1. 推送新的提交到 main/master 分支
2. 或者在 Actions 页面手动触发 workflow

## 🔍 故障排除

### 如果仍然失败：

1. **检查 SSH 密钥格式**：
   - 确保私钥是完整的，包含头尾标识
   - 确保没有多余的空格或换行

2. **检查服务器防火墙**：
   ```bash
   # 检查 SSH 端口是否开放
   sudo ufw status
   sudo iptables -L
   ```

3. **检查 SSH 服务**：
   ```bash
   # 检查 SSH 服务状态
   sudo systemctl status ssh
   ```

4. **查看详细日志**：
   - 在 GitHub Actions 中启用 debug 模式
   - 查看完整的错误日志

## 📞 需要帮助？

如果按照上述步骤配置后仍然失败，请提供：
1. GitHub Actions 的完整错误日志
2. 服务器的 SSH 配置信息
3. 使用的 SSH 密钥类型和格式