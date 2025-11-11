#!/bin/bash

# 本地服务器部署脚本
# 使用方法: ./deploy/local-deploy.sh
# 注意：此脚本应在服务器上直接运行，不需要远程连接

set -e

echo "🚀 开始在本地服务器部署 Canary 项目..."

# 配置变量
PROJECT_NAME="canary"
DEPLOY_PATH="/opt/${PROJECT_NAME}"
BACKUP_PATH="/opt/backups/${PROJECT_NAME}"
CURRENT_DIR=$(pwd)
PUBLIC_IP="8.159.144.140"  # 阿里云公网 IP，如需修改请编辑此行

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 权限运行此脚本"
        log_info "使用方法: sudo ./deploy/local-deploy.sh"
        exit 1
    fi
}

# 检查必要工具
check_requirements() {
    log_step "检查部署环境..."
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.prod.yml" ]; then
        log_error "请在项目根目录运行此脚本"
        log_error "当前目录: $(pwd)"
        exit 1
    fi
    
    # 检查并安装必要工具
    local tools_to_install=()
    
    if ! command -v curl &> /dev/null; then
        tools_to_install+=("curl")
    fi
    
    if ! command -v wget &> /dev/null; then
        tools_to_install+=("wget")
    fi
    
    if ! command -v tar &> /dev/null; then
        tools_to_install+=("tar")
    fi
    
    # 安装缺失的工具
    if [ ${#tools_to_install[@]} -gt 0 ]; then
        log_info "安装必要工具: ${tools_to_install[*]}"
        
        if command -v yum &> /dev/null; then
            yum install -y "${tools_to_install[@]}"
        elif command -v dnf &> /dev/null; then
            dnf install -y "${tools_to_install[@]}"
        elif command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y "${tools_to_install[@]}"
        else
            log_error "无法自动安装工具，请手动安装: ${tools_to_install[*]}"
            exit 1
        fi
    fi
    
    log_info "环境检查通过"
}

# 安装 Docker
install_docker() {
    log_step "检查并安装 Docker..."
    
    if command -v docker &> /dev/null; then
        log_info "Docker 已安装"
        # 检查 Docker 服务状态
        if ! systemctl is-active --quiet docker; then
            log_info "启动 Docker 服务..."
            systemctl start docker
            systemctl enable docker
        fi
    else
        log_info "安装 Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
        rm -f get-docker.sh
        log_info "Docker 安装完成"
    fi
    
    # 验证 Docker 安装
    if ! docker --version &> /dev/null; then
        log_error "Docker 安装失败"
        exit 1
    fi
}

# 安装 Docker Compose
install_docker_compose() {
    log_step "检查并安装 Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose 已安装"
    else
        log_info "安装 Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # 验证安装
        if ! docker-compose --version &> /dev/null; then
            log_error "Docker Compose 安装失败"
            exit 1
        fi
        
        log_info "Docker Compose 安装完成"
    fi
}

# 安装 Node.js 和 pnpm
install_nodejs() {
    log_step "检查并安装 Node.js 和 pnpm..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_info "安装 Node.js..."
        
        # 检测操作系统
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS_ID=$ID
        else
            OS_ID="unknown"
        fi
        
        case "$OS_ID" in
            "alinux"|"alios")
                # Alibaba Cloud Linux 特殊处理
                log_info "检测到 Alibaba Cloud Linux，使用 EPEL 源安装 Node.js..."
                
                # 安装 EPEL 源
                yum install -y epel-release
                
                # 使用 yum 安装 nodejs 和 npm
                yum install -y nodejs npm
                
                # 如果版本太低，尝试从官方二进制包安装
                NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
                if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 16 ]; then
                    log_info "系统 Node.js 版本过低，安装官方二进制包..."
                    
                    # 下载并安装 Node.js 18 二进制包
                    cd /tmp
                    wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
                    tar -xf node-v18.19.0-linux-x64.tar.xz
                    
                    # 复制到系统目录
                    cp -r node-v18.19.0-linux-x64/{bin,lib,share,include} /usr/local/
                    
                    # 创建符号链接
                    ln -sf /usr/local/bin/node /usr/bin/node
                    ln -sf /usr/local/bin/npm /usr/bin/npm
                    ln -sf /usr/local/bin/npx /usr/bin/npx
                    
                    # 清理临时文件
                    rm -rf /tmp/node-v18.19.0-linux-x64*
                fi
                ;;
            "centos"|"rhel"|"rocky"|"almalinux")
                # CentOS/RHEL 系列
                log_info "安装 Node.js (CentOS/RHEL)..."
                
                # 尝试使用 NodeSource 仓库
                if curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - 2>/dev/null; then
                    yum install -y nodejs
                else
                    # 备用方案：使用 EPEL
                    yum install -y epel-release
                    yum install -y nodejs npm
                fi
                ;;
            "ubuntu"|"debian")
                # Ubuntu/Debian 系列
                log_info "安装 Node.js (Ubuntu/Debian)..."
                curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                apt-get install -y nodejs
                ;;
            *)
                # 通用方案：下载二进制包
                log_info "使用通用方案安装 Node.js..."
                cd /tmp
                wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
                tar -xf node-v18.19.0-linux-x64.tar.xz
                cp -r node-v18.19.0-linux-x64/{bin,lib,share,include} /usr/local/
                ln -sf /usr/local/bin/node /usr/bin/node
                ln -sf /usr/local/bin/npm /usr/bin/npm
                ln -sf /usr/local/bin/npx /usr/bin/npx
                rm -rf /tmp/node-v18.19.0-linux-x64*
                ;;
        esac
        
        # 验证安装
        if ! command -v node &> /dev/null; then
            log_error "Node.js 安装失败"
            exit 1
        fi
        
        log_info "Node.js 安装完成: $(node --version)"
    else
        log_info "Node.js 已安装: $(node --version)"
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_info "安装 pnpm..."
        npm install -g pnpm
        
        # 验证 pnpm 安装
        if ! command -v pnpm &> /dev/null; then
            log_error "pnpm 安装失败"
            exit 1
        fi
        
        log_info "pnpm 安装完成: $(pnpm --version)"
    else
        log_info "pnpm 已安装: $(pnpm --version)"
    fi
}

