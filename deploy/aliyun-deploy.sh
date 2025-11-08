#!/bin/bash

# 阿里云服务器部署脚本
# 使用方法: ./deploy/aliyun-deploy.sh

set -e

echo "🚀 开始部署 Canary 项目到阿里云服务器..."

# 配置变量
SERVER_USER="root"
SERVER_HOST="your-server-ip"
PROJECT_NAME="canary"
DEPLOY_PATH="/opt/${PROJECT_NAME}"
BACKUP_PATH="/opt/backups/${PROJECT_NAME}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查必要工具
check_requirements() {
    log_info "检查部署环境..."
    
    if ! command -v ssh &> /dev/null; then
        log_error "SSH 未安装"
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        log_error "rsync 未安装"
        exit 1
    fi
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        log_error "docker-compose.prod.yml 文件不存在"
        exit 1
    fi
    
    log_info "环境检查通过"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 安装依赖
    pnpm install --frozen-lockfile
    
    # 构建项目
    pnpm build
    
    log_info "项目构建完成"
}

# 创建部署包
create_deployment_package() {
    log_info "创建部署包..."
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    
    # 复制必要文件
    cp -r apps/ "${TEMP_DIR}/"
    cp -r libs/ "${TEMP_DIR}/"
    cp package.json pnpm-workspace.yaml pnpm-lock.yaml "${TEMP_DIR}/"
    cp tsconfig.base.json "${TEMP_DIR}/"
    cp docker-compose.prod.yml "${TEMP_DIR}/docker-compose.yml"
    cp nginx.conf "${TEMP_DIR}/"
    cp env.production.example "${TEMP_DIR}/"
    
    # 创建部署脚本
    cat > "${TEMP_DIR}/server-setup.sh" << 'EOF'
#!/bin/bash
set -e

echo "🔧 配置服务器环境..."

# 更新系统
apt-get update && apt-get upgrade -y

# 安装 Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# 安装 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 安装 Nginx (如果不使用容器化 Nginx)
# apt-get install -y nginx

# 创建必要目录
mkdir -p /opt/canary/ssl
mkdir -p /opt/backups/canary

echo "✅ 服务器环境配置完成"
EOF
    
    chmod +x "${TEMP_DIR}/server-setup.sh"
    
    # 打包
    tar -czf canary-deployment.tar.gz -C "${TEMP_DIR}" .
    
    # 清理临时目录
    rm -rf "${TEMP_DIR}"
    
    log_info "部署包创建完成: canary-deployment.tar.gz"
}

# 上传到服务器
upload_to_server() {
    log_info "上传文件到服务器..."
    
    # 创建服务器目录
    ssh "${SERVER_USER}@${SERVER_HOST}" "mkdir -p ${DEPLOY_PATH} ${BACKUP_PATH}"
    
    # 备份现有部署
    ssh "${SERVER_USER}@${SERVER_HOST}" "
        if [ -d '${DEPLOY_PATH}' ] && [ -n \"\$(ls -A ${DEPLOY_PATH})\" ]; then
            echo '备份现有部署...'
            tar -czf ${BACKUP_PATH}/backup-\$(date +%Y%m%d-%H%M%S).tar.gz -C ${DEPLOY_PATH} . || true
        fi
    "
    
    # 上传新文件
    scp canary-deployment.tar.gz "${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/"
    
    # 解压
    ssh "${SERVER_USER}@${SERVER_HOST}" "
        cd ${DEPLOY_PATH}
        tar -xzf canary-deployment.tar.gz
        rm canary-deployment.tar.gz
    "
    
    log_info "文件上传完成"
}

# 服务器环境配置
setup_server_environment() {
    log_info "配置服务器环境..."
    
    ssh "${SERVER_USER}@${SERVER_HOST}" "
        cd ${DEPLOY_PATH}
        chmod +x server-setup.sh
        ./server-setup.sh
    "
    
    log_info "服务器环境配置完成"
}

# 部署应用
deploy_application() {
    log_info "部署应用..."
    
    ssh "${SERVER_USER}@${SERVER_HOST}" "
        cd ${DEPLOY_PATH}
        
        # 停止现有服务
        docker-compose down || true
        
        # 清理旧镜像
        docker system prune -f
        
        # 启动新服务
        docker-compose up -d --build
        
        # 等待服务启动
        echo '等待服务启动...'
        sleep 30
        
        # 检查服务状态
        docker-compose ps
    "
    
    log_info "应用部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查 API 健康状态
    if ssh "${SERVER_USER}@${SERVER_HOST}" "curl -f http://localhost:4000/health" &> /dev/null; then
        log_info "✅ API 服务正常"
    else
        log_error "❌ API 服务异常"
        return 1
    fi
    
    # 检查前端服务
    if ssh "${SERVER_USER}@${SERVER_HOST}" "curl -f http://localhost:3000" &> /dev/null; then
        log_info "✅ 前端服务正常"
    else
        log_error "❌ 前端服务异常"
        return 1
    fi
    
    log_info "✅ 所有服务健康检查通过"
}

# 清理
cleanup() {
    log_info "清理部署文件..."
    rm -f canary-deployment.tar.gz
    log_info "清理完成"
}

# 主函数
main() {
    log_info "开始部署流程..."
    
    check_requirements
    build_project
    create_deployment_package
    upload_to_server
    setup_server_environment
    deploy_application
    health_check
    cleanup
    
    log_info "🎉 部署完成！"
    log_info "访问地址: http://${SERVER_HOST}"
    log_info "API 地址: http://${SERVER_HOST}:4000/graphql"
}

# 错误处理
trap 'log_error "部署失败！"; cleanup; exit 1' ERR

# 执行主函数
main "$@"
