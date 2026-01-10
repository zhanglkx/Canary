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

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
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

SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

print_info "连接到服务器 ${SERVER_USER}@${SERVER_HOST} 修复 Docker 代理配置..."

ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} bash << 'ENDSSH'
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
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

echo "=========================================="
echo "🔧 修复 Docker 代理配置"
echo "=========================================="
echo ""

# 检查代理配置文件
PROXY_CONF="/etc/systemd/system/docker.service.d/proxy.conf"

if [ -f "$PROXY_CONF" ]; then
    print_info "发现代理配置文件: $PROXY_CONF"
    echo ""
    print_info "当前代理配置内容："
    cat "$PROXY_CONF"
    echo ""
    
    # 检查配置是否有问题
    if grep -q "Environment.*http" "$PROXY_CONF" && ! grep -q "http://" "$PROXY_CONF" && ! grep -q "https://" "$PROXY_CONF"; then
        print_error "检测到代理配置格式错误（可能是 'http' 被当作主机名）"
        print_info "备份并移除错误的代理配置..."
        
        # 备份
        cp "$PROXY_CONF" "${PROXY_CONF}.bak.$(date +%Y%m%d_%H%M%S)"
        
        # 移除代理配置（因为镜像源已经配置，不需要代理）
        rm -f "$PROXY_CONF"
        print_success "已移除错误的代理配置"
    else
        # 检查是否真的需要代理
        print_info "检查代理配置是否必要..."
        
        # 如果镜像源已配置，通常不需要代理
        if [ -f /etc/docker/daemon.json ] && grep -q "registry-mirrors" /etc/docker/daemon.json; then
            print_warning "已配置镜像源，建议移除代理配置以避免冲突"
            # 自动移除代理配置（非交互式）
            REMOVE_PROXY="y"
            
            if [ "$REMOVE_PROXY" = "y" ] || [ "$REMOVE_PROXY" = "Y" ]; then
                cp "$PROXY_CONF" "${PROXY_CONF}.bak.$(date +%Y%m%d_%H%M%S)"
                rm -f "$PROXY_CONF"
                print_success "已移除代理配置"
            else
                print_info "保留代理配置"
            fi
        fi
    fi
else
    print_info "未找到代理配置文件，这是正常的"
fi

# 重新加载 systemd 配置
print_info "重新加载 systemd 配置..."
systemctl daemon-reload

# 重启 Docker 服务
print_info "重启 Docker 服务..."
if systemctl restart docker; then
    print_success "Docker 服务已重启"
else
    print_error "Docker 服务重启失败"
    exit 1
fi

# 等待服务启动
sleep 3

# 验证服务状态
if systemctl is-active --quiet docker; then
    print_success "Docker 服务运行正常"
else
    print_error "Docker 服务未正常运行"
    systemctl status docker --no-pager -l | head -10
    exit 1
fi

# 测试镜像拉取
echo ""
print_info "测试镜像拉取..."
if timeout 30 docker pull alpine:latest > /dev/null 2>&1; then
    print_success "镜像拉取成功！代理问题已修复"
    docker rmi alpine:latest > /dev/null 2>&1 || true
else
    print_warning "镜像拉取仍然失败，查看详细错误..."
    timeout 30 docker pull alpine:latest 2>&1 | head -20
fi

echo ""
print_success "修复完成！"

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    print_success "代理配置修复完成"
else
    print_error "修复过程中出现错误"
    exit 1
fi
