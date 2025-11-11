#!/bin/bash

# Alibaba Cloud Linux 3 专用部署脚本
# 使用方法: sudo ./deploy/alinux-deploy.sh

set -e

echo "🚀 开始在 Alibaba Cloud Linux 3 上部署 Canary 项目..."

# 配置变量
PROJECT_NAME="canary"
DEPLOY_PATH="/opt/${PROJECT_NAME}"
BACKUP_PATH="/opt/backups/${PROJECT_NAME}"
CURRENT_DIR=$(pwd)
PUBLIC_IP="8.159.144.140"  # 阿里云公网 IP

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行此脚本"
    log_info "使用方法: sudo ./deploy/alinux-deploy.sh"
    exit 1
fi

# 检查是否为 Alibaba Cloud Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" != "alinux" && "$ID" != "alios" ]]; then
        log_warn "此脚本专为 Alibaba Cloud Linux 设计，当前系统: $PRETTY_NAME"
        log_warn "建议使用 ./deploy/local-deploy.sh"
    fi
else
    log_warn "无法检测操作系统版本"
fi

# 步骤1: 安装基础工具
log_step "安装基础工具..."
yum update -y
yum install -y curl wget tar gzip unzip git nano

# 步骤2: 安装 Docker
log_step "安装 Docker..."
if ! command -v docker &> /dev/null; then
    log_info "下载并安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm -f get-docker.sh
    
    # 将当前用户添加到 docker 组（如果不是 root）
    if [ "$USER" != "root" ] && [ -n "$USER" ]; then
        usermod -aG docker $USER
    fi
else
    log_info "Docker 已安装"
    systemctl start docker || true
    systemctl enable docker || true
fi

# 步骤3: 安装 Docker Compose
log_step "安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    log_info "下载并安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # 创建符号链接
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
else
    log_info "Docker Compose 已安装"
fi

# 步骤4: 安装 Node.js (专为 Alibaba Cloud Linux 优化)
log_step "安装 Node.js..."
if ! command -v node &> /dev/null; then
    log_info "为 Alibaba Cloud Linux 安装 Node.js..."
    
    # 方法1: 尝试 EPEL 源
    yum install -y epel-release
    yum install -y nodejs npm
    
    # 检查版本，如果太低则使用二进制包
    NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 2>/dev/null || echo "0")
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_info "系统 Node.js 版本过低 (v$NODE_VERSION)，安装最新版本..."
        
        # 下载 Node.js 18 二进制包
        cd /tmp
        wget -q https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
        tar -xf node-v18.19.0-linux-x64.tar.xz
        
        # 备份旧版本
        if command -v node &> /dev/null; then
            mv /usr/bin/node /usr/bin/node.old 2>/dev/null || true
            mv /usr/bin/npm /usr/bin/npm.old 2>/dev/null || true
        fi
        
        # 安装新版本
        cp -r node-v18.19.0-linux-x64/{bin,lib,share,include} /usr/local/
        ln -sf /usr/local/bin/node /usr/bin/node
        ln -sf /usr/local/bin/npm /usr/bin/npm
        ln -sf /usr/local/bin/npx /usr/bin/npx
        
        # 清理
        rm -rf /tmp/node-v18.19.0-linux-x64*
    fi
else
    log_info "Node.js 已安装: $(node --version)"
fi

# 步骤5: 安装 pnpm
log_step "安装 pnpm..."
if ! command -v pnpm &> /dev/null; then
    log_info "安装 pnpm..."
    npm install -g pnpm
else
    log_info "pnpm 已安装: $(pnpm --version)"
fi

# 步骤6: 创建目录
log_step "创建必要目录..."
mkdir -p "${DEPLOY_PATH}"
mkdir -p "${BACKUP_PATH}"
mkdir -p "${DEPLOY_PATH}/ssl"

# 步骤7: 配置防火墙
log_step "配置防火墙..."
if systemctl is-active --quiet firewalld; then
    log_info "配置 firewalld 规则..."
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=4000/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --reload
elif command -v iptables &> /dev/null; then
    log_info "配置 iptables 规则..."
    iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
    iptables -I INPUT -p tcp --dport 4000 -j ACCEPT
    iptables -I INPUT -p tcp --dport 80 -j ACCEPT
    iptables -I INPUT -p tcp --dport 443 -j ACCEPT
    # 保存规则
    iptables-save > /etc/sysconfig/iptables 2>/dev/null || true
else
    log_warn "未找到防火墙工具，请手动配置端口"
fi

# 步骤8: 创建环境配置
log_step "创建环境配置..."
log_info "配置公网 IP: ${PUBLIC_IP}"

cat > .env.production << EOF
# Alibaba Cloud Linux 3 生产环境配置
# 公网 IP: ${PUBLIC_IP}

# 数据库配置
DATABASE_URL="postgresql://canary_user:AliCloud2024!@postgres:5432/canary_db"
POSTGRES_DB=canary_db
POSTGRES_USER=canary_user
POSTGRES_PASSWORD=AliCloud2024!

# Redis 配置
REDIS_URL="redis://redis:6379"

# JWT 配置
JWT_SECRET="alibaba-cloud-canary-jwt-secret-2024"
JWT_EXPIRES_IN="7d"

# API 配置
API_PORT=4000
API_HOST=0.0.0.0

# 前端配置 - 使用公网 IP
NEXT_PUBLIC_API_URL="http://${PUBLIC_IP}:4000/graphql"
NEXT_PUBLIC_WS_URL="ws://${PUBLIC_IP}:4000/graphql"

# 环境
NODE_ENV=production

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH="/app/uploads"

# CORS 配置 - 允许公网 IP 访问
CORS_ORIGIN="http://${PUBLIC_IP}:3000,http://localhost:3000"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
EOF

log_info "环境配置文件已创建（已配置公网 IP: ${PUBLIC_IP}）"

# 步骤9: 构建和部署
log_step "构建项目..."
if [ ! -f "package.json" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖
log_info "安装项目依赖..."
pnpm install --frozen-lockfile

# 构建项目
log_info "构建项目..."
pnpm build

# 步骤10: 复制文件
log_step "复制文件到部署目录..."
# 备份现有部署
if [ -d "${DEPLOY_PATH}" ] && [ -n "$(ls -A ${DEPLOY_PATH} 2>/dev/null)" ]; then
    backup_file="${BACKUP_PATH}/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    log_info "创建备份: ${backup_file}"
    tar -czf "${backup_file}" -C "${DEPLOY_PATH}" . || true
fi

# 清理并复制文件
find "${DEPLOY_PATH}" -mindepth 1 -maxdepth 1 ! -name "ssl" -exec rm -rf {} \; 2>/dev/null || true
cp -r apps/ "${DEPLOY_PATH}/"
cp -r libs/ "${DEPLOY_PATH}/"
cp package.json pnpm-workspace.yaml pnpm-lock.yaml "${DEPLOY_PATH}/"
cp tsconfig.base.json "${DEPLOY_PATH}/"
cp docker-compose.prod.yml "${DEPLOY_PATH}/docker-compose.yml"
cp nginx.conf "${DEPLOY_PATH}/" 2>/dev/null || true
cp .env.production "${DEPLOY_PATH}/"

# 步骤11: 启动服务
log_step "启动服务..."
cd "${DEPLOY_PATH}"

# 停止现有服务
docker-compose down || true

# 清理旧镜像
docker system prune -f || true

# 启动服务
log_info "启动 Docker 服务..."
docker-compose up -d --build

# 等待服务启动
log_info "等待服务启动..."
sleep 30

# 检查服务状态
log_info "检查服务状态..."
docker-compose ps

cd "${CURRENT_DIR}"

# 步骤12: 健康检查
log_step "健康检查..."
max_attempts=10
attempt=1

# 检查 API
while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:4000/health &> /dev/null; then
        log_info "✅ API 服务正常"
        break
    else
        log_warn "API 服务检查失败，尝试 $attempt/$max_attempts"
        sleep 10
        ((attempt++))
    fi
done

# 检查前端
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000 &> /dev/null; then
        log_info "✅ 前端服务正常"
        break
    else
        log_warn "前端服务检查失败，尝试 $attempt/$max_attempts"
        sleep 10
        ((attempt++))
    fi
done

# 创建系统服务
log_step "创建系统服务..."
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

systemctl daemon-reload
systemctl enable canary.service

# 完成
echo ""
echo "🎉 Alibaba Cloud Linux 3 部署完成！"
echo ""
echo "📍 部署路径: ${DEPLOY_PATH}"
echo "📍 备份路径: ${BACKUP_PATH}"
echo "📍 公网 IP: ${PUBLIC_IP}"
echo ""
echo "🌐 本地访问地址（从你的电脑访问）:"
echo "   🖥️  前端应用: http://${PUBLIC_IP}:3000"
echo "   🔗 GraphQL API: http://${PUBLIC_IP}:4000/graphql"
echo "   ❤️  健康检查: http://${PUBLIC_IP}:4000/health"
echo ""
echo "🌐 服务器本地访问地址:"
echo "   前端: http://localhost:3000"
echo "   API:  http://localhost:4000/graphql"
echo ""
echo "🔧 管理命令:"
echo "   查看日志: cd ${DEPLOY_PATH} && docker-compose logs -f"
echo "   重启服务: systemctl restart canary"
echo "   停止服务: systemctl stop canary"
echo "   服务状态: systemctl status canary"
echo ""
echo "⚠️  重要提醒："
echo "   1. 🔥 请在阿里云控制台配置安全组，开放端口 3000, 4000"
echo "   2. 🔐 建议修改数据库密码和 JWT 密钥"
echo "   3. 🌍 已自动配置公网 IP，可直接从本地访问"
echo ""
echo "📋 阿里云安全组配置步骤："
echo "   1. 登录阿里云控制台"
echo "   2. 进入 ECS 实例管理"
echo "   3. 点击实例 -> 安全组 -> 配置规则"
echo "   4. 添加入方向规则："
echo "      - 端口范围: 3000/3000, 协议: TCP, 授权对象: 0.0.0.0/0"
echo "      - 端口范围: 4000/4000, 协议: TCP, 授权对象: 0.0.0.0/0"
echo ""

log_info "🎉 部署流程完成！"