# 创建必要目录
create_directories() {
    log_step "创建部署目录..."
    
    mkdir -p "${DEPLOY_PATH}"
    mkdir -p "${BACKUP_PATH}"
    mkdir -p "${DEPLOY_PATH}/ssl"
    
    log_info "目录创建完成"
}

# 备份现有部署
backup_existing() {
    log_step "备份现有部署..."
    
    if [ -d "${DEPLOY_PATH}" ] && [ -n "$(ls -A ${DEPLOY_PATH} 2>/dev/null)" ]; then
        local backup_file="${BACKUP_PATH}/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        log_info "创建备份: ${backup_file}"
        tar -czf "${backup_file}" -C "${DEPLOY_PATH}" . || true
        log_info "备份完成"
    else
        log_info "没有现有部署需要备份"
    fi
}

# 构建项目
build_project() {
    log_step "构建项目..."
    
    # 安装依赖
    log_info "安装项目依赖..."
    pnpm install --frozen-lockfile
    
    # 构建项目
    log_info "构建项目..."
    pnpm build
    
    log_info "项目构建完成"
}

# 复制文件到部署目录
copy_files() {
    log_step "复制文件到部署目录..."
    
    # 清理部署目录（保留备份）
    find "${DEPLOY_PATH}" -mindepth 1 -maxdepth 1 ! -name "ssl" -exec rm -rf {} \;
    
    # 复制必要文件
    cp -r apps/ "${DEPLOY_PATH}/"
    cp -r libs/ "${DEPLOY_PATH}/"
    cp package.json pnpm-workspace.yaml pnpm-lock.yaml "${DEPLOY_PATH}/"
    cp tsconfig.base.json "${DEPLOY_PATH}/"
    cp docker-compose.prod.yml "${DEPLOY_PATH}/docker-compose.yml"
    cp nginx.conf "${DEPLOY_PATH}/"
    
    # 复制环境配置文件
    if [ -f "env.production.example" ]; then
        cp env.production.example "${DEPLOY_PATH}/"
    fi
    
    # 创建或更新 .env.production 文件
    if [ ! -f ".env.production" ]; then
        log_info "创建环境配置文件..."
        cat > .env.production << EOF
# 生产环境配置
# 公网 IP: ${PUBLIC_IP}

# 数据库配置
DATABASE_URL="postgresql://canary_user:secure_password_2024@postgres:5432/canary_db"
POSTGRES_DB=canary_db
POSTGRES_USER=canary_user
POSTGRES_PASSWORD=secure_password_2024

# Redis 配置
REDIS_URL="redis://redis:6379"

# JWT 配置
JWT_SECRET="canary-production-jwt-secret-2024"
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
    fi
    
    # 复制环境配置文件
    cp .env.production "${DEPLOY_PATH}/"
    
    log_info "文件复制完成"
}

# 部署应用
deploy_application() {
    log_step "部署应用..."
    
    cd "${DEPLOY_PATH}"
    
    # 停止现有服务
    log_info "停止现有服务..."
    docker-compose down || true
    
    # 清理旧镜像和容器
    log_info "清理旧镜像..."
    docker system prune -f || true
    
    # 启动新服务
    log_info "启动服务..."
    docker-compose up -d --build
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    log_info "检查服务状态..."
    docker-compose ps
    
    cd "${CURRENT_DIR}"
    
    log_info "应用部署完成"
}

# 健康检查
health_check() {
    log_step "执行健康检查..."
    
    local max_attempts=10
    local attempt=1
    
    # 检查 API 服务
    log_info "检查 API 服务..."
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
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "❌ API 服务健康检查失败"
        return 1
    fi
    
    # 检查前端服务
    log_info "检查前端服务..."
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
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "❌ 前端服务健康检查失败"
        return 1
    fi
    
    log_info "✅ 所有服务健康检查通过"
}

# 显示部署信息
show_deployment_info() {
    log_step "部署信息"
    
    echo ""
    echo "🎉 部署完成！"
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
    echo "   重启服务: cd ${DEPLOY_PATH} && docker-compose restart"
    echo "   停止服务: cd ${DEPLOY_PATH} && docker-compose down"
    echo ""
    echo "⚠️  重要提醒："
    echo "   1. 🔥 请在阿里云控制台配置安全组，开放端口 3000, 4000"
    echo "   2. 🔐 建议修改数据库密码和 JWT 密钥"
    echo "   3. 🌍 已自动配置公网 IP: ${PUBLIC_IP}"
    echo ""
}

# 主函数
main() {
    log_info "开始本地部署流程..."
    
    check_root
    check_requirements
    install_docker
    install_docker_compose
    install_nodejs
    create_directories
    backup_existing
    build_project
    copy_files
    deploy_application
    health_check
    show_deployment_info
    
    log_info "🎉 部署流程完成！"
}

# 错误处理
trap 'log_error "部署失败！请检查错误信息"; exit 1' ERR

# 执行主函数
main "$@"
