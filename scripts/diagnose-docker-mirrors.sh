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

print_info "连接到服务器 ${SERVER_USER}@${SERVER_HOST} 进行诊断..."

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
echo "🔍 Docker 镜像加速诊断"
echo "=========================================="
echo ""

# 1. 检查 Docker 服务状态
print_info "1. 检查 Docker 服务状态..."
if systemctl is-active --quiet docker; then
    print_success "Docker 服务正在运行"
    systemctl status docker --no-pager -l | head -5
else
    print_error "Docker 服务未运行"
    echo "尝试启动 Docker..."
    systemctl start docker
    sleep 2
    if systemctl is-active --quiet docker; then
        print_success "Docker 服务已启动"
    else
        print_error "Docker 服务启动失败"
        systemctl status docker --no-pager -l
        exit 1
    fi
fi
echo ""

# 2. 检查 daemon.json 配置
print_info "2. 检查 daemon.json 配置..."
if [ -f /etc/docker/daemon.json ]; then
    print_success "配置文件存在"
    echo "配置文件内容："
    cat /etc/docker/daemon.json | python3 -m json.tool 2>/dev/null || cat /etc/docker/daemon.json
    echo ""
    
    # 检查 JSON 格式
    if python3 -m json.tool /etc/docker/daemon.json > /dev/null 2>&1; then
        print_success "JSON 格式正确"
    else
        print_error "JSON 格式错误！"
        echo "这可能导致 Docker 无法读取配置"
    fi
    
    # 检查是否有 registry-mirrors
    if grep -q "registry-mirrors" /etc/docker/daemon.json; then
        print_success "已配置 registry-mirrors"
        MIRROR_COUNT=$(python3 -c "import json; f=open('/etc/docker/daemon.json'); d=json.load(f); print(len(d.get('registry-mirrors', [])))" 2>/dev/null || echo "0")
        echo "镜像源数量: $MIRROR_COUNT"
    else
        print_error "未找到 registry-mirrors 配置"
    fi
else
    print_error "配置文件不存在: /etc/docker/daemon.json"
    print_info "将创建默认配置..."
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.nju.edu.cn",
    "https://docker.mirrors.sjtug.sjtu.edu.cn"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
    print_success "已创建默认配置"
    systemctl daemon-reload
    systemctl restart docker
    sleep 3
fi
echo ""

# 3. 检查 Docker 实际使用的镜像源
print_info "3. 检查 Docker 实际使用的镜像源..."
echo "Docker info 中的 Registry Mirrors:"
if docker info 2>/dev/null | grep -A 20 "Registry Mirrors"; then
    print_success "镜像源已生效"
else
    print_error "无法获取镜像源信息或镜像源未生效"
    echo ""
    print_info "完整的 Docker info:"
    docker info 2>&1 | head -30
fi
echo ""

# 4. 测试网络连接
print_info "4. 测试镜像源网络连接..."
MIRRORS=(
    "https://docker.m.daocloud.io"
    "https://dockerproxy.com"
    "https://docker.nju.edu.cn"
    "https://docker.mirrors.sjtug.sjtu.edu.cn"
)

for mirror in "${MIRRORS[@]}"; do
    echo -n "测试 $mirror ... "
    if timeout 5 curl -s -o /dev/null -w "%{http_code}" "$mirror" > /dev/null 2>&1; then
        HTTP_CODE=$(timeout 5 curl -s -o /dev/null -w "%{http_code}" "$mirror" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "404" ]; then
            print_success "可访问 (HTTP $HTTP_CODE)"
        else
            print_warning "响应异常 (HTTP $HTTP_CODE)"
        fi
    else
        print_error "无法连接"
    fi
done
echo ""

# 5. 测试镜像拉取
print_info "5. 测试镜像拉取..."
echo "尝试拉取 alpine:latest (小镜像，用于测试)..."
echo ""

# 清理可能存在的测试镜像
docker rmi alpine:latest 2>/dev/null || true

# 尝试拉取并显示详细输出
if timeout 60 docker pull alpine:latest 2>&1 | tee /tmp/docker-pull.log; then
    print_success "镜像拉取成功！"
    docker rmi alpine:latest 2>/dev/null || true
else
    print_error "镜像拉取失败"
    echo ""
    print_info "拉取日志："
    cat /tmp/docker-pull.log 2>/dev/null || echo "无日志"
    echo ""
    
    # 检查常见错误
    if grep -q "timeout" /tmp/docker-pull.log 2>/dev/null; then
        print_error "检测到超时错误 - 可能是网络问题"
    fi
    if grep -q "connection refused" /tmp/docker-pull.log 2>/dev/null; then
        print_error "检测到连接拒绝 - 可能是镜像源不可用"
    fi
    if grep -q "unauthorized" /tmp/docker-pull.log 2>/dev/null; then
        print_error "检测到认证错误 - 可能需要登录"
    fi
    if grep -q "TLS handshake" /tmp/docker-pull.log 2>/dev/null; then
        print_error "检测到 TLS 握手错误 - 可能是证书问题"
    fi
fi
echo ""

# 6. 检查 Docker 日志
print_info "6. 检查 Docker 服务日志（最近 20 行）..."
if journalctl -u docker --no-pager -n 20 2>/dev/null | tail -20; then
    echo ""
else
    print_warning "无法获取 Docker 日志"
fi
echo ""

# 7. 检查 DNS 解析
print_info "7. 检查 DNS 解析..."
for mirror in "${MIRRORS[@]}"; do
    DOMAIN=$(echo "$mirror" | sed 's|https\?://||' | sed 's|/.*||')
    echo -n "解析 $DOMAIN ... "
    if nslookup "$DOMAIN" > /dev/null 2>&1 || host "$DOMAIN" > /dev/null 2>&1; then
        print_success "DNS 解析正常"
    else
        print_error "DNS 解析失败"
    fi
done
echo ""

# 8. 检查防火墙和网络
print_info "8. 检查网络连接..."
if ping -c 2 8.8.8.8 > /dev/null 2>&1; then
    print_success "外网连接正常"
else
    print_error "外网连接失败"
fi

# 9. 总结和建议
echo ""
echo "=========================================="
echo "📋 诊断总结"
echo "=========================================="
echo ""

# 检查配置是否生效
if docker info 2>/dev/null | grep -q "Registry Mirrors"; then
    print_success "镜像源配置已生效"
else
    print_error "镜像源配置未生效"
    echo ""
    print_info "建议操作："
    echo "1. 检查 /etc/docker/daemon.json 格式是否正确"
    echo "2. 重启 Docker 服务: systemctl restart docker"
    echo "3. 检查 Docker 日志: journalctl -u docker -f"
fi

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    print_success "诊断完成"
else
    print_error "诊断过程中出现错误"
    exit 1
fi
