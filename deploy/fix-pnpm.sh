#!/bin/bash

# pnpm PATH 问题修复脚本
# 使用方法: sudo ./deploy/fix-pnpm.sh

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

log_info "🔧 开始修复 pnpm PATH 问题..."

# 步骤1: 检查当前状态
log_step "检查当前 pnpm 状态..."

log_info "当前 PATH: $PATH"
log_info "Node.js 版本: $(node --version 2>/dev/null || echo '未安装')"
log_info "npm 版本: $(npm --version 2>/dev/null || echo '未安装')"

# 检查 pnpm 是否可用
if command -v pnpm &> /dev/null; then
    log_info "✅ pnpm 命令可用: $(pnpm --version)"
    PNPM_WORKING=true
else
    log_warn "❌ pnpm 命令不可用"
    PNPM_WORKING=false
fi

# 步骤2: 查找 pnpm 文件
log_step "查找 pnpm 安装位置..."

PNPM_LOCATIONS=(
    "/usr/local/bin/pnpm"
    "/usr/bin/pnpm"
    "$(npm root -g 2>/dev/null)/pnpm/bin/pnpm.js"
    "/usr/local/lib/node_modules/pnpm/bin/pnpm.js"
    "/usr/lib/node_modules/pnpm/bin/pnpm.js"
    "$(which pnpm 2>/dev/null)"
)

FOUND_PNPM=""
for location in "${PNPM_LOCATIONS[@]}"; do
    if [ -n "$location" ] && [ -f "$location" ]; then
        log_info "找到 pnpm 文件: $location"
        FOUND_PNPM="$location"
        break
    fi
done

# 步骤3: 修复 pnpm
if [ "$PNPM_WORKING" = false ]; then
    log_step "修复 pnpm..."
    
    if [ -n "$FOUND_PNPM" ]; then
        log_info "使用现有的 pnpm 文件创建符号链接..."
        
        # 创建符号链接
        ln -sf "$FOUND_PNPM" /usr/local/bin/pnpm
        ln -sf "$FOUND_PNPM" /usr/bin/pnpm
        
        # 设置执行权限
        chmod +x /usr/local/bin/pnpm /usr/bin/pnpm
        
        # 刷新命令缓存
        hash -r
        
    else
        log_info "未找到现有 pnpm，重新安装..."
        
        # 配置 npm 镜像源
        npm config set registry https://registry.npmmirror.com
        
        # 重新安装 pnpm
        npm install -g pnpm
        
        # 查找新安装的 pnpm
        PNPM_GLOBAL_PATH=$(npm root -g)/pnpm/bin/pnpm.js
        if [ -f "$PNPM_GLOBAL_PATH" ]; then
            ln -sf "$PNPM_GLOBAL_PATH" /usr/local/bin/pnpm
            ln -sf "$PNPM_GLOBAL_PATH" /usr/bin/pnpm
            chmod +x /usr/local/bin/pnpm /usr/bin/pnpm
        fi
        
        # 刷新命令缓存
        hash -r
    fi
fi

# 步骤4: 验证修复结果
log_step "验证修复结果..."

# 更新 PATH
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
hash -r

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    log_info "✅ pnpm 修复成功: $PNPM_VERSION"
    
    # 测试 pnpm 基本功能
    if pnpm --help &> /dev/null; then
        log_info "✅ pnpm 功能正常"
    else
        log_warn "⚠️  pnpm 命令可用但功能异常"
    fi
else
    log_error "❌ pnpm 修复失败"
    exit 1
fi

# 步骤5: 创建永久性修复
log_step "创建永久性修复..."

# 添加到系统 PATH
if ! grep -q "/usr/local/bin" /etc/environment 2>/dev/null; then
    echo 'PATH="/usr/local/bin:/usr/bin:/bin:/sbin:/usr/sbin"' >> /etc/environment
    log_info "✅ 更新系统 PATH"
fi

# 创建 profile 脚本
cat > /etc/profile.d/pnpm.sh << 'EOF'
#!/bin/bash
# pnpm PATH 配置
export PATH="/usr/local/bin:$PATH"

# 确保 pnpm 可用
if [ -f "/usr/local/bin/pnpm" ] && [ ! -x "/usr/local/bin/pnpm" ]; then
    chmod +x /usr/local/bin/pnpm
fi
EOF

chmod +x /etc/profile.d/pnpm.sh

log_info "✅ 创建永久性配置"

echo ""
echo "🎉 pnpm PATH 问题修复完成！"
echo ""
echo "📋 修复内容："
echo "   ✅ 找到并修复了 pnpm 路径问题"
echo "   ✅ 创建了符号链接到标准位置"
echo "   ✅ 更新了系统 PATH 配置"
echo "   ✅ 创建了永久性配置文件"
echo ""
echo "🔍 验证结果："
echo "   pnpm 版本: $(pnpm --version)"
echo "   pnpm 位置: $(which pnpm)"
echo ""
echo "🚀 现在可以运行部署脚本了："
echo "   sudo ./deploy/alinux-deploy.sh"
echo ""

log_info "🎉 修复流程完成！"
