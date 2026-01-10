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

# 检查 SSH 连接
test_ssh_connection() {
    print_step "测试 SSH 连接"
    
    print_info "尝试连接到 ${SERVER_USER}@${SERVER_HOST}..."
    
    if ssh -i ${SSH_KEY} -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} "echo 'SSH connection successful'" 2>&1; then
        print_success "SSH 连接成功"
        return 0
    else
        print_error "SSH 连接失败"
        print_info "请检查："
        print_info "  1. SSH 密钥路径: ${SSH_KEY}"
        print_info "  2. 服务器地址: ${SERVER_HOST}"
        print_info "  3. 用户名: ${SERVER_USER}"
        print_info "  4. 服务器防火墙设置"
        return 1
    fi
}

# 测试基本命令
test_basic_commands() {
    print_step "测试基本命令执行"
    
    print_info "测试 pwd 命令..."
    if ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "pwd" > /dev/null 2>&1; then
        print_success "pwd 命令执行成功"
    else
        print_error "pwd 命令执行失败"
        return 1
    fi
    
    print_info "测试 docker 命令..."
    if ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "docker --version" > /dev/null 2>&1; then
        print_success "docker 命令可用"
    else
        print_warning "docker 命令不可用（可能未安装）"
    fi
    
    print_info "测试 docker-compose 命令..."
    if ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "docker-compose --version || docker compose version" > /dev/null 2>&1; then
        print_success "docker-compose 命令可用"
    else
        print_warning "docker-compose 命令不可用"
    fi
    
    return 0
}

# 测试长时间运行的命令
test_long_running_command() {
    print_step "测试长时间运行的命令（模拟 Docker 构建）"
    
    print_info "执行一个 30 秒的测试命令..."
    print_warning "这用于测试 SSH 连接是否会在长时间运行时断开"
    
    if timeout 35 ssh -i ${SSH_KEY} -o ServerAliveInterval=60 -o ServerAliveCountMax=3 ${SERVER_USER}@${SERVER_HOST} "
        echo '开始长时间运行测试...'
        for i in {1..30}; do
            echo \"进度: \$i/30\"
            sleep 1
        done
        echo '长时间运行测试完成'
    " 2>&1; then
        print_success "长时间运行命令测试成功"
        return 0
    else
        print_error "长时间运行命令测试失败"
        return 1
    fi
}

# 测试部署脚本（不实际部署）
test_deploy_script() {
    print_step "测试部署脚本（只检查，不实际部署）"
    
    print_info "检查项目目录是否存在..."
    if ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "[ -d /opt/canary ]" 2>/dev/null; then
        print_success "项目目录存在: /opt/canary"
    else
        print_warning "项目目录不存在: /opt/canary"
    fi
    
    print_info "检查环境变量文件..."
    if ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "[ -f /opt/canary/.env.clean ]" 2>/dev/null; then
        print_success "环境变量文件存在: .env.clean"
    else
        print_warning "环境变量文件不存在: .env.clean"
    fi
    
    print_info "检查 docker-compose 文件..."
    if ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "[ -f /opt/canary/docker-compose.prod.yml ]" 2>/dev/null; then
        print_success "docker-compose 文件存在"
    else
        print_warning "docker-compose 文件不存在"
    fi
    
    print_info "检查当前运行的容器..."
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST} "cd /opt/canary && docker-compose -f docker-compose.prod.yml ps 2>/dev/null || docker compose -f docker-compose.prod.yml ps 2>/dev/null || echo '无法检查容器状态'" 2>&1 | head -10
    
    return 0
}

