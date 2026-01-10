#!/bin/bash
# GHCR 服务器配置脚本
# 用于在远程服务器上配置 GitHub Container Registry 登录

set -e

echo "=================================================="
echo "  GHCR (GitHub Container Registry) 配置脚本"
echo "=================================================="

# 检查参数
if [ -z "$1" ] || [ -z "$2" ]; then
    echo ""
    echo "用法: ./setup-ghcr.sh <GITHUB_USERNAME> <GITHUB_TOKEN>"
    echo ""
    echo "参数说明:"
    echo "  GITHUB_USERNAME: 你的 GitHub 用户名"
    echo "  GITHUB_TOKEN:    GitHub Personal Access Token (需要 packages:read 权限)"
    echo ""
    echo "获取 Token 的步骤:"
    echo "  1. 访问 https://github.com/settings/tokens/new"
    echo "  2. 选择 'Generate new token (classic)'"
    echo "  3. 勾选 'read:packages' 权限"
    echo "  4. 生成并复制 Token"
    echo ""
    exit 1
fi

GITHUB_USERNAME=$1
GITHUB_TOKEN=$2

echo ""
echo "📋 配置信息:"
echo "   用户名: $GITHUB_USERNAME"
echo "   Token:  ****${GITHUB_TOKEN: -4}"
echo ""

# 登录 GHCR
echo "🔐 登录 GitHub Container Registry..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ GHCR 登录成功！"
    echo ""
    echo "下一步操作:"
    echo "  1. 确保 .env.production 文件已配置正确"
    echo "  2. 设置镜像所有者: export GHCR_OWNER=$GITHUB_USERNAME"
    echo "  3. 拉取镜像: docker-compose -f docker-compose.prod.yml pull"
    echo "  4. 启动服务: docker-compose -f docker-compose.prod.yml up -d"
    echo ""
else
    echo ""
    echo "❌ GHCR 登录失败，请检查用户名和 Token"
    exit 1
fi
