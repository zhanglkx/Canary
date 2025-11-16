#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
ALIYUN_IP="8.159.144.140"
SSH_KEY="~/.ssh/aliyun_key.pem"
IMAGE_FILE="docker-images-$(date +%Y%m%d-%H%M%S).tar.gz"
LOG_FILE="deploy-$(date +%Y%m%d-%H%M%S).log"

# 函数定义
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

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 检查依赖
check_dependencies() {
    print_step "检查部署环境"
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装或未启动"
        exit 1
    fi
    print_success "Docker 已就绪"
    
    # 检查 Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装"
        exit 1
    fi
    print_success "Docker Compose 已就绪"
    
    # 检查 SSH 密钥
    if [ ! -f ~/.ssh/aliyun_key.pem ]; then
        print_error "SSH 密钥不存在: ~/.ssh/aliyun_key.pem"
        exit 1
    fi
    print_success "SSH 密钥已找到"
    
    # 检查磁盘空间
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    print_info "可用磁盘空间: ${AVAILABLE_SPACE}"
}

# 主程序
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${GREEN}🚀 Canary 项目部署脚本${NC}                        ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}  ${YELLOW}目标服务器: ${ALIYUN_IP}${NC}                ${BLUE}║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # 记录开始时间
    START_TIME=$(date +%s)
    
    # 检查环境
    check_dependencies
    
    # 步骤 1: 拉取基础镜像
    print_step "步骤 1/6: 拉取基础镜像"
    print_info "拉取 postgres:16-alpine..."
    docker pull postgres:16-alpine
    print_success "PostgreSQL 镜像已拉取"
    
    print_info "拉取 nginx:alpine..."
    docker pull nginx:alpine
    print_success "Nginx 镜像已拉取"
    
    # 步骤 2: 本地构建镜像
    print_step "步骤 2/6: 本地构建 Docker 镜像"
    print_warning "这可能需要 3-5 分钟，请耐心等待..."
    
    if docker compose -f docker-compose.prod.yml build; then
        print_success "镜像构建成功"
    else
        print_error "镜像构建失败"
        exit 1
    fi
    
    # 步骤 3: 验证镜像
    print_step "步骤 3/6: 验证镜像"
    echo ""
    echo "本地镜像列表:"
    docker images | grep -E "REPOSITORY|canary-api-prod|canary-web-prod" | head -3
    echo ""
    
    if docker images | grep -q "canary-api-prod"; then
        print_success "API 镜像验证通过"
    else
        print_error "API 镜像不存在"
        exit 1
    fi
    
    if docker images | grep -q "canary-web-prod"; then
        print_success "Web 镜像验证通过"
    else
        print_error "Web 镜像不存在"
        exit 1
    fi
    
    # 步骤 4: 打包镜像
    print_step "步骤 4/6: 打包镜像"
    print_info "正在压缩镜像..."
    
    docker save \
      canary-api-prod:latest \
      canary-web-prod:latest \
      postgres:16-alpine \
      nginx:alpine \
      | gzip > ${IMAGE_FILE}
    
    FILE_SIZE=$(ls -lh ${IMAGE_FILE} | awk '{print $5}')
    
    if [ "${FILE_SIZE}" = "20B" ] || [ "${FILE_SIZE}" = "20" ]; then
        print_error "镜像打包失败，文件太小"
        exit 1
    fi
    
    print_success "镜像打包完成，大小: ${FILE_SIZE}"
    
    # 步骤 5: 上传到服务器
    print_step "步骤 5/6: 上传镜像到服务器"
    print_warning "上传 ${FILE_SIZE} 数据，预计需要 2-3 分钟..."
    
    if scp -i ${SSH_KEY} ${IMAGE_FILE} root@${ALIYUN_IP}:/opt/; then
        print_success "镜像上传成功"
    else
        print_error "镜像上传失败"
        exit 1
    fi
    
    # 步骤 6: 服务器部署
    print_step "步骤 6/6: 在服务器上部署"
    
    ssh -i ${SSH_KEY} root@${ALIYUN_IP} bash << ENDSSH
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 加载 Docker 镜像..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd /opt
docker load < ${IMAGE_FILE}
echo "✓ 镜像加载成功"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛑 停止旧容器..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd /opt/canary
docker compose -f docker-compose.prod.yml --env-file .env.production down 2>/dev/null || true
echo "✓ 旧容器已停止"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 启动新容器..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
echo "✓ 新容器已启动"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ 等待服务就绪（15秒）..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 15

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 容器状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 清理上传的镜像文件..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
rm -f /opt/${IMAGE_FILE}
echo "✓ 清理完成"

ENDSSH
    
    if [ $? -eq 0 ]; then
        print_success "服务器部署完成"
    else
        print_error "服务器部署失败"
        exit 1
    fi
    
    # 清理本地镜像文件
    print_info "清理本地镜像文件..."
    rm -f ${IMAGE_FILE}
    print_success "本地清理完成"
    
    # 计算总耗时
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    MINUTES=$((DURATION / 60))
    SECONDS=$((DURATION % 60))
    
    # 最终结果
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${GREEN}✅ 部署成功！${NC}                                    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                   ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  总耗时: ${MINUTES} 分 ${SECONDS} 秒                                 ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                   ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  🌐 访问地址:                                     ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}     http://${ALIYUN_IP}                ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                   ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  📊 健康检查:                                     ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}     http://${ALIYUN_IP}/health         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                   ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  🔍 GraphQL:                                      ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}     http://${ALIYUN_IP}/graphql        ${GREEN}║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
    echo ""
    
    print_info "部署日志已保存到: ${LOG_FILE}"
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 运行主程序并记录日志
main 2>&1 | tee ${LOG_FILE}
