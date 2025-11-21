#!/bin/bash

# Canary 项目调试配置验证脚本
# 此脚本用于验证调试环境是否正确配置

set -e

echo "🔍 开始验证 Canary 调试配置..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. 检查 Node.js 版本
echo "1️⃣  检查 Node.js 版本..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 20 ]; then
        check_pass "Node.js 版本: $NODE_VERSION (要求 >= 20.0.0)"
    else
        check_fail "Node.js 版本: $NODE_VERSION (需要 >= 20.0.0)"
        exit 1
    fi
else
    check_fail "Node.js 未安装"
    exit 1
fi
echo ""

# 2. 检查 pnpm
echo "2️⃣  检查 pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    check_pass "pnpm 版本: $PNPM_VERSION"
else
    check_fail "pnpm 未安装，请运行: npm install -g pnpm"
    exit 1
fi
echo ""

# 3. 检查项目依赖
echo "3️⃣  检查项目依赖..."
if [ -d "node_modules" ]; then
    check_pass "根目录 node_modules 存在"
else
    check_warn "根目录 node_modules 不存在，运行: pnpm install"
fi

if [ -d "apps/api/node_modules" ]; then
    check_pass "后端 node_modules 存在"
else
    check_warn "后端 node_modules 不存在，运行: pnpm install"
fi

if [ -d "apps/web/node_modules" ]; then
    check_pass "前端 node_modules 存在"
else
    check_warn "前端 node_modules 不存在，运行: pnpm install"
fi
echo ""

# 4. 检查 Docker
echo "4️⃣  检查 Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    check_pass "Docker 已安装: $DOCKER_VERSION"
    
    # 检查 Docker 是否运行
    if docker info &> /dev/null; then
        check_pass "Docker 服务正在运行"
    else
        check_warn "Docker 服务未运行，请启动 Docker Desktop"
    fi
else
    check_warn "Docker 未安装（可选，用于数据库）"
fi
echo ""

# 5. 检查 PostgreSQL 容器
echo "5️⃣  检查 PostgreSQL 数据库..."
if docker ps --format '{{.Names}}' | grep -q "learning-nest-next-db-dev"; then
    check_pass "PostgreSQL 容器正在运行"
    
    # 测试数据库连接
    if docker exec learning-nest-next-db-dev pg_isready -U postgres &> /dev/null; then
        check_pass "PostgreSQL 数据库可访问"
    else
        check_warn "PostgreSQL 数据库未就绪"
    fi
else
    check_warn "PostgreSQL 容器未运行，运行: docker-compose up -d postgres"
fi
echo ""

# 6. 检查端口占用
echo "6️⃣  检查端口占用..."
check_port() {
    local PORT=$1
    local NAME=$2
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        check_warn "端口 $PORT ($NAME) 已被占用"
        PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
        PROCESS=$(ps -p $PID -o comm=)
        echo "   进程: $PROCESS (PID: $PID)"
    else
        check_pass "端口 $PORT ($NAME) 可用"
    fi
}

check_port 3000 "Next.js"
check_port 4000 "NestJS"
check_port 5432 "PostgreSQL"
check_port 9229 "Node Inspector"
echo ""

# 7. 检查 VS Code 配置
echo "7️⃣  检查 VS Code 调试配置..."
if [ -f ".vscode/launch.json" ]; then
    check_pass "VS Code launch.json 存在"
    
    # 检查配置数量
    CONFIG_COUNT=$(grep -c '"name":' .vscode/launch.json || true)
    check_pass "找到 $CONFIG_COUNT 个调试配置"
else
    check_fail "VS Code launch.json 不存在"
fi
echo ""

# 8. 检查 TypeScript 配置
echo "8️⃣  检查 TypeScript 配置..."
check_tsconfig() {
    local FILE=$1
    local NAME=$2
    if [ -f "$FILE" ]; then
        if grep -q '"sourceMap": true' "$FILE"; then
            check_pass "$NAME: sourceMap 已启用"
        else
            check_warn "$NAME: sourceMap 未启用"
        fi
    else
        check_warn "$NAME: tsconfig.json 不存在"
    fi
}

check_tsconfig "apps/api/tsconfig.json" "后端"
check_tsconfig "apps/web/tsconfig.json" "前端"
echo ""

# 9. 检查后端构建
echo "9️⃣  检查后端构建..."
if [ -d "apps/api/dist" ]; then
    if [ -f "apps/api/dist/main.js" ]; then
        check_pass "后端已构建 (dist/main.js 存在)"
    else
        check_warn "后端构建不完整，运行: pnpm --filter api build"
    fi
else
    check_warn "后端未构建，运行: pnpm --filter api build"
fi
echo ""

# 10. 检查调试指南
echo "🔟  检查调试文档..."
if [ -f "docs/DEBUG_SETUP.md" ]; then
    check_pass "调试指南文档存在: docs/DEBUG_SETUP.md"
else
    check_warn "调试指南文档不存在"
fi
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 验证完成！"
echo ""
echo "💡 下一步操作："
echo ""
echo "如果 PostgreSQL 未运行："
echo "  $ docker-compose up -d postgres"
echo ""
echo "如果依赖未安装："
echo "  $ pnpm install"
echo ""
echo "如果后端未构建："
echo "  $ pnpm --filter api build"
echo ""
echo "启动调试："
echo "  1. 在 VS Code 中按 F5"
echo "  2. 选择 '🎯 完整全栈调试'"
echo "  3. 开始调试！"
echo ""
echo "查看详细调试指南："
echo "  $ cat docs/DEBUG_SETUP.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
