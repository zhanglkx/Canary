#!/bin/bash

# 快速修复脚本 - 解决 FirewallD 问题
# 使用方法: sudo ./deploy/quick-fix.sh

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行此脚本"
    log_info "使用方法: sudo ./deploy/quick-fix.sh"
    exit 1
fi

log_info "🔧 开始快速修复 FirewallD 问题..."

# 安装常用工具
log_info "安装常用编辑工具..."
if ! command -v nano &> /dev/null; then
    log_info "安装 nano 编辑器..."
    yum install -y nano 2>/dev/null || dnf install -y nano 2>/dev/null || apt-get install -y nano 2>/dev/null || log_warn "nano 安装失败，请使用 vi 编辑器"
fi

# 方案1: 尝试启动 firewalld
log_info "尝试启动 firewalld 服务..."
if systemctl start firewalld 2>/dev/null && systemctl enable firewalld 2>/dev/null; then
    log_info "✅ firewalld 服务启动成功"
    
    # 配置防火墙规则
    log_info "配置防火墙规则..."
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=4000/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --reload
    
    log_info "✅ 防火墙规则配置完成"
    
else
    log_warn "firewalld 启动失败，使用 iptables 替代方案..."
    
    # 方案2: 使用 iptables
    if command -v iptables &> /dev/null; then
        log_info "使用 iptables 配置防火墙..."
        
        # 开放必要端口
        iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
        iptables -I INPUT -p tcp --dport 4000 -j ACCEPT 2>/dev/null || true
        iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
        iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
        
        # 尝试保存规则
        if [ -d "/etc/sysconfig" ]; then
            iptables-save > /etc/sysconfig/iptables 2>/dev/null || true
        fi
        
        log_info "✅ iptables 规则配置完成"
    else
        log_warn "iptables 也不可用，跳过防火墙配置"
    fi
fi

# 检查阿里云安全组提醒
log_warn "⚠️  重要提醒：阿里云安全组配置"
log_warn "除了服务器防火墙，还需要在阿里云控制台配置安全组："
log_warn "1. 登录阿里云控制台"
log_warn "2. 进入 ECS 实例管理"
log_warn "3. 点击您的实例 -> 安全组 -> 配置规则"
log_warn "4. 添加入方向规则，开放以下端口："
log_warn "   - 3000/tcp (前端应用)"
log_warn "   - 4000/tcp (API 服务)"
log_warn "   - 80/tcp (HTTP)"
log_warn "   - 443/tcp (HTTPS)"

# 创建简化的环境配置
log_info "创建简化的环境配置..."

if [ ! -f ".env.production" ]; then
    cat > .env.production << 'EOF'
# 生产环境配置

# 数据库配置
DATABASE_URL="postgresql://canary_user:canary_password_2024@postgres:5432/canary_db"
POSTGRES_DB=canary_db
POSTGRES_USER=canary_user
POSTGRES_PASSWORD=canary_password_2024

# Redis 配置
REDIS_URL="redis://redis:6379"

# JWT 配置
JWT_SECRET="canary-super-secret-jwt-key-2024-change-this"
JWT_EXPIRES_IN="7d"

# API 配置
API_PORT=4000
API_HOST=0.0.0.0

# 前端配置
NEXT_PUBLIC_API_URL="http://localhost:4000/graphql"
NEXT_PUBLIC_WS_URL="ws://localhost:4000/graphql"

# 环境
NODE_ENV=production

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH="/app/uploads"

# 其他配置
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
EOF
    
    log_info "✅ 环境配置文件创建完成"
else
    log_info "环境配置文件已存在，跳过创建"
fi

# 创建必要目录
log_info "创建必要目录..."
mkdir -p /opt/canary
mkdir -p /opt/backups/canary

log_info "🎉 快速修复完成！"
log_info ""
log_info "📋 下一步操作："
log_info "1. 编辑环境配置文件（可选）: nano .env.production"
log_info "2. 运行部署脚本: sudo ./deploy/local-deploy.sh"
log_info ""
log_info "🔍 如果遇到网络访问问题，请检查阿里云安全组配置"
