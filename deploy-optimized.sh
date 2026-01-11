#!/bin/bash

# 一键部署脚本 - 优化版
# 本地代码更新后自动部署到服务器

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

# 检查连接
check_connection() {
    log "检查服务器连接..."
    ssh_exec $REMOTE_USER@$REMOTE_HOST "echo 'Connected'" >/dev/null || error "无法连接服务器"
    success "服务器连接正常"
}

# 构建最新镜像
build_images() {
    log "🔨 构建最新镜像（基于当前代码）..."
    
    # 清理旧镜像确保使用最新代码
    docker rmi canary-api:latest canary-web:latest 2>/dev/null || true
    
    # 构建 API
    log "构建 API 镜像..."
    if docker build -f apps/api/Dockerfile -t canary-api:latest . >/dev/null 2>&1; then
        success "API 镜像构建完成"
    else
        error "API 镜像构建失败"
    fi
    
    # 构建 Web
    log "构建 Web 镜像..."
    if docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://$REMOTE_HOST:4000 -t canary-web:latest . >/dev/null 2>&1; then
        success "Web 镜像构建完成"
    else
        warn "Web 镜像构建失败，尝试使用备用镜像..."
        if docker image inspect canary-web-local:latest >/dev/null 2>&1; then
            docker tag canary-web-local:latest canary-web:latest
            warn "使用 canary-web-local 作为备用"
        else
            error "没有可用的 Web 镜像"
        fi
    fi
}

# 导出和上传镜像
export_and_upload() {
    log "📦 导出镜像..."
    docker save canary-api:latest | gzip -1 > /tmp/canary-api.tar.gz &
    docker save canary-web:latest | gzip -1 > /tmp/canary-web.tar.gz &
    wait
    
    API_SIZE=$(du -h /tmp/canary-api.tar.gz | cut -f1)
    WEB_SIZE=$(du -h /tmp/canary-web.tar.gz | cut -f1)
    success "镜像导出完成 (API: $API_SIZE, Web: $WEB_SIZE)"
    
    log "📤 上传到服务器..."
    ssh_exec $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH"
    scp_exec -C /tmp/canary-api.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/ &
    scp_exec -C /tmp/canary-web.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/ &
    wait
    success "镜像上传完成"
}

# 上传配置
upload_configs() {
    log "📋 上传配置文件..."
    scp_exec docker-compose.prod.yml $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
    scp_exec .env.production $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
    [ -f nginx.simple.conf ] && scp_exec nginx.simple.conf $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
    success "配置上传完成"
}

# 服务器部署
deploy_on_server() {
    log "🚀 服务器部署..."
    ssh_exec $REMOTE_USER@$REMOTE_HOST "
        cd $REMOTE_PATH
        echo '⏹️  停止旧服务...'
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
        
        echo '📦 加载镜像...'
        docker load < canary-api.tar.gz
        docker load < canary-web.tar.gz
        
        echo '⚙️  更新配置...'
        sed -i 's|ghcr.io/.*canary-api.*|canary-api:latest|g' docker-compose.prod.yml
        sed -i 's|ghcr.io/.*canary-web.*|canary-web:latest|g' docker-compose.prod.yml
        
        echo '🔄 启动服务...'
        docker-compose -f docker-compose.prod.yml up -d
        
        echo '🧹 清理文件...'
        rm -f canary-api.tar.gz canary-web.tar.gz
    "
    success "服务器部署完成"
}

# 健康检查
health_check() {
    log "🔍 健康检查..."
    sleep 15
    
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
}

# 清理
cleanup() {
    rm -f /tmp/canary-api.tar.gz /tmp/canary-web.tar.gz
}

# 主流程
main() {
    echo "🚀 开始一键部署 - 优化版"
    echo "📅 $(date)"
    echo "🎯 目标: $REMOTE_HOST"
    echo ""
    
    local start_time=$(date +%s)
    
    check_connection
    build_images
    export_and_upload
    upload_configs
    deploy_on_server
    health_check
    cleanup
    
    local duration=$(($(date +%s) - start_time))
    
    echo ""
    success "🎉 部署完成！"
    echo "⏱️  耗时: ${duration}秒"
    echo "🌐 访问: http://$REMOTE_HOST"
    echo "📊 API: http://$REMOTE_HOST:4000"
}

# 错误处理
trap cleanup EXIT

# 执行
main