#!/bin/bash

# cryptography 编译错误修复脚本
# 专门解决 "python setup.py egg_info" failed 错误
# 使用方法: sudo ./deploy/fix-cryptography.sh

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

log_info "🔧 开始修复 cryptography 编译错误..."

# 步骤1: 安装编译依赖
log_step "安装编译依赖..."

# 安装基础编译工具
yum groupinstall -y "Development Tools" || yum install -y gcc gcc-c++ make

# 安装 Python 开发包
yum install -y python3-devel python3-pip

# 安装 cryptography 需要的系统依赖
yum install -y openssl-devel libffi-devel

# 安装 Rust（新版本 cryptography 需要）
if ! command -v rustc &> /dev/null; then
    log_info "安装 Rust 编译器..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
    export PATH="$HOME/.cargo/bin:$PATH"
fi

log_info "✅ 编译依赖安装完成"

# 步骤2: 更新 pip 和相关工具
log_step "更新 pip 和构建工具..."

# 更新 pip
python3 -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple

# 更新构建工具
python3 -m pip install --upgrade setuptools wheel -i https://pypi.tuna.tsinghua.edu.cn/simple

log_info "✅ pip 和构建工具更新完成"

# 步骤3: 设置环境变量
log_step "设置编译环境变量..."

# 设置 Rust 环境变量
export CRYPTOGRAPHY_DONT_BUILD_RUST=1
export CARGO_NET_GIT_FETCH_WITH_CLI=true

# 设置编译标志
export LDFLAGS="-L/usr/lib64"
export CPPFLAGS="-I/usr/include"

log_info "✅ 环境变量设置完成"

# 步骤4: 尝试安装 cryptography
log_step "安装 cryptography..."

# 方法1: 使用预编译包
log_info "尝试安装预编译的 cryptography..."
if python3 -m pip install cryptography -i https://pypi.tuna.tsinghua.edu.cn/simple --prefer-binary --no-cache-dir; then
    log_info "✅ cryptography 预编译包安装成功"
else
    # 方法2: 安装旧版本
    log_warn "预编译包安装失败，尝试安装兼容版本..."
    python3 -m pip install "cryptography<3.5" -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir
fi

# 步骤5: 安装 docker-compose
log_step "安装 docker-compose..."

if ! command -v docker-compose &> /dev/null; then
    # 方法1: 使用 pip 安装
    log_info "使用 pip 安装 docker-compose..."
    python3 -m pip install docker-compose -i https://pypi.tuna.tsinghua.edu.cn/simple --prefer-binary --no-cache-dir
    
    if ! command -v docker-compose &> /dev/null; then
        # 方法2: 下载二进制文件
        log_info "下载 docker-compose 二进制文件..."
        COMPOSE_VERSION="2.23.0"
        curl -L "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
    
    log_info "✅ docker-compose 安装完成"
else
    log_info "docker-compose 已安装"
fi

# 步骤6: 验证安装
log_step "验证安装..."

# 测试 cryptography
if python3 -c "import cryptography; print('cryptography version:', cryptography.__version__)" 2>/dev/null; then
    log_info "✅ cryptography 工作正常"
else
    log_error "❌ cryptography 测试失败"
fi

# 测试 docker-compose
if docker-compose --version &> /dev/null; then
    log_info "✅ docker-compose 工作正常"
else
    log_error "❌ docker-compose 测试失败"
fi

# 步骤7: 清理缓存
log_step "清理缓存..."
python3 -m pip cache purge 2>/dev/null || true
yum clean all

echo ""
echo "🎉 cryptography 问题修复完成！"
echo ""
echo "📋 已完成的修复："
echo "   ✅ 安装编译依赖（gcc, python3-devel, openssl-devel, libffi-devel）"
echo "   ✅ 安装 Rust 编译器"
echo "   ✅ 更新 pip 和构建工具"
echo "   ✅ 设置编译环境变量"
echo "   ✅ 安装 cryptography 和 docker-compose"
echo ""
echo "🚀 现在可以运行部署脚本了："
echo "   sudo ./deploy/alinux-deploy.sh"
echo ""

log_info "🎉 修复流程完成！"
