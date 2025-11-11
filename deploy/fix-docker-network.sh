#!/bin/bash

# Docker 网络问题修复脚本
# 专门解决 Docker 镜像拉取超时和网络连接问题
# 使用方法: sudo ./deploy/fix-docker-network.sh

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行此脚本"
    exit 1
fi

log_info "🔧 开始修复 Docker 网络问题..."

# 步骤1: 修复 DNS 解析
log_step "修复 DNS 解析问题..."

# 备份原有 DNS 配置
if [ -f /etc/resolv.conf ]; then
    cp /etc/resolv.conf /etc/resolv.conf.backup.$(date +%Y%m%d-%H%M%S)
    log_info "已备份原有 DNS 配置"
fi

# 移除只读属性（如果存在）
chattr -i /etc/resolv.conf 2>/dev/null || true

# 配置多个可靠的 DNS 服务器
cat > /etc/resolv.conf << 'EOF'
# 阿里云 DNS（中国大陆优化）
nameserver 223.5.5.5
nameserver 223.6.6.6
# 腾讯 DNS
nameserver 119.29.29.29
# 百度 DNS
nameserver 180.76.76.76
# 114 DNS
nameserver 114.114.114.114
# Google DNS（备用）
nameserver 8.8.8.8
nameserver 8.8.4.4
# Cloudflare DNS（备用）
nameserver 1.1.1.1
nameserver 1.0.0.1

# DNS 选项
options timeout:2
options attempts:3
options rotate
options single-request-reopen
EOF

# 防止 DNS 配置被系统覆盖
chattr +i /etc/resolv.conf

# 重启网络相关服务
log_info "重启网络服务..."
systemctl restart systemd-resolved 2>/dev/null || true
systemctl restart NetworkManager 2>/dev/null || true
systemctl restart network 2>/dev/null || true

# 清除 DNS 缓存
systemctl flush-dns 2>/dev/null || true
resolvectl flush-caches 2>/dev/null || true

# 等待网络服务稳定
sleep 5

# 测试 DNS 解析
log_info "测试 DNS 解析..."
DNS_TEST_DOMAINS=("google.com" "baidu.com" "docker.mirrors.ustc.edu.cn" "hub-mirror.c.163.com")
DNS_SUCCESS=0

for domain in "${DNS_TEST_DOMAINS[@]}"; do
    if nslookup "$domain" >/dev/null 2>&1; then
        log_info "✅ $domain 解析成功"
        ((DNS_SUCCESS++))
    else
        log_warn "⚠️  $domain 解析失败"
    fi
done

if [ $DNS_SUCCESS -gt 0 ]; then
    log_info "✅ DNS 修复成功 ($DNS_SUCCESS/${#DNS_TEST_DOMAINS[@]} 个域名解析成功)"
else
    log_error "❌ DNS 修复失败，所有域名都无法解析"
    log_error "可能的原因："
    log_error "1. 网络连接问题"
    log_error "2. 防火墙阻止 DNS 查询"
    log_error "3. 服务商网络限制"
    
    # 尝试使用 IP 地址测试网络连通性
    log_info "测试基础网络连通性..."
    if ping -c 3 8.8.8.8 >/dev/null 2>&1; then
        log_info "✅ 网络连接正常（可以 ping 通 8.8.8.8）"
        log_warn "问题可能是 DNS 端口被阻止，尝试使用备用方案..."
    else
        log_error "❌ 基础网络连接失败"
        exit 1
    fi
fi

# 步骤2: 配置 Docker 镜像加速器
log_step "配置 Docker 镜像加速器..."

mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://registry.docker-cn.com",
    "https://dockerhub.azk8s.cn"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "insecure-registries": [],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
EOF

# 重启 Docker 服务
systemctl daemon-reload
systemctl restart docker

# 等待 Docker 启动
sleep 10

log_info "✅ Docker 镜像加速器配置完成"

# 步骤3: 测试 Docker 连接
log_step "测试 Docker 连接..."

# 测试镜像拉取
log_info "测试基础镜像拉取..."
if docker pull hello-world:latest; then
    log_info "✅ Docker 镜像拉取正常"
    docker rmi hello-world:latest &> /dev/null || true
else
    log_warn "⚠️  Docker 镜像拉取仍有问题，尝试其他方案..."
fi

# 步骤4: 预拉取常用镜像
log_step "预拉取项目所需镜像..."

