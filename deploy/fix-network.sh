#!/bin/bash

# 网络连接问题修复脚本
# 专门解决中国大陆访问国外源的问题
# 使用方法: sudo ./deploy/fix-network.sh

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

log_info "🔧 开始修复网络连接问题..."

# 步骤1: 更新 DNS 配置
log_step "配置 DNS..."
cat > /etc/resolv.conf << 'EOF'
nameserver 223.5.5.5
nameserver 223.6.6.6
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF

log_info "✅ DNS 配置完成"

# 步骤2: 配置阿里云镜像源
log_step "配置阿里云镜像源..."

# 备份原有源
cp /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup 2>/dev/null || true

# 配置阿里云源
cat > /etc/yum.repos.d/CentOS-Base.repo << 'EOF'
[base]
name=CentOS-$releasever - Base - mirrors.aliyun.com
failovermethod=priority
baseurl=https://mirrors.aliyun.com/centos/$releasever/os/$basearch/
        http://mirrors.aliyuncs.com/centos/$releasever/os/$basearch/
        http://mirrors.cloud.aliyuncs.com/centos/$releasever/os/$basearch/
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/centos/RPM-GPG-KEY-CentOS-7

[updates]
name=CentOS-$releasever - Updates - mirrors.aliyun.com
failovermethod=priority
baseurl=https://mirrors.aliyun.com/centos/$releasever/updates/$basearch/
        http://mirrors.aliyuncs.com/centos/$releasever/updates/$basearch/
        http://mirrors.cloud.aliyuncs.com/centos/$releasever/updates/$basearch/
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/centos/RPM-GPG-KEY-CentOS-7

[extras]
name=CentOS-$releasever - Extras - mirrors.aliyun.com
failovermethod=priority
baseurl=https://mirrors.aliyun.com/centos/$releasever/extras/$basearch/
        http://mirrors.aliyuncs.com/centos/$releasever/extras/$basearch/
        http://mirrors.cloud.aliyuncs.com/centos/$releasever/extras/$basearch/
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/centos/RPM-GPG-KEY-CentOS-7
EOF

# 清理缓存并更新
yum clean all
yum makecache

log_info "✅ 阿里云镜像源配置完成"

# 步骤3: 手动安装 Docker（使用阿里云源）
log_step "使用阿里云源安装 Docker..."

if ! command -v docker &> /dev/null; then
    # 安装必要工具
    yum install -y yum-utils device-mapper-persistent-data lvm2
    
    # 添加阿里云 Docker 源
    yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    
    # 安装 Docker
    yum install -y docker-ce docker-ce-cli containerd.io
    
    # 启动 Docker
    systemctl enable docker
    systemctl start docker
    
    # 配置 Docker 镜像加速器
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
  }
}
EOF
    
    systemctl daemon-reload
    systemctl restart docker
    
    log_info "✅ Docker 安装完成"
else
    log_info "Docker 已安装，配置镜像加速器..."
    
    # 配置 Docker 镜像加速器
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
  }
}
EOF
    
    systemctl daemon-reload
    systemctl restart docker
    
    log_info "✅ Docker 镜像加速器配置完成"
fi

# 步骤4: 安装 Docker Compose
log_step "安装 Docker Compose..."

if ! command -v docker-compose &> /dev/null; then
    # 方法1: 使用 pip 安装（最稳定）
    log_info "使用 pip 安装 Docker Compose..."
    yum install -y python3-pip
    pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple docker-compose
    
    if ! command -v docker-compose &> /dev/null; then
        # 方法2: 手动下载二进制文件
        log_info "下载 Docker Compose 二进制文件..."
        COMPOSE_VERSION="2.23.0"
        curl -L "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
    
    log_info "✅ Docker Compose 安装完成"
else
    log_info "Docker Compose 已安装"
fi

# 步骤5: 安装 Node.js
log_step "安装 Node.js..."

if ! command -v node &> /dev/null; then
    # 使用 EPEL 源安装
    yum install -y epel-release
    yum install -y nodejs npm
    
    # 检查版本，如果太低则手动安装
    NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 2>/dev/null || echo "0")
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_info "Node.js 版本过低，安装最新版本..."
        
        # 下载 Node.js 二进制包
        cd /tmp
        wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
        tar -xf node-v18.19.0-linux-x64.tar.xz
        
        # 安装到系统目录
        cp -r node-v18.19.0-linux-x64/{bin,lib,share,include} /usr/local/
        ln -sf /usr/local/bin/node /usr/bin/node
        ln -sf /usr/local/bin/npm /usr/bin/npm
        ln -sf /usr/local/bin/npx /usr/bin/npx
        
        # 清理
        rm -rf /tmp/node-v18.19.0-linux-x64*
    fi
    
    log_info "✅ Node.js 安装完成: $(node --version)"
else
    log_info "Node.js 已安装: $(node --version)"
fi

# 步骤6: 安装 pnpm
log_step "安装 pnpm..."

if ! command -v pnpm &> /dev/null; then
    # 配置 npm 镜像源
    npm config set registry https://registry.npmmirror.com
    npm install -g pnpm
    
    log_info "✅ pnpm 安装完成: $(pnpm --version)"
else
    log_info "pnpm 已安装: $(pnpm --version)"
fi

# 步骤7: 测试网络连接
log_step "测试网络连接..."

# 测试 Docker
if docker --version &> /dev/null; then
    log_info "✅ Docker 工作正常"
else
    log_error "❌ Docker 测试失败"
fi

# 测试 Docker Compose
if docker-compose --version &> /dev/null; then
    log_info "✅ Docker Compose 工作正常"
else
    log_error "❌ Docker Compose 测试失败"
fi

# 测试 Node.js
if node --version &> /dev/null; then
    log_info "✅ Node.js 工作正常"
else
    log_error "❌ Node.js 测试失败"
fi

# 测试 pnpm
if pnpm --version &> /dev/null; then
    log_info "✅ pnpm 工作正常"
else
    log_error "❌ pnpm 测试失败"
fi

echo ""
echo "🎉 网络问题修复完成！"
echo ""
echo "📋 已完成的配置："
echo "   ✅ DNS 配置（使用阿里云和谷歌 DNS）"
echo "   ✅ 阿里云镜像源配置"
echo "   ✅ Docker 安装和镜像加速器配置"
echo "   ✅ Docker Compose 安装"
echo "   ✅ Node.js 和 pnpm 安装"
echo ""
echo "🚀 现在可以运行部署脚本了："
echo "   sudo ./deploy/alinux-deploy.sh"
echo ""

log_info "🎉 修复流程完成！"
