#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 快速测试修复后的非交互式构建
print_step "快速测试修复后的非交互式 Docker 构建"

# 设置 Docker 构建参数
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

print_info "测试配置："
print_info "  - CI=true (非交互式模式)"
print_info "  - --ignore-scripts (跳过可能的交互式脚本)"
print_info "  - 使用优化后的 Dockerfile.local"

# 只测试 API 构建的依赖安装阶段
print_step "测试 API 依赖安装阶段（非交互式）"

# 构建到 deps 阶段来测试依赖安装
docker build \
  --target deps \
  --progress=plain \
  -f apps/api/Dockerfile.local \
  -t canary-api-deps-test:latest . || {
  print_error "API 依赖安装测试失败"
  exit 1
}

print_success "API 依赖安装测试通过！"

# 测试 Web 依赖安装阶段
print_step "测试 Web 依赖安装阶段（非交互式）"

docker build \
  --target deps \
  --progress=plain \
  -f apps/web/Dockerfile.local \
  -t canary-web-deps-test:latest . || {
  print_error "Web 依赖安装测试失败"
  exit 1
}

print_success "Web 依赖安装测试通过！"

# 清理测试镜像
print_info "清理测试镜像..."
docker rmi canary-api-deps-test:latest canary-web-deps-test:latest || true

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${GREEN}✅ 非交互式构建测试成功！${NC}                      ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                   ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  🎉 修复效果：                                    ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     ✓ 消除了 pnpm 交互式确认提示                 ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     ✓ 使用 CI=true 启用非交互式模式              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     ✓ 添加 --ignore-scripts 跳过交互式脚本       ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     ✓ 构建过程完全自动化，无需人工干预            ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

print_success "现在可以安全地运行完整的构建测试了！"
print_info "运行: ./docker-build-test.sh"