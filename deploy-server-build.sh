#!/bin/bash

# 服务器端构建部署脚本
# 直接在服务器上构建和部署，避免架构不匹配问题

set -e

# 服务器配置
REMOTE_HOST="8.159.144.140"
REMOTE_USER="root"
REMOTE_PATH="/opt/canary"
SSH_KEY="$HOME/.ssh/aliyun_key.pem"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}⚠️${NC} $1"; }

# SSH 命令包装
ssh_exec() { ssh -i "$SSH_KEY" "$@"; }
scp_exec() { scp -i "$SSH_KEY" "$@"; }

echo "🚀 开始服务器端构建部署..."
echo "📅 $(date)"
echo "🎯 目标: $REMOTE_HOST"
echo ""

# 1. 检查连接
log "检查服务器连接..."
ssh_exec $REMOTE_USER@$REMOTE_HOST "echo 'Connected'" >/dev/null || error "无法连接服务器"
success "服务器连接正常"

# 2. 上传最新代码
log "📤 上传最新代码到服务器..."
ssh_exec $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH"

# 上传项目文件
log "上传项目代码..."
# 创建临时压缩包
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.next' \
    --exclude='*.tar.gz' \
    -czf /tmp/canary-code.tar.gz .

# 上传并解压
scp_exec /tmp/canary-code.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
ssh_exec $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && tar -xzf canary-code.tar.gz && rm canary-code.tar.gz"

# 清理本地临时文件
rm -f /tmp/canary-code.tar.gz

success "代码上传完成"

# 3. 在服务器上构建镜像
log "🔨 在服务器上构建镜像..."
ssh_exec $REMOTE_USER@$REMOTE_HOST "
cd $REMOTE_PATH

echo '🧹 清理旧镜像...'
docker rmi canary-api:latest canary-web:latest 2>/dev/null || true

echo '🔨 构建 API 镜像...'
docker build -f apps/api/Dockerfile -t canary-api:latest .

echo '🔨 构建 Web 镜像...'
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://$REMOTE_HOST:4000 -t canary-web:latest .

echo '✅ 镜像构建完成'
"

success "服务器端构建完成"

# 4. 部署服务
log "🚀 部署服务..."
ssh_exec $REMOTE_USER@$REMOTE_HOST "
cd $REMOTE_PATH

echo '⏹️  停止旧服务...'
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

echo '⚙️  更新配置...'
sed -i 's|ghcr.io/.*canary-api.*|canary-api:latest|g' docker-compose.prod.yml
sed -i 's|ghcr.io/.*canary-web.*|canary-web:latest|g' docker-compose.prod.yml

echo '🔄 启动新服务...'
docker-compose -f docker-compose.prod.yml up -d

echo '✅ 服务启动完成'
"

success "服务部署完成"

# 5. 健康检查
log "🔍 健康检查..."
sleep 20

# 检查服务状态
ssh_exec $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && docker-compose -f docker-compose.prod.yml ps"

# 检查 API
for i in {1..6}; do
    if ssh_exec $REMOTE_USER@$REMOTE_HOST "curl -s http://localhost:4000/health" >/dev/null 2>&1; then
        success "API 服务正常"
        break
    fi
    [ $i -lt 6 ] && { log "API 检查中... ($i/6)"; sleep 5; }
done

# 检查 Web
for i in {1..6}; do
    if ssh_exec $REMOTE_USER@$REMOTE_HOST "curl -s http://localhost:3000" >/dev/null 2>&1; then
        success "Web 服务正常"
        break
    fi
    [ $i -lt 6 ] && { log "Web 检查中... ($i/6)"; sleep 5; }
done

# 检查网站
if curl -s http://$REMOTE_HOST >/dev/null 2>&1; then
    success "网站访问正常"
else
    warn "网站访问异常，请检查"
fi

echo ""
success "🎉 部署完成！"
echo "🌐 访问: http://$REMOTE_HOST"
echo "📊 API: http://$REMOTE_HOST:4000"
echo ""
echo "💡 提示: 现在网站显示的构建时间应该是最新的了！"