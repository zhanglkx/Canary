#!/bin/bash

# Canary 项目阿里云部署脚本
# 服务器: 8.159.144.140
# 使用方法: ./deploy-to-aliyun.sh

set -e  # 遇到错误立即退出

ALIYUN_IP="8.159.144.140"
ALIYUN_USER="root"
SSH_KEY="~/.ssh/aliyun_key.pem"
REMOTE_DIR="/opt/canary"

echo "=========================================="
echo "开始部署 Canary 项目到阿里云服务器"
echo "服务器: ${ALIYUN_IP}"
echo "=========================================="

# 1. 检查 SSH 连接
echo ""
echo "步骤 1/5: 测试 SSH 连接..."
if ssh -i ${SSH_KEY} -o ConnectTimeout=10 ${ALIYUN_USER}@${ALIYUN_IP} "echo 'SSH 连接成功'"; then
    echo "✓ SSH 连接正常"
else
    echo "✗ SSH 连接失败，请检查密钥和网络"
    exit 1
fi

# 2. 在服务器上创建项目目录
echo ""
echo "步骤 2/5: 创建远程目录..."
ssh -i ${SSH_KEY} ${ALIYUN_USER}@${ALIYUN_IP} "mkdir -p ${REMOTE_DIR}"
echo "✓ 远程目录创建完成: ${REMOTE_DIR}"

# 3. 打包项目文件
echo ""
echo "步骤 3/5: 打包项目文件..."

# 使用 set +e 临时允许命令失败
set +e
tar czf canary-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.github' \
    --exclude='*.log' \
    --exclude='coverage' \
    --exclude='.pnpm-store' \
    --exclude='.turbo' \
    --exclude='tmp' \
    --exclude='temp' \
    --exclude='.cache' \
    --exclude='canary-deploy.tar.gz' \
    --exclude='canary-deployment.tar.gz' \
    .
TAR_EXIT=$?
set -e

# 退出码 1 通常表示文件在读取时被修改，这是可以接受的
if [ $TAR_EXIT -ne 0 ] && [ $TAR_EXIT -ne 1 ]; then
    echo "✗ 错误: tar 命令失败，退出码: $TAR_EXIT"
    exit $TAR_EXIT
fi

# 验证打包文件是否创建成功
if [ ! -f canary-deploy.tar.gz ]; then
    echo "✗ 错误: 打包文件未创建"
    exit 1
fi

echo "✓ 项目打包完成: canary-deploy.tar.gz"
ls -lh canary-deploy.tar.gz

# 4. 上传到服务器
echo ""
echo "步骤 4/5: 上传文件到服务器..."
scp -i ${SSH_KEY} canary-deploy.tar.gz ${ALIYUN_USER}@${ALIYUN_IP}:${REMOTE_DIR}/
echo "✓ 文件上传完成"

# 5. 在服务器上解压
echo ""
echo "步骤 5/5: 在服务器上解压文件..."
ssh -i ${SSH_KEY} ${ALIYUN_USER}@${ALIYUN_IP} "cd ${REMOTE_DIR} && tar xzf canary-deploy.tar.gz && rm canary-deploy.tar.gz"
echo "✓ 文件解压完成"

# 清理本地打包文件
rm canary-deploy.tar.gz

echo ""
echo "=========================================="
echo "✓ 部署准备完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. SSH 登录到服务器："
echo "   ssh -i ${SSH_KEY} ${ALIYUN_USER}@${ALIYUN_IP}"
echo ""
echo "2. 进入项目目录："
echo "   cd ${REMOTE_DIR}"
echo ""
echo "3. 启动服务："
echo "   docker compose -f docker-compose.prod.yml --env-file .env.production up -d"
echo ""
echo "4. 查看服务状态："
echo "   docker ps"
echo ""
echo "5. 访问应用："
echo "   http://${ALIYUN_IP}"
echo ""
