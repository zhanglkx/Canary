#!/bin/bash

# 初始化种子数据脚本
# 用于在部署后填充产品、购物车等种子数据
#
# 使用方式:
#   ./scripts/init-seed-data.sh              # 填充所有种子数据
#   ./scripts/init-seed-data.sh --products    # 只填充产品数据
#   ./scripts/init-seed-data.sh --carts       # 只填充购物车数据
#   ./scripts/init-seed-data.sh --carts --count=5  # 填充5个购物车

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查 Docker 容器是否运行
check_container() {
    local container_name=$1
    if ! docker ps | grep -q "$container_name"; then
        log_error "容器 $container_name 未运行，请先启动服务"
        exit 1
    fi
}

# 解析参数
SEED_PRODUCTS=false
SEED_CARTS=false
CART_COUNT=10

while [[ $# -gt 0 ]]; do
    case $1 in
        --products)
            SEED_PRODUCTS=true
            shift
            ;;
        --carts)
            SEED_CARTS=true
            shift
            ;;
        --count=*)
            CART_COUNT="${1#*=}"
            shift
            ;;
        *)
            log_error "未知参数: $1"
            echo "使用方式: $0 [--products] [--carts] [--count=N]"
            exit 1
            ;;
    esac
done

# 如果没有指定任何选项，则填充所有数据
if [ "$SEED_PRODUCTS" = false ] && [ "$SEED_CARTS" = false ]; then
    SEED_PRODUCTS=true
    SEED_CARTS=true
fi

# 检查容器
log_info "检查容器状态..."
check_container "canary-api-prod"

# 填充产品数据
if [ "$SEED_PRODUCTS" = true ]; then
    log_info "开始填充产品种子数据..."
    docker exec -it canary-api-prod sh -c "cd /app && npm run seed:products"
    if [ $? -eq 0 ]; then
        log_info "✓ 产品种子数据填充完成"
    else
        log_error "产品种子数据填充失败"
        exit 1
    fi
fi

# 填充购物车数据
if [ "$SEED_CARTS" = true ]; then
    log_info "开始填充购物车种子数据（数量: $CART_COUNT）..."
    docker exec -it canary-api-prod sh -c "cd /app && npm run seed:carts -- --count=$CART_COUNT"
    if [ $? -eq 0 ]; then
        log_info "✓ 购物车种子数据填充完成"
    else
        log_error "购物车种子数据填充失败"
        exit 1
    fi
fi

log_info "所有种子数据初始化完成！"