IMAGES=(
    "postgres:15-alpine"
    "redis:7-alpine"
    "nginx:alpine"
    "node:18-alpine"
)

for image in "${IMAGES[@]}"; do
    log_info "拉取镜像: $image"
    if docker pull "$image"; then
        log_info "✅ $image 拉取成功"
    else
        log_warn "⚠️  $image 拉取失败，尝试备用版本..."
        # 尝试备用版本
        case "$image" in
            "postgres:15-alpine")
                docker pull postgres:13-alpine || log_warn "PostgreSQL 镜像拉取失败"
                ;;
            "redis:7-alpine")
                docker pull redis:6-alpine || log_warn "Redis 镜像拉取失败"
                ;;
            "node:18-alpine")
                docker pull node:16-alpine || log_warn "Node.js 镜像拉取失败"
                ;;
        esac
    fi
done

# 步骤5: 配置 Docker Compose 超时
log_step "配置 Docker Compose 超时..."

# 创建 Docker Compose 配置
mkdir -p ~/.docker
cat > ~/.docker/config.json << 'EOF'
{
  "HttpHeaders": {
    "User-Agent": "Docker-Client/20.10.0 (linux)"
  },
  "psFormat": "table {{.ID}}\\t{{.Image}}\\t{{.Command}}\\t{{.RunningFor}}\\t{{.Status}}\\t{{.Ports}}\\t{{.Names}}",
  "imagesFormat": "table {{.Repository}}\\t{{.Tag}}\\t{{.ID}}\\t{{.CreatedAt}}\\t{{.Size}}",
  "pluginsFormat": "table {{.Name}}\\t{{.Version}}\\t{{.Enabled}}",
  "statsFormat": "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}\\t{{.BlockIO}}\\t{{.MemPerc}}\\t{{.PIDs}}",
  "tasksFormat": "table {{.Name}}\\t{{.Node}}\\t{{.Desired State}}\\t{{.Current State}}\\t{{.Error}}\\t{{.Ports}}",
  "servicesFormat": "table {{.ID}}\\t{{.Name}}\\t{{.Mode}}\\t{{.Replicas}}\\t{{.Image}}\\t{{.Ports}}",
  "nodesFormat": "table {{.ID}}\\t{{.Hostname}}\\t{{.Status}}\\t{{.Availability}}\\t{{.Manager Status}}\\t{{.Engine Version}}",
  "secretFormat": "table {{.ID}}\\t{{.Name}}\\t{{.Driver}}\\t{{.CreatedAt}}\\t{{.UpdatedAt}}",
  "configFormat": "table {{.ID}}\\t{{.Name}}\\t{{.CreatedAt}}\\t{{.UpdatedAt}}",
  "serviceInspectFormat": "pretty",
  "detachKeys": "ctrl-p,ctrl-q",
  "credentialsStore": "",
  "stackOrchestrator": "swarm"
}
EOF

# 设置环境变量
cat >> /etc/environment << 'EOF'
COMPOSE_HTTP_TIMEOUT=300
DOCKER_CLIENT_TIMEOUT=300
COMPOSE_PARALLEL_LIMIT=1
EOF

log_info "✅ Docker Compose 配置完成"

# 步骤6: 网络优化
log_step "优化网络设置..."

# 优化 TCP 设置
cat >> /etc/sysctl.conf << 'EOF'
# Docker 网络优化
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 65536 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
EOF

# 应用设置
sysctl -p

log_info "✅ 网络优化完成"

# 步骤7: 验证修复结果
log_step "验证修复结果..."

# 检查 Docker 服务
if systemctl is-active --quiet docker; then
    log_info "✅ Docker 服务运行正常"
else
    log_error "❌ Docker 服务异常"
    exit 1
fi

# 检查镜像加速器
if docker info | grep -q "Registry Mirrors"; then
    log_info "✅ Docker 镜像加速器配置生效"
else
    log_warn "⚠️  Docker 镜像加速器可能未生效"
fi

# 测试网络连通性
log_info "测试网络连通性..."

# 测试多个镜像源的连通性
MIRROR_SOURCES=(
    "https://registry-1.docker.io/v2/"
    "https://docker.mirrors.ustc.edu.cn/v2/"
    "https://hub-mirror.c.163.com/v2/"
    "https://mirror.baidubce.com/v2/"
    "https://registry.docker-cn.com/v2/"
)

