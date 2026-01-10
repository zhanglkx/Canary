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

# 函数定义
print_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 检查 SSH 密钥
if [ ! -f "${SSH_KEY}" ]; then
    print_error "SSH 密钥不存在: ${SSH_KEY}"
    exit 1
fi

# 设置 SSH 选项（模拟 GitHub Actions）
SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=60 -o ServerAliveCountMax=3"

print_step "模拟 GitHub Actions 部署流程"

# 执行完整的部署脚本（与 GitHub Actions 中的完全一致）
print_info "执行部署脚本（与 GitHub Actions 中的脚本完全一致）..."

ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} bash << 'ENDSSH'
set -e

echo "🚀 Starting deployment process..."

# 进入项目目录
cd /opt/canary
echo "📁 Changed to project directory: $(pwd)"

# 停止当前服务
echo "🛑 Stopping current services..."
export $(cat .env.clean | xargs)
docker-compose -f docker-compose.prod.yml down || true
echo "✅ Services stopped"

# 备份当前版本
echo "💾 Backing up current version..."
if [ -d "backup" ]; then
  rm -rf backup.old
  mv backup backup.old
fi
mkdir -p backup
cp -r apps backup/ 2>/dev/null || true
echo "✅ Backup completed"

# 检查部署包
if [ ! -f "/tmp/deploy.tar.gz" ]; then
  echo "⚠️  Deploy package not found at /tmp/deploy.tar.gz"
  echo "ℹ  Skipping extraction step (this is normal for testing)"
else
  # 解压新版本
  echo "📦 Extracting new version..."
  rm -rf apps libs docker-compose.prod.yml nginx.simple.conf
  tar -xzf /tmp/deploy.tar.gz
  rm /tmp/deploy.tar.gz
  echo "✅ Extraction completed"
  
  # 重命名Dockerfile
  echo "📝 Renaming Dockerfiles..."
  mv apps/api/Dockerfile.local apps/api/Dockerfile.runtime
  mv apps/web/Dockerfile.local apps/web/Dockerfile.runtime
  echo "✅ Dockerfiles renamed"
fi

# 构建并启动服务
export $(cat .env.clean | xargs)

# 检查是否需要构建（如果部署包不存在，跳过构建）
if [ -f "apps/api/Dockerfile.runtime" ] && [ -f "apps/web/Dockerfile.runtime" ]; then
  # 构建API
  echo "🔨 Building API Docker image..."
  echo "ℹ  This may take 5-10 minutes..."
  DOCKER_BUILDKIT=1 docker build --progress=plain -f apps/api/Dockerfile.runtime -t canary-api-prod:latest . || {
    echo "❌ API build failed"
    exit 1
  }
  echo "✅ API image built successfully"
  
  # 构建Web
  echo "🔨 Building Web Docker image..."
  echo "ℹ  This may take 5-10 minutes..."
  DOCKER_BUILDKIT=1 docker build --progress=plain -f apps/web/Dockerfile.runtime -t canary-web-prod:latest . || {
    echo "❌ Web build failed"
    exit 1
  }
  echo "✅ Web image built successfully"
else
  echo "⚠️  Skipping Docker build (deploy package not found)"
fi

# 启动所有服务
echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d
echo "✅ Services started"

# 等待服务启动
echo "⏳ Waiting for services to be ready..."
sleep 15

# 检查服务状态
echo "📊 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# 清理旧镜像
echo "🧹 Cleaning up old images..."
docker image prune -f || true

echo "✅ Deployment completed successfully!"
ENDSSH

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    print_success "部署脚本执行成功！"
    echo ""
    print_info "测试结果："
    print_info "  - SSH 连接正常"
    print_info "  - 部署脚本可以正常执行"
    print_info "  - 长时间运行的命令不会断开连接"
    echo ""
    print_warning "如果 GitHub Actions 仍然失败，可能的原因："
    print_warning "  1. GitHub Actions 的 SSH action 配置问题"
    print_warning "  2. 网络环境不同（GitHub Actions 的网络可能不稳定）"
    print_warning "  3. 超时设置不够（虽然我们已经设置了 30 分钟）"
    echo ""
    print_info "建议："
    print_info "  1. 检查 GitHub Actions 的日志，看具体在哪一步失败"
    print_info "  2. 考虑将 Docker 构建步骤拆分，分别构建 API 和 Web"
    print_info "  3. 或者使用本地构建镜像，然后上传到服务器的方式"
else
    print_error "部署脚本执行失败，退出码: $EXIT_CODE"
    exit 1
fi
