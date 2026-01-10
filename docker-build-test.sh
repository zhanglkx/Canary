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

# 测试优化后的 Docker 构建
print_step "测试优化后的 Docker 构建性能"

# 记录开始时间
START_TIME=$(date +%s)

# 设置 Docker 构建参数
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

print_info "使用的版本和配置："
print_info "  - Node.js: 22.15.0"
print_info "  - pnpm: 10.14.0"
print_info "  - Docker BuildKit: enabled"
print_info "  - CI 模式: enabled (非交互式)"

# 清理旧缓存
print_step "清理旧的 Docker 缓存"
docker builder prune --filter until=24h -f || true
print_success "缓存清理完成"

# 预拉取基础镜像
print_step "预拉取基础镜像"
docker pull node:22.15.0-alpine
print_success "基础镜像拉取完成"

# 测试构建 API
print_step "测试构建 API 镜像"
API_START=$(date +%s)

docker build \
  --progress=plain \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from=node:22.15.0-alpine \
  -f apps/api/Dockerfile.local \
  -t canary-api-test:latest . || {
  print_error "API 构建失败"
  exit 1
}

API_END=$(date +%s)
API_DURATION=$((API_END - API_START))
print_success "API 镜像构建完成，耗时: ${API_DURATION} 秒"

# 测试构建 Web
print_step "测试构建 Web 镜像"
WEB_START=$(date +%s)

docker build \
  --progress=plain \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from=node:22.15.0-alpine \
  -f apps/web/Dockerfile.local \
  -t canary-web-test:latest . || {
  print_error "Web 构建失败"
  exit 1
}

WEB_END=$(date +%s)
WEB_DURATION=$((WEB_END - WEB_START))
print_success "Web 镜像构建完成，耗时: ${WEB_DURATION} 秒"

# 验证镜像
print_step "验证构建的镜像"
echo ""
echo "镜像列表："
docker images | grep -E "REPOSITORY|canary.*test" | head -3
echo ""

# 检查镜像大小
API_SIZE=$(docker images canary-api-test:latest --format "{{.Size}}")
WEB_SIZE=$(docker images canary-web-test:latest --format "{{.Size}}")

print_info "镜像大小："
print_info "  - API: ${API_SIZE}"
print_info "  - Web: ${WEB_SIZE}"

# 计算总耗时
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_DURATION / 60))
SECONDS=$((TOTAL_DURATION % 60))

# 显示结果
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${GREEN}✅ Docker 构建测试完成！${NC}                        ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                   ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  📊 构建性能统计：                                ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     API 构建时间: ${API_DURATION} 秒                           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     Web 构建时间: ${WEB_DURATION} 秒                           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     总耗时: ${MINUTES} 分 ${SECONDS} 秒                                 ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                   ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  🚀 优化效果：                                    ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     ✓ 使用了与本地环境一致的版本                  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     ✓ 启用了 Docker BuildKit 缓存                ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     ✓ 优化了 pnpm 配置和网络设置                  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     ✓ 添加了 .dockerignore 减少构建上下文         ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

print_info "清理测试镜像..."
docker rmi canary-api-test:latest canary-web-test:latest || true
print_success "清理完成"

echo ""
print_success "构建测试完成！优化后的配置已准备就绪。"