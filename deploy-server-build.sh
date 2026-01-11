#!/bin/bash

# 服务器端构建部署脚本
# 直接在服务器上构建和部署，避免架构不匹配问题
# 使用本地镜像，不依赖 GitHub/GHCR

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

echo "🚀 开始服务器端构建部署（本地镜像模式）..."
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
docker build -f apps/api/Dockerfile -t canary-api:latest . || { echo '❌ API 镜像构建失败'; exit 1; }

echo '🔨 构建 Web 镜像...'
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://$REMOTE_HOST:4000 -t canary-web:latest . || { echo '❌ Web 镜像构建失败'; exit 1; }

echo '✅ 镜像构建完成'
docker images | grep canary
"

success "服务器端构建完成"

# 4. 确保环境配置存在
log "🔧 检查环境配置..."
ssh_exec $REMOTE_USER@$REMOTE_HOST "
cd $REMOTE_PATH

# 如果 .env.production 不存在，创建默认配置
if [ ! -f .env.production ]; then
    echo '创建默认 .env.production 文件...'
    cat > .env.production << 'EOF'
# 数据库配置
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=canary_production
DATABASE_SSL=false

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# API 配置
NEXT_PUBLIC_API_URL=http://$REMOTE_HOST:4000
FRONTEND_URL=http://$REMOTE_HOST

# 支付配置（可选）
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
EOF
    echo '✅ 环境配置文件已创建'
else
    echo '✅ 环境配置文件已存在'
fi
"

# 5. 部署服务
log "🚀 部署服务..."
ssh_exec $REMOTE_USER@$REMOTE_HOST "
cd $REMOTE_PATH

echo '⏹️  停止旧服务...'
docker-compose -f docker-compose.local.yml down 2>/dev/null || true

echo '🔄 启动新服务（使用本地镜像配置）...'
docker-compose -f docker-compose.local.yml up -d

echo '⏳ 等待服务启动...'
sleep 10

echo '📋 服务状态:'
docker-compose -f docker-compose.local.yml ps
"

success "服务部署完成"

# 6. 健康检查
log "🔍 健康检查..."
sleep 15

# 检查服务状态
ssh_exec $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && docker-compose -f docker-compose.local.yml ps"

# 检查容器日志
log "📋 检查容器日志..."
ssh_exec $REMOTE_USER@$REMOTE_HOST "
cd $REMOTE_PATH
echo '--- API 容器日志 (最后20行) ---'
docker logs canary-api-prod --tail 20 2>&1 || echo 'API 容器未运行'
echo ''
echo '--- Web 容器日志 (最后10行) ---'
docker logs canary-web-prod --tail 10 2>&1 || echo 'Web 容器未运行'
"

# 检查 API
API_OK=false
for i in {1..10}; do
    if ssh_exec $REMOTE_USER@$REMOTE_HOST "curl -s http://localhost:4000/health" 2>&1 | grep -q -E '(ok|healthy|status)'; then
        success "API 服务正常"
        API_OK=true
        break
    fi
    [ $i -lt 10 ] && { log "API 检查中... ($i/10)"; sleep 5; }
done

if [ "$API_OK" = false ]; then
    warn "API 服务可能未就绪，请检查日志"
fi

# 检查 Web
WEB_OK=false
for i in {1..10}; do
    if ssh_exec $REMOTE_USER@$REMOTE_HOST "curl -s http://localhost:3000" 2>&1 | grep -q -E '(html|DOCTYPE|next)'; then
        success "Web 服务正常"
        WEB_OK=true
        break
    fi
    [ $i -lt 10 ] && { log "Web 检查中... ($i/10)"; sleep 5; }
done

if [ "$WEB_OK" = false ]; then
    warn "Web 服务可能未就绪，请检查日志"
fi

# 检查网站外部访问
if curl -s --max-time 10 http://$REMOTE_HOST 2>&1 | grep -q -E '(html|DOCTYPE)'; then
    success "网站外部访问正常"
else
    warn "网站外部访问异常，请检查 nginx 配置"
fi

echo ""
success "🎉 部署完成！"
echo "🌐 访问: http://$REMOTE_HOST"
echo "📊 API: http://$REMOTE_HOST:4000"
echo ""
echo "💡 调试命令:"
echo "   查看日志: ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_PATH && docker-compose -f docker-compose.local.yml logs -f'"
echo "   重启服务: ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_PATH && docker-compose -f docker-compose.local.yml restart'"