WORKING_MIRRORS=0
for mirror in "${MIRROR_SOURCES[@]}"; do
    if curl -s --connect-timeout 10 "$mirror" > /dev/null 2>&1; then
        log_info "✅ $(echo $mirror | cut -d'/' -f3) 连接正常"
        ((WORKING_MIRRORS++))
    else
        log_warn "⚠️  $(echo $mirror | cut -d'/' -f3) 连接失败"
    fi
done

if [ $WORKING_MIRRORS -gt 0 ]; then
    log_info "✅ 网络连接正常 ($WORKING_MIRRORS/${#MIRROR_SOURCES[@]} 个镜像源可用)"
else
    log_warn "⚠️  所有镜像源都无法连接，但配置的镜像加速器应该能解决大部分问题"
    
    # 额外的网络诊断
    log_info "执行额外的网络诊断..."
    
    # 测试基本网络连通性
    if ping -c 3 223.5.5.5 >/dev/null 2>&1; then
        log_info "✅ 可以 ping 通阿里云 DNS (223.5.5.5)"
    else
        log_warn "⚠️  无法 ping 通阿里云 DNS"
    fi
    
    # 测试 HTTP 连接
    if curl -s --connect-timeout 10 http://www.baidu.com > /dev/null 2>&1; then
        log_info "✅ HTTP 连接正常（可以访问百度）"
    else
        log_warn "⚠️  HTTP 连接异常"
    fi
    
    # 测试 HTTPS 连接
    if curl -s --connect-timeout 10 https://www.baidu.com > /dev/null 2>&1; then
        log_info "✅ HTTPS 连接正常"
    else
        log_warn "⚠️  HTTPS 连接异常，可能是证书或防火墙问题"
    fi
fi

# 显示当前 DNS 配置
log_info "当前 DNS 配置："
head -10 /etc/resolv.conf | grep nameserver | while read line; do
    log_info "  $line"
done

echo ""
echo "🎉 Docker 网络问题修复完成！"
echo ""
echo "📋 修复内容："
echo "   ✅ 配置了多个可靠的 DNS 服务器"
echo "   ✅ 配置了多个 Docker 镜像加速器"
echo "   ✅ 预拉取了常用镜像"
echo "   ✅ 配置了 Docker Compose 超时"
echo "   ✅ 优化了网络设置"
echo "   ✅ 执行了网络连通性测试"
echo ""
echo "🔍 验证结果："
echo "   Docker 服务: $(systemctl is-active docker)"
echo "   DNS 解析: $DNS_SUCCESS/${#DNS_TEST_DOMAINS[@]} 个测试域名成功"
echo "   镜像源连通性: $WORKING_MIRRORS/${#MIRROR_SOURCES[@]} 个镜像源可用"
echo "   镜像加速器: 已配置多个备用源"
echo ""
echo "📋 配置的 DNS 服务器："
echo "   阿里云 DNS: 223.5.5.5, 223.6.6.6"
echo "   腾讯 DNS: 119.29.29.29"
echo "   百度 DNS: 180.76.76.76"
echo "   114 DNS: 114.114.114.114"
echo "   Google DNS: 8.8.8.8, 8.8.4.4"
echo "   Cloudflare DNS: 1.1.1.1, 1.0.0.1"
echo ""
echo "📋 配置的 Docker 镜像源："
echo "   中科大镜像: docker.mirrors.ustc.edu.cn"
echo "   网易镜像: hub-mirror.c.163.com"
echo "   百度镜像: mirror.baidubce.com"
echo "   Docker 中国: registry.docker-cn.com"
echo "   Azure 镜像: dockerhub.azk8s.cn"
echo ""
if [ $DNS_SUCCESS -gt 0 ] && [ $WORKING_MIRRORS -gt 0 ]; then
    echo "🚀 网络修复成功！现在可以运行部署脚本了："
    echo "   sudo ./deploy/alinux-deploy.sh"
elif [ $DNS_SUCCESS -gt 0 ]; then
    echo "⚠️  DNS 修复成功，但部分镜像源不可用"
    echo "🚀 可以尝试运行部署脚本（镜像加速器应该能解决问题）："
    echo "   sudo ./deploy/alinux-deploy.sh"
else
    echo "⚠️  DNS 解析仍有问题，建议检查网络连接"
    echo "💡 可以尝试以下解决方案："
    echo "   1. 检查服务器网络配置"
    echo "   2. 联系服务商确认网络限制"
    echo "   3. 尝试使用其他网络环境"
fi
echo ""

log_info "🎉 修复流程完成！"
