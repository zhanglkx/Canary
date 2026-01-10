#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SERVER_HOST="${SERVER_HOST:-8.159.144.140}"
SERVER_USER="${SERVER_USER:-root}"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/aliyun_key.pem}"

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

print_info "检查并修复服务器的 Docker 镜像源配置..."

ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} bash << 'ENDSSH'
set -e

echo "📋 当前 Docker 配置："
cat /etc/docker/daemon.json 2>/dev/null || echo "Docker daemon.json 不存在"

echo ""
echo "🔧 配置 Docker 镜像加速器..."

# 创建或更新 daemon.json
mkdir -p /etc/docker

# 使用阿里云镜像加速器（更稳定）
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "insecure-registries": [],
  "experimental": false,
  "debug": false
}
EOF

echo "✅ Docker 镜像加速器配置完成"

# 重启 Docker 服务
echo "🔄 重启 Docker 服务..."
systemctl restart docker || service docker restart

echo "✅ Docker 服务已重启"

# 测试镜像拉取
echo "🧪 测试镜像拉取..."
docker pull node:20-alpine || {
    echo "⚠️  首次拉取可能失败，这是正常的"
    echo "ℹ  可以稍后重试"
}

echo "✅ 配置完成"
ENDSSH

if [ $? -eq 0 ]; then
    print_success "Docker 镜像源配置完成！"
    echo ""
    print_info "现在可以重新运行部署测试："
    print_info "  ./test-github-deploy.sh"
else
    print_error "配置失败"
    exit 1
fi
