#!/bin/bash

# 502 错误快速修复脚本

SERVER="8.159.144.140"
SSH_KEY="$HOME/.ssh/aliyun_key.pem"

echo "=========================================="
echo "修复 502 错误 - 配置国内镜像源"
echo "=========================================="
echo ""

ssh -i $SSH_KEY root@$SERVER 'bash -s' << 'ENDSSH'

cd /opt/canary

echo "1. 配置 npm 国内镜像源..."
cat > .npmrc << 'EOF'
registry=https://registry.npmmirror.com
sharp_binary_host=https://npmmirror.com/mirrors/sharp
sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips
sqlite3_binary_host_mirror=https://npmmirror.com/mirrors/sqlite3
EOF

cat > .pnpmrc << 'EOF'
registry=https://registry.npmmirror.com
shamefully-hoist=true
strict-peer-dependencies=false
EOF

echo "✓ 镜像源配置完成"

echo ""
echo "2. 配置 Docker 镜像加速..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF

systemctl restart docker
sleep 3
echo "✓ Docker 镜像加速配置完成"

echo ""
echo "3. 停止旧服务..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo ""
echo "4. 清理 Docker 缓存..."
docker system prune -af --volumes

echo ""
echo "5. 重新构建并启动服务..."
echo "   这将需要 5-10 分钟，请耐心等待..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo ""
echo "6. 等待服务启动..."
sleep 30

echo ""
echo "7. 检查服务状态..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=========================================="
echo "修复脚本执行完成"
echo "=========================================="

ENDSSH

echo ""
echo "=========================================="
echo "等待 2 分钟后检查服务..."
echo "=========================================="
sleep 120

echo ""
echo "最终检查..."
ssh -i $SSH_KEY root@$SERVER 'docker ps && echo "" && echo "测试 API:" && curl -f http://localhost:4000/health 2>/dev/null && echo "✓ API 正常" || echo "✗ API 未响应"'

echo ""
echo "=========================================="
echo "访问测试："
echo "  http://8.159.144.140"
echo "=========================================="
