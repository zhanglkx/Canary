#!/bin/bash

# 环境配置脚本
# 用于在服务器上设置环境变量

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

# 创建生产环境配置文件
create_production_env() {
    log_info "创建生产环境配置文件..."
    
    local env_file=".env.production"
    
    if [ -f "$env_file" ]; then
        log_warn "环境配置文件已存在，创建备份..."
        cp "$env_file" "${env_file}.backup.$(date +%Y%m%d-%H%M%S)"
    fi
    
    cat > "$env_file" << 'EOF'
# 生产环境配置

# 数据库配置
DATABASE_URL="postgresql://canary_user:canary_password@postgres:5432/canary_db"
POSTGRES_DB=canary_db
POSTGRES_USER=canary_user
POSTGRES_PASSWORD=canary_password

# Redis 配置
REDIS_URL="redis://redis:6379"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
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

# 邮件配置（可选）
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# 其他配置
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
EOF
    
    log_info "环境配置文件创建完成: $env_file"
    log_warn "请根据实际情况修改配置文件中的值"
}

# 设置防火墙规则
setup_firewall() {
    log_info "配置防火墙规则..."
    
    if command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL/Alibaba Cloud Linux
        log_info "使用 firewalld 配置防火墙..."
        
        # 开放必要端口
        firewall-cmd --permanent --add-port=3000/tcp  # 前端
        firewall-cmd --permanent --add-port=4000/tcp  # API
        firewall-cmd --permanent --add-port=80/tcp    # HTTP
        firewall-cmd --permanent --add-port=443/tcp   # HTTPS
        
        # 重载防火墙规则
        firewall-cmd --reload
        
        log_info "防火墙规则配置完成"
        
    elif command -v ufw &> /dev/null; then
        # Ubuntu/Debian
        log_info "使用 ufw 配置防火墙..."
        
        ufw allow 3000/tcp
        ufw allow 4000/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        log_info "防火墙规则配置完成"
        
    else
        log_warn "未检测到防火墙管理工具，请手动开放端口 3000, 4000, 80, 443"
    fi
}

# 优化系统设置
optimize_system() {
    log_info "优化系统设置..."
    
    # 增加文件描述符限制
    cat >> /etc/security/limits.conf << 'EOF'
# Canary 应用优化
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF
    
    # 优化内核参数
    cat >> /etc/sysctl.conf << 'EOF'
# Canary 应用网络优化
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000
EOF
    
    # 应用内核参数
    sysctl -p
    
    log_info "系统优化完成"
}

# 创建系统服务
create_systemd_service() {
    log_info "创建系统服务..."
    
    cat > /etc/systemd/system/canary.service << 'EOF'
[Unit]
Description=Canary Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/canary
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    # 重载 systemd 配置
    systemctl daemon-reload
    systemctl enable canary.service
    
    log_info "系统服务创建完成"
    log_info "使用以下命令管理服务:"
    log_info "  启动: systemctl start canary"
    log_info "  停止: systemctl stop canary"
    log_info "  重启: systemctl restart canary"
    log_info "  状态: systemctl status canary"
}

# 主函数
main() {
    log_info "开始环境配置..."
    
    # 检查是否为 root 用户
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 权限运行此脚本"
        exit 1
    fi
    
    create_production_env
    setup_firewall
    optimize_system
    create_systemd_service
    
    log_info "🎉 环境配置完成！"
    
    echo ""
    echo "📋 下一步操作:"
    echo "1. 编辑 .env.production 文件，修改数据库密码等敏感信息"
    echo "2. 运行部署脚本: sudo ./deploy/local-deploy.sh"
    echo "3. 检查服务状态: systemctl status canary"
    echo ""
}

# 执行主函数
main "$@"
