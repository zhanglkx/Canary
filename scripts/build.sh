#!/bin/bash

# 项目构建脚本
# 使用方法: ./scripts/build.sh [--prod|--dev]

set -e

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

# 检查环境
check_environment() {
    log_step "检查构建环境..."
    
    # 检查 Node.js 版本
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js 版本需要 >= 20，当前版本: $(node --version)"
        exit 1
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请运行: npm install -g pnpm"
        exit 1
    fi
    
    PNPM_VERSION=$(pnpm --version | cut -d'.' -f1)
    if [ "$PNPM_VERSION" -lt 9 ]; then
        log_error "pnpm 版本需要 >= 9，当前版本: $(pnpm --version)"
        exit 1
    fi
    
    log_info "✅ 环境检查通过"
    log_info "Node.js: $(node --version)"
    log_info "pnpm: $(pnpm --version)"
}

# 清理构建产物
clean_build() {
    log_step "清理构建产物..."
    
    # 清理 API 构建产物
    if [ -d "apps/api/dist" ]; then
        rm -rf apps/api/dist
        log_info "清理 API dist 目录"
    fi
    
    if [ -f "apps/api/tsconfig.tsbuildinfo" ]; then
        rm -f apps/api/tsconfig.tsbuildinfo
        log_info "清理 API tsconfig.tsbuildinfo"
    fi
    
    # 清理 Web 构建产物
    if [ -d "apps/web/.next" ]; then
        rm -rf apps/web/.next
        log_info "清理 Web .next 目录"
    fi
    
    # 清理共享库构建产物
    if [ -d "libs/shared/dist" ]; then
        rm -rf libs/shared/dist
        log_info "清理 shared dist 目录"
    fi
    
    if [ -f "libs/shared/tsconfig.tsbuildinfo" ]; then
        rm -f libs/shared/tsconfig.tsbuildinfo
        log_info "清理 shared tsconfig.tsbuildinfo"
    fi
    
    log_info "✅ 清理完成"
}

# 安装依赖
install_dependencies() {
    log_step "安装项目依赖..."
    
    # 检查 pnpm-lock.yaml 是否存在
    if [ ! -f "pnpm-lock.yaml" ]; then
        log_warn "pnpm-lock.yaml 不存在，将生成新的锁文件"
        pnpm install
    else
        pnpm install --frozen-lockfile
    fi
    
    log_info "✅ 依赖安装完成"
}

# 构建共享库
build_shared() {
    log_step "构建共享库..."
    
    cd libs/shared
    pnpm build
    cd ../..
    
    log_info "✅ 共享库构建完成"
}

# 构建 API
build_api() {
    log_step "构建 API 服务..."
    
    cd apps/api
    
    # 运行 linting
    log_info "运行 API 代码检查..."
    pnpm lint
    
    # 构建
    log_info "构建 API..."
    pnpm build
    
    cd ../..
    
    log_info "✅ API 构建完成"
}

# 构建 Web
build_web() {
    log_step "构建 Web 应用..."
    
    cd apps/web
    
    # 运行 linting
    log_info "运行 Web 代码检查..."
    pnpm lint
    
    # 构建完成
    log_info "Web 应用构建完成"
    
    # 构建
    log_info "构建 Web 应用..."
    if [ "$BUILD_MODE" = "production" ]; then
        NODE_ENV=production pnpm build
    else
        pnpm build
    fi
    
    cd ../..
    
    log_info "✅ Web 应用构建完成"
}

# 运行测试
run_tests() {
    log_step "运行测试..."
    
    # API 测试
    log_info "运行 API 测试..."
    cd apps/api
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        pnpm test || log_warn "API 测试失败"
    else
        log_warn "API 测试脚本不存在"
    fi
    cd ../..
    
    # Web 测试
    log_info "运行 Web 测试..."
    cd apps/web
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        pnpm test || log_warn "Web 测试失败"
    else
        log_warn "Web 测试脚本不存在"
    fi
    cd ../..
    
    log_info "✅ 测试完成"
}

# 验证构建结果
verify_build() {
    log_step "验证构建结果..."
    
    # 检查 API 构建产物
    if [ ! -d "apps/api/dist" ] || [ ! -f "apps/api/dist/main.js" ]; then
        log_error "API 构建失败：缺少 dist/main.js"
        exit 1
    fi
    
    # 检查 Web 构建产物
    if [ ! -d "apps/web/.next" ]; then
        log_error "Web 构建失败：缺少 .next 目录"
        exit 1
    fi
    
    # 检查共享库构建产物
    if [ ! -d "libs/shared/dist" ]; then
        log_error "共享库构建失败：缺少 dist 目录"
        exit 1
    fi
    
    log_info "✅ 构建验证通过"
}

# 显示构建信息
show_build_info() {
    log_step "构建信息摘要"
    
    echo "📦 构建产物："
    echo "  - API: apps/api/dist/"
    echo "  - Web: apps/web/.next/"
    echo "  - Shared: libs/shared/dist/"
    
    echo ""
    echo "📊 文件大小："
    if [ -d "apps/api/dist" ]; then
        API_SIZE=$(du -sh apps/api/dist | cut -f1)
        echo "  - API: $API_SIZE"
    fi
    
    if [ -d "apps/web/.next" ]; then
        WEB_SIZE=$(du -sh apps/web/.next | cut -f1)
        echo "  - Web: $WEB_SIZE"
    fi
    
    if [ -d "libs/shared/dist" ]; then
        SHARED_SIZE=$(du -sh libs/shared/dist | cut -f1)
        echo "  - Shared: $SHARED_SIZE"
    fi
    
    echo ""
    echo "🚀 下一步："
    echo "  - 开发环境: pnpm dev"
    echo "  - 生产部署: docker-compose -f docker-compose.prod.yml up -d --build"
    echo "  - 阿里云部署: ./deploy/aliyun-deploy.sh"
}

# 主函数
main() {
    local BUILD_MODE="development"
    local RUN_TESTS=false
    local CLEAN_FIRST=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --prod|--production)
                BUILD_MODE="production"
                shift
                ;;
            --dev|--development)
                BUILD_MODE="development"
                shift
                ;;
            --test)
                RUN_TESTS=true
                shift
                ;;
            --clean)
                CLEAN_FIRST=true
                shift
                ;;
            -h|--help)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --prod, --production    生产环境构建"
                echo "  --dev, --development    开发环境构建 (默认)"
                echo "  --test                  运行测试"
                echo "  --clean                 构建前清理"
                echo "  -h, --help              显示帮助信息"
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done
    
    log_info "🚀 开始构建项目 (模式: $BUILD_MODE)"
    
    # 记录开始时间
    START_TIME=$(date +%s)
    
    # 执行构建步骤
    check_environment
    
    if [ "$CLEAN_FIRST" = true ]; then
        clean_build
    fi
    
    install_dependencies
    build_shared
    build_api
    build_web
    
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    verify_build
    
    # 计算构建时间
    END_TIME=$(date +%s)
    BUILD_TIME=$((END_TIME - START_TIME))
    
    log_info "✅ 构建完成！耗时: ${BUILD_TIME}s"
    
    show_build_info
}

# 错误处理
trap 'log_error "构建失败！"; exit 1' ERR

# 执行主函数
main "$@"
