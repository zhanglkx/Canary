#!/bin/bash
# 部署调试脚本 - 在服务器上运行以诊断 502 问题

echo "=========================================="
echo "  部署诊断脚本"
echo "=========================================="

cd /opt/canary

echo ""
echo "1️⃣ 检查容器状态..."
echo "----------------------------------------"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "2️⃣ 检查容器日志 (API)..."
echo "----------------------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=50 api 2>&1 || echo "API 容器不存在"

echo ""
echo "3️⃣ 检查容器日志 (Web)..."
echo "----------------------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=50 web 2>&1 || echo "Web 容器不存在"

echo ""
echo "4️⃣ 检查容器日志 (Nginx)..."
echo "----------------------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=20 nginx 2>&1 || echo "Nginx 容器不存在"

echo ""
echo "5️⃣ 检查镜像是否存在..."
echo "----------------------------------------"
docker images | grep -E "canary|ghcr"

echo ""
echo "6️⃣ 检查环境变量..."
echo "----------------------------------------"
echo "GHCR_OWNER: ${GHCR_OWNER:-未设置}"
cat .env.production 2>/dev/null | grep -E "^GHCR|^DATABASE|^JWT" | head -10 || echo ".env.production 不存在"

echo ""
echo "7️⃣ 检查端口占用..."
echo "----------------------------------------"
netstat -tlnp 2>/dev/null | grep -E "3000|4000|80|5432" || ss -tlnp | grep -E "3000|4000|80|5432"

echo ""
echo "=========================================="
echo "  诊断完成"
echo "=========================================="
