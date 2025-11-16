#!/bin/bash

# 快速配置 GitHub Secrets 的辅助脚本

set -e

echo "=========================================="
echo "GitHub Secrets 配置助手"
echo "=========================================="
echo ""

# 检查必要的文件
if [ ! -f ~/.ssh/aliyun_key.pem ]; then
    echo "❌ 错误: 找不到 SSH 密钥文件 ~/.ssh/aliyun_key.pem"
    exit 1
fi

echo "📝 需要配置的 GitHub Secrets:"
echo ""
echo "1. ALIYUN_HOST"
echo "   值: 8.159.144.140"
echo ""
echo "2. ALIYUN_SSH_KEY"
echo "   值: (SSH 私钥内容)"
echo ""

echo "=========================================="
echo "步骤 1: 获取 SSH 私钥"
echo "=========================================="
echo ""
echo "请复制以下内容到 GitHub Secrets (ALIYUN_SSH_KEY):"
echo ""
echo "--- SSH 私钥开始 ---"
cat ~/.ssh/aliyun_key.pem
echo "--- SSH 私钥结束 ---"
echo ""

echo "=========================================="
echo "步骤 2: 在 GitHub 上配置 Secrets"
echo "=========================================="
echo ""
echo "1. 打开浏览器访问:"
echo "   https://github.com/zhanglkx/Canary/settings/secrets/actions"
echo ""
echo "2. 点击 'New repository secret'"
echo ""
echo "3. 添加第一个 Secret:"
echo "   Name: ALIYUN_HOST"
echo "   Value: 8.159.144.140"
echo ""
echo "4. 再次点击 'New repository secret'"
echo ""
echo "5. 添加第二个 Secret:"
echo "   Name: ALIYUN_SSH_KEY"
echo "   Value: (复制上面显示的完整私钥内容)"
echo ""
echo "=========================================="
echo "步骤 3: 验证配置"
echo "=========================================="
echo ""
echo "配置完成后，推送代码到 main 分支即可触发部署:"
echo ""
echo "  git add ."
echo "  git commit -m 'chore: 配置 CI/CD'"
echo "  git push origin main"
echo ""
echo "然后访问以下地址查看执行状态:"
echo "  https://github.com/zhanglkx/Canary/actions"
echo ""
echo "=========================================="
echo "✅ 配置助手完成"
echo "=========================================="
