#!/bin/bash

# Podman 问题修复脚本
# 专门解决 Alibaba Cloud Linux 3 上 podman 和 Docker 的冲突问题
# 使用方法: sudo ./deploy/fix-podman.sh

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

log_info "🔧 开始修复 podman 和 Docker 冲突问题..."

# 步骤1: 检查当前状态
log_step "检查当前容器运行时状态..."

if command -v podman &> /dev/null; then
    log_info "检测到 podman: $(podman --version)"
    PODMAN_INSTALLED=true
else
    PODMAN_INSTALLED=false
fi

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version 2>/dev/null)
    log_info "检测到 docker 命令: $DOCKER_VERSION"
    
    if echo "$DOCKER_VERSION" | grep -q "podman"; then
        log_warn "docker 命令实际指向 podman"
        DOCKER_IS_PODMAN=true
        REAL_DOCKER=false
    else
        log_info "检测到真正的 Docker"
        DOCKER_IS_PODMAN=false
        REAL_DOCKER=true
    fi
else
    DOCKER_IS_PODMAN=false
    REAL_DOCKER=false
fi

# 步骤2: 移除 podman 并安装真正的 Docker
if [ "$PODMAN_INSTALLED" = true ] || [ "$DOCKER_IS_PODMAN" = true ]; then
    log_step "移除 podman 并安装真正的 Docker..."
    
    # 停止 podman 服务
    systemctl stop podman 2>/dev/null || true
    systemctl disable podman 2>/dev/null || true
    
    # 移除 podman 相关包
    log_info "移除 podman 相关包..."
    yum remove -y podman podman-docker buildah skopeo 2>/dev/null || true
    
    # 移除 podman 的 docker 别名
    rm -f /usr/bin/docker 2>/dev/null || true
    rm -f /etc/containers/nodocker 2>/dev/null || true
    
    # 清理 podman 配置
    rm -rf /etc/containers/ 2>/dev/null || true
    rm -rf ~/.config/containers/ 2>/dev/null || true
    
    log_info "✅ podman 清理完成"
fi

# 步骤3: 安装真正的 Docker
if [ "$REAL_DOCKER" = false ]; then
    log_step "安装真正的 Docker..."
    
    # 方法1: 使用阿里云镜像源
    log_info "使用阿里云镜像源安装 Docker..."
    
    # 安装必要工具
    yum install -y yum-utils device-mapper-persistent-data lvm2
    
    # 添加 Docker 官方源
    if curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -o /etc/yum.repos.d/docker-ce.repo; then
        log_info "✅ 添加阿里云 Docker 源成功"
    else
        log_warn "阿里云源添加失败，使用官方源..."
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    fi
    
    # 安装 Docker
    log_info "安装 Docker CE..."
    yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # 启动 Docker 服务
    systemctl enable docker
    systemctl start docker
    
    # 验证安装
    if docker --version &> /dev/null && systemctl is-active --quiet docker; then
        log_info "✅ Docker 安装成功: $(docker --version)"
    else
        log_error "Docker 安装失败"
        exit 1
    fi
    
else
    log_info "✅ 真正的 Docker 已安装"
fi

# 步骤4: 配置 Docker
log_step "配置 Docker..."

# 配置镜像加速器
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://registry.docker-cn.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# 重启 Docker 服务
systemctl daemon-reload
systemctl restart docker

log_info "✅ Docker 镜像加速器配置完成"

# 步骤5: 安装 Docker Compose
log_step "安装 Docker Compose..."

if ! command -v docker-compose &> /dev/null; then
    # 检查是否已通过插件安装
    if docker compose version &> /dev/null; then
        log_info "Docker Compose 插件已安装，创建兼容性链接..."
        cat > /usr/local/bin/docker-compose << 'EOF'
#!/bin/bash
docker compose "$@"
EOF
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    else
        # 下载二进制文件
        log_info "下载 Docker Compose 二进制文件..."
        COMPOSE_VERSION="v2.23.0"
        curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
    
    log_info "✅ Docker Compose 安装完成: $(docker-compose --version)"
else
    log_info "✅ Docker Compose 已安装: $(docker-compose --version)"
fi

# 步骤6: 测试 Docker
log_step "测试 Docker 功能..."

# 测试 Docker 命令
if docker --version &> /dev/null; then
    log_info "✅ Docker 命令正常"
else
    log_error "❌ Docker 命令测试失败"
    exit 1
fi

# 测试 Docker 服务
if systemctl is-active --quiet docker; then
    log_info "✅ Docker 服务运行正常"
else
    log_error "❌ Docker 服务未运行"
    exit 1
fi

# 测试 Docker Compose
if docker-compose --version &> /dev/null; then
    log_info "✅ Docker Compose 正常"
else
    log_error "❌ Docker Compose 测试失败"
    exit 1
fi

# 测试拉取镜像（可选）
log_info "测试 Docker 镜像拉取..."
if docker pull hello-world &> /dev/null; then
    log_info "✅ Docker 镜像拉取正常"
    docker rmi hello-world &> /dev/null || true
else
    log_warn "⚠️  Docker 镜像拉取测试失败，但不影响基本功能"
fi

echo ""
echo "🎉 podman 问题修复完成！"
echo ""
echo "📋 修复内容："
echo "   ✅ 移除了 podman 和相关包"
echo "   ✅ 安装了真正的 Docker CE"
echo "   ✅ 配置了 Docker 镜像加速器"
echo "   ✅ 安装了 Docker Compose"
echo "   ✅ 启动了 Docker 服务"
echo ""
echo "🔍 验证结果："
echo "   Docker 版本: $(docker --version)"
echo "   Docker Compose 版本: $(docker-compose --version)"
echo "   Docker 服务状态: $(systemctl is-active docker)"
echo ""
echo "🚀 现在可以运行部署脚本了："
echo "   sudo ./deploy/alinux-deploy.sh"
echo ""

log_info "🎉 修复流程完成！"
