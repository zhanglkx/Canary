#!/bin/bash
# Nginx 配置更新脚本
# 用法: ./update-nginx-config.sh

set -e

SERVER="root@8.159.144.140"
KEY="~/.ssh/aliyun_key.pem"
REMOTE_PATH="/root/canary"

echo "=== 🔄 Nginx 配置更新流程 ==="

# 1. 上传配置文件
echo ""
echo "📤 1. 上传 nginx.prod.conf 到服务器..."
scp -i $KEY nginx.prod.conf $SERVER:$REMOTE_PATH/

# 2. 验证配置
echo ""
echo "✅ 2. 验证 Nginx 配置..."
ssh -i $KEY $SERVER "cd $REMOTE_PATH && docker exec canary-nginx-prod nginx -t"

if [ $? -ne 0 ]; then
    echo "❌ 配置文件有语法错误，停止更新"
    exit 1
fi

# 3. 重新加载配置
echo ""
echo "🔄 3. 重新加载 Nginx 配置（零停机）..."
ssh -i $KEY $SERVER "cd $REMOTE_PATH && docker exec canary-nginx-prod nginx -s reload"

# 4. 验证服务
echo ""
echo "🔍 4. 验证服务状态..."
ssh -i $KEY $SERVER "cd $REMOTE_PATH && ./scripts/health-check.sh"

echo ""
echo "✅ Nginx 配置更新完成！"
echo "访问地址: http://8.159.144.140"
