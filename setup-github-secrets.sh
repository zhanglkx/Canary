#!/bin/bash

# 🔐 GitHub Secrets 配置助手
# 此脚本帮助你获取需要配置到 GitHub Secrets 的信息

echo "================================================"
echo "🚀 Canary 项目 - GitHub Secrets 配置助手"
echo "================================================"
echo ""
echo "请按照以下步骤配置 GitHub Secrets："
echo ""
echo "📍 步骤 1: 访问 GitHub 仓库设置"
echo "   https://github.com/你的用户名/Canary/settings/secrets/actions"
echo ""
echo "================================================"
echo ""

# 1. SERVER_HOST
echo "🖥️  1. 配置 SERVER_HOST"
echo "---"
echo "名称: SERVER_HOST"
echo "值: 8.159.144.140"
echo ""

# 2. SERVER_USER
echo "👤 2. 配置 SERVER_USER"
echo "---"
echo "名称: SERVER_USER"
echo "值: root"
echo ""

# 3. SSH_PRIVATE_KEY
echo "🔑 3. 配置 SSH_PRIVATE_KEY"
echo "---"
echo "名称: SSH_PRIVATE_KEY"
echo ""
echo "获取私钥内容的命令："
echo "cat ~/.ssh/aliyun_key.pem"
echo ""
echo "⚠️ 重要提示："
echo "  - 复制完整内容，包括 -----BEGIN 和 -----END 行"
echo "  - 不要添加额外的空格或换行"
echo "  - 保持原始格式"
echo ""
echo "如果需要查看私钥，请执行："
echo ""

# 检查私钥文件是否存在
if [ -f ~/.ssh/aliyun_key.pem ]; then
    echo "✅ 找到私钥文件: ~/.ssh/aliyun_key.pem"
    echo ""
    read -p "是否显示私钥内容？(y/n): " show_key
    if [ "$show_key" = "y" ] || [ "$show_key" = "Y" ]; then
        echo ""
        echo "================================================"
        echo "SSH 私钥内容（复制以下所有内容到 GitHub Secrets）："
        echo "================================================"
        cat ~/.ssh/aliyun_key.pem
        echo "================================================"
    fi
else
    echo "❌ 未找到私钥文件: ~/.ssh/aliyun_key.pem"
    echo "请确保私钥文件存在"
fi

echo ""
echo "================================================"
echo "📋 配置总结"
echo "================================================"
echo ""
echo "需要在 GitHub Secrets 中配置以下 3 个密钥："
echo ""
echo "1. SERVER_HOST = 8.159.144.140"
echo "2. SERVER_USER = root"
echo "3. SSH_PRIVATE_KEY = (你的SSH私钥内容)"
echo ""
echo "================================================"
echo "🎯 下一步操作"
echo "================================================"
echo ""
echo "1. 访问: https://github.com/你的用户名/Canary/settings/secrets/actions"
echo "2. 点击 'New repository secret'"
echo "3. 分别添加上述 3 个 secrets"
echo "4. 配置完成后，推送代码到 main 分支即可触发自动部署"
echo ""
echo "✅ 手动触发部署："
echo "   访问: https://github.com/你的用户名/Canary/actions"
echo "   选择 'Deploy to Production' -> 'Run workflow'"
echo ""
echo "================================================"
