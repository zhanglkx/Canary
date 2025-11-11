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
        
        # 安装 NodeSource repository
        if command -v yum &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            yum install -y nodejs
        elif command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
        else
            log_error "无法自动安装 Node.js，请手动安装"
            exit 1
        fi
    else
        log_info "Node.js 已安装: $(node --version)"
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_info "安装 pnpm..."
        npm install -g pnpm
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
    
    # 如果存在 .env.production 文件，也复制过去
    if [ -f ".env.production" ]; then
        cp .env.production "${DEPLOY_PATH}/"
    fi
    
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
    echo ""
    echo "🌐 访问地址:"
    echo "   前端: http://localhost:3000"
    echo "   API:  http://localhost:4000/graphql"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看日志: cd ${DEPLOY_PATH} && docker-compose logs -f"
    echo "   重启服务: cd ${DEPLOY_PATH} && docker-compose restart"
    echo "   停止服务: cd ${DEPLOY_PATH} && docker-compose down"
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
