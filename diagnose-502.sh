#!/bin/bash

# 快速诊断 502 错误脚本

SSH_KEY="$HOME/.ssh/aliyun_key.pem"
SERVER="8.159.144.140"

echo "=========================================="
echo "诊断 502 错误"
echo "=========================================="
echo ""

# 检查本地是否能访问
echo "1. 检查服务器响应..."
if curl -I http://$SERVER 2>/dev/null | head -1; then
    echo "✓ 服务器有响应"
else
    echo "✗ 服务器无响应或连接失败"
fi
echo ""

# SSH 到服务器检查
echo "2. SSH 登录服务器检查..."
ssh -i $SSH_KEY root@$SERVER 'bash -s' << 'EOF'

echo "=== Docker 容器状态 ==="
docker ps -a --filter "name=canary" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== 检查 Nginx 容器 ==="
if docker ps | grep -q "canary-nginx-prod"; then
    echo "✓ Nginx 容器运行中"
    echo ""
    echo "Nginx 日志（最后20行）:"
    docker logs canary-nginx-prod --tail 20
else
    echo "✗ Nginx 容器未运行！这就是 502 的原因！"
fi

echo ""
echo "=== 检查 API 容器 ==="
if docker ps | grep -q "canary-api-prod"; then
    echo "✓ API 容器运行中"
    docker logs canary-api-prod --tail 10
else
    echo "✗ API 容器未运行"
fi

echo ""
echo "=== 检查 Web 容器 ==="
if docker ps | grep -q "canary-web-prod"; then
    echo "✓ Web 容器运行中"
    docker logs canary-web-prod --tail 10
else
    echo "✗ Web 容器未运行"
fi

echo ""
echo "=== 检查数据库 ==="
if docker ps | grep -q "canary-db-prod"; then
    echo "✓ 数据库运行中"
else
    echo "✗ 数据库未运行"
fi

echo ""
echo "=== 部署日志 ==="
if [ -f /tmp/docker-deploy.log ]; then
    echo "最后50行部署日志:"
    tail -50 /tmp/docker-deploy.log
else
    echo "未找到部署日志文件"
fi

echo ""
echo "=== .env.production 文件检查 ==="
if [ -f /opt/canary/.env.production ]; then
    echo "✓ 环境文件存在"
else
    echo "✗ 环境文件不存在！"
fi

echo ""
echo "=== Docker Compose 文件检查 ==="
cd /opt/canary
ls -la docker-compose.prod.yml

EOF

echo ""
echo "=========================================="
echo "诊断完成"
echo "=========================================="