# 执行完整的部署脚本测试（模拟 GitHub Actions）
test_full_deploy_script() {
    print_step "执行完整部署脚本测试（模拟 GitHub Actions）"
    
    print_warning "这将执行实际的部署脚本，但会先检查所有前置条件"
    
    # 检查部署包是否存在
    if [ ! -f "deploy.tar.gz" ]; then
        print_warning "部署包 deploy.tar.gz 不存在"
        print_info "是否要创建部署包？(y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "创建部署包..."
            # 这里可以调用构建脚本，但为了测试，我们跳过
            print_warning "请先运行 GitHub Actions 构建步骤或手动创建 deploy.tar.gz"
            return 1
        else
            print_info "跳过部署包创建，使用现有的（如果存在）"
        fi
    fi
    
    # 上传部署包
    if [ -f "deploy.tar.gz" ]; then
        print_info "上传部署包到服务器..."
        if scp -i ${SSH_KEY} deploy.tar.gz ${SERVER_USER}@${SERVER_HOST}:/tmp/ 2>&1; then
            print_success "部署包上传成功"
        else
            print_error "部署包上传失败"
            return 1
        fi
    else
        print_warning "跳过上传（deploy.tar.gz 不存在）"
    fi
    
    # 执行部署脚本（只执行到 Docker 构建之前）
    print_info "执行部署脚本（测试模式，不实际构建）..."
    
    ssh -i ${SSH_KEY} -o ServerAliveInterval=60 -o ServerAliveCountMax=3 ${SERVER_USER}@${SERVER_HOST} bash << 'ENDSSH'
set -e

echo "🚀 Starting deployment process (TEST MODE)..."

# 进入项目目录
cd /opt/canary
echo "📁 Changed to project directory: $(pwd)"

# 检查环境变量文件
if [ ! -f ".env.clean" ]; then
    echo "❌ .env.clean file not found!"
    exit 1
fi
echo "✅ Environment file exists"

# 检查部署包
if [ ! -f "/tmp/deploy.tar.gz" ]; then
    echo "⚠️  Deploy package not found, skipping extraction"
else
    echo "📦 Deploy package found"
    # 不实际解压，只检查
    echo "✅ Would extract deploy.tar.gz here"
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found!"
    exit 1
fi
echo "✅ Docker is available"

# 测试 Docker 构建命令（不实际构建）
echo "🔨 Would build Docker images here"
echo "✅ Deployment script structure is valid"

echo "✅ Test deployment script completed successfully!"
ENDSSH

    if [ $? -eq 0 ]; then
        print_success "部署脚本测试成功"
        return 0
    else
        print_error "部署脚本测试失败"
        return 1
    fi
}

# 主程序
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${GREEN}🧪 GitHub Actions 部署测试脚本${NC}                  ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}  ${YELLOW}目标服务器: ${SERVER_USER}@${SERVER_HOST}${NC}        ${BLUE}║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # 检查 SSH 密钥
    SSH_KEY_EXPANDED="${SSH_KEY/#\~/$HOME}"
    if [ ! -f "${SSH_KEY_EXPANDED}" ]; then
        print_error "SSH 密钥不存在: ${SSH_KEY_EXPANDED}"
        print_info "请设置 SSH_KEY 环境变量或确保密钥文件存在"
        exit 1
    fi
    SSH_KEY="${SSH_KEY_EXPANDED}"
    print_success "SSH 密钥已找到: ${SSH_KEY}"
    
    # 执行测试
    FAILED=0
    
    if ! test_ssh_connection; then
        FAILED=1
    fi
    
    if [ $FAILED -eq 0 ] && ! test_basic_commands; then
        FAILED=1
    fi
    
    if [ $FAILED -eq 0 ] && ! test_long_running_command; then
        FAILED=1
    fi
    
    if [ $FAILED -eq 0 ] && ! test_deploy_script; then
        FAILED=1
    fi
    
    # 询问是否执行完整测试
    echo ""
    print_info "是否要执行完整的部署脚本测试？(y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if ! test_full_deploy_script; then
            FAILED=1
        fi
    fi
    
    # 总结
    echo ""
    if [ $FAILED -eq 0 ]; then
        print_success "所有测试通过！SSH 连接正常，可以执行部署。"
    else
        print_error "部分测试失败，请检查上述错误信息。"
        exit 1
    fi
}

# 运行主程序
main
