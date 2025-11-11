#!/bin/bash

# Alibaba Cloud Linux 3 专用部署脚本
# 使用方法: sudo ./deploy/alinux-deploy.sh

set -e

echo "🚀 开始在 Alibaba Cloud Linux 3 上部署 Canary 项目..."

# 配置变量
PROJECT_NAME="canary"
DEPLOY_PATH="/opt/${PROJECT_NAME}"
BACKUP_PATH="/opt/backups/${PROJECT_NAME}"
CURRENT_DIR=$(pwd)
PUBLIC_IP="8.159.144.140"  # 阿里云公网 IP

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行此脚本"
    log_info "使用方法: sudo ./deploy/alinux-deploy.sh"
    exit 1
fi

# 检查是否为 Alibaba Cloud Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" != "alinux" && "$ID" != "alios" ]]; then
        log_warn "此脚本专为 Alibaba Cloud Linux 设计，当前系统: $PRETTY_NAME"
        log_warn "建议使用 ./deploy/local-deploy.sh"
    fi
else
    log_warn "无法检测操作系统版本"
fi

# 步骤1: 安装基础工具
log_step "检查并安装基础工具..."

# 检查并安装基础工具
tools_to_install=()
basic_tools=("curl" "wget" "tar" "gzip" "unzip" "git" "nano")

for tool in "${basic_tools[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
        tools_to_install+=("$tool")
    else
        log_info "$tool 已安装"
    fi
done

if [ ${#tools_to_install[@]} -gt 0 ]; then
    log_info "需要安装: ${tools_to_install[*]}"
    yum update -y
    yum install -y "${tools_to_install[@]}"
    log_info "✅ 基础工具安装完成"
else
    log_info "✅ 所有基础工具已安装"
fi

# 步骤2: 安装 Docker
log_step "检查并安装 Docker..."

# 检查是否安装了 podman（Alibaba Cloud Linux 3 默认）
if command -v podman &> /dev/null; then
    log_error "❌ 检测到 podman，这会与 Docker 冲突"
    log_error "请先运行 podman 修复脚本: sudo ./deploy/fix-podman.sh"
    exit 1
fi

# 检查 Docker 是否正确安装
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version 2>/dev/null)
    if echo "$DOCKER_VERSION" | grep -q "podman"; then
        log_error "❌ docker 命令实际指向 podman"
        log_error "请先运行 podman 修复脚本: sudo ./deploy/fix-podman.sh"
        exit 1
    fi
    
    log_info "✅ Docker 已安装: $DOCKER_VERSION"
    
    # 确保 Docker 服务运行
    if ! systemctl is-active --quiet docker; then
        log_info "启动 Docker 服务..."
        systemctl start docker
        systemctl enable docker
    else
        log_info "Docker 服务已运行"
    fi
    
    # 检查并配置镜像加速器
    if [ ! -f /etc/docker/daemon.json ]; then
        log_info "配置 Docker 镜像加速器..."
        mkdir -p /etc/docker
        cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
        systemctl daemon-reload
        systemctl restart docker
        log_info "✅ Docker 镜像加速器配置完成"
    else
        log_info "Docker 镜像加速器已配置"
    fi
else
    log_info "Docker 未安装，开始安装..."
    
    # 方法1: 尝试阿里云镜像（推荐）
    log_info "尝试使用阿里云镜像安装 Docker..."
    if curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -o /etc/yum.repos.d/docker-ce.repo 2>/dev/null; then
        yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        log_info "✅ 使用阿里云镜像安装 Docker 成功"
    else
        # 方法2: 使用 yum 默认源
        log_info "尝试使用系统默认源安装 Docker..."
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo 2>/dev/null || {
            # 方法3: 手动安装
            log_warn "官方源连接失败，使用备用安装方法..."
            yum install -y docker
        }
        
        if ! command -v docker &> /dev/null; then
            yum install -y docker-ce docker-ce-cli containerd.io 2>/dev/null || yum install -y docker
        fi
    fi
    
    # 如果还是没有安装成功，尝试官方脚本
    if ! command -v docker &> /dev/null; then
        log_info "尝试官方安装脚本..."
        # 设置超时和重试
        for i in {1..3}; do
            log_info "尝试第 $i 次下载 Docker 安装脚本..."
            if curl -fsSL --connect-timeout 30 --max-time 300 https://get.docker.com -o get-docker.sh; then
                sh get-docker.sh
                rm -f get-docker.sh
                break
            else
                log_warn "第 $i 次下载失败，等待 10 秒后重试..."
                sleep 10
            fi
        done
    fi
    
    # 验证安装
    if ! command -v docker &> /dev/null; then
        log_error "Docker 安装失败，请检查网络连接或手动安装"
        log_error "手动安装命令: yum install -y docker"
        exit 1
    fi
    
    # 启动 Docker 服务
    systemctl enable docker
    systemctl start docker
    
    # 配置 Docker 镜像加速器（中国大陆用户）
    log_info "配置 Docker 镜像加速器..."
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
    
    # 重启 Docker 服务以应用配置
    systemctl daemon-reload
    systemctl restart docker
    
    log_info "✅ Docker 安装和配置完成"
else
    log_info "✅ Docker 已安装: $(docker --version)"
    
    # 确保 Docker 服务运行
    if ! systemctl is-active --quiet docker; then
        log_info "启动 Docker 服务..."
        systemctl start docker
        systemctl enable docker
    else
        log_info "Docker 服务已运行"
    fi
    
    # 检查并配置镜像加速器
    if [ ! -f /etc/docker/daemon.json ]; then
        log_info "配置 Docker 镜像加速器..."
        mkdir -p /etc/docker
        cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
        systemctl daemon-reload
        systemctl restart docker
        log_info "✅ Docker 镜像加速器配置完成"
    else
        log_info "Docker 镜像加速器已配置"
    fi
fi

# 步骤3: 安装 Docker Compose
log_step "检查并安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    log_info "Docker Compose 未安装，开始安装..."
    
    # 检查是否已经通过 Docker CE 安装了 compose 插件
    if docker compose version &> /dev/null; then
        log_info "Docker Compose 插件已安装，创建兼容性链接..."
        cat > /usr/local/bin/docker-compose << 'EOF'
#!/bin/bash
docker compose "$@"
EOF
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    else
        # 尝试多个下载源
        COMPOSE_VERSION="v2.23.0"
        DOWNLOAD_SUCCESS=false
        
        # 下载源列表（按优先级排序）
        DOWNLOAD_URLS=(
            "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"
            "https://get.daocloud.io/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"
        )
        
        for url in "${DOWNLOAD_URLS[@]}"; do
            log_info "尝试从 $url 下载 Docker Compose..."
            if curl -L --connect-timeout 30 --max-time 300 "$url" -o /usr/local/bin/docker-compose 2>/dev/null; then
                chmod +x /usr/local/bin/docker-compose
                ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
                
                # 验证安装
                if docker-compose --version &> /dev/null; then
                    DOWNLOAD_SUCCESS=true
                    log_info "✅ Docker Compose 安装成功"
                    break
                fi
            fi
            log_warn "从 $url 下载失败，尝试下一个源..."
        done
        
        # 如果所有下载都失败，尝试 pip 安装
        if [ "$DOWNLOAD_SUCCESS" = false ]; then
            log_info "尝试使用 pip 安装 Docker Compose..."
            yum install -y python3-pip
            pip3 install docker-compose
            
            if ! command -v docker-compose &> /dev/null; then
                log_error "Docker Compose 安装失败"
                log_error "请手动安装: pip3 install docker-compose"
                exit 1
            fi
        fi
    fi
else
    log_info "✅ Docker Compose 已安装: $(docker-compose --version)"
fi

# 步骤4: 安装 Node.js (专为 Alibaba Cloud Linux 优化)
log_step "检查并安装 Node.js..."
if ! command -v node &> /dev/null; then
    log_info "Node.js 未安装，开始安装..."
    
    # 检查并安装 EPEL 源
    if ! yum repolist | grep -q epel; then
        log_info "安装 EPEL 源..."
        yum install -y epel-release
    else
        log_info "EPEL 源已安装"
    fi
    
    # 安装 Node.js 和 npm
    yum install -y nodejs npm
    
    # 检查版本，如果太低则使用二进制包
    NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 2>/dev/null || echo "0")
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_info "系统 Node.js 版本过低 (v$NODE_VERSION)，安装最新版本..."
        
        # 下载 Node.js 18 二进制包
        cd /tmp
        wget -q https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
        tar -xf node-v18.19.0-linux-x64.tar.xz
        
        # 备份旧版本
        if command -v node &> /dev/null; then
            mv /usr/bin/node /usr/bin/node.old 2>/dev/null || true
            mv /usr/bin/npm /usr/bin/npm.old 2>/dev/null || true
        fi
        
        # 安装新版本
        cp -r node-v18.19.0-linux-x64/{bin,lib,share,include} /usr/local/
        ln -sf /usr/local/bin/node /usr/bin/node
        ln -sf /usr/local/bin/npm /usr/bin/npm
        ln -sf /usr/local/bin/npx /usr/bin/npx
        
        # 清理
        rm -rf /tmp/node-v18.19.0-linux-x64*
    fi
    
    log_info "✅ Node.js 安装完成: $(node --version)"
else
    log_info "✅ Node.js 已安装: $(node --version)"
    
    # 检查版本是否满足要求
    NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 2>/dev/null || echo "0")
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_warn "Node.js 版本过低 (v$NODE_VERSION)，建议升级到 v16 或更高版本"
        log_info "升级 Node.js 到最新版本..."
        
        # 下载并安装最新版本
        cd /tmp
        wget -q https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
        tar -xf node-v18.19.0-linux-x64.tar.xz
        
        # 备份旧版本
        mv /usr/bin/node /usr/bin/node.old 2>/dev/null || true
        mv /usr/bin/npm /usr/bin/npm.old 2>/dev/null || true
        
        # 安装新版本
        cp -r node-v18.19.0-linux-x64/{bin,lib,share,include} /usr/local/
        ln -sf /usr/local/bin/node /usr/bin/node
        ln -sf /usr/local/bin/npm /usr/bin/npm
        ln -sf /usr/local/bin/npx /usr/bin/npx
        
        # 清理
        rm -rf /tmp/node-v18.19.0-linux-x64*
        
        log_info "✅ Node.js 升级完成: $(node --version)"
    else
        log_info "Node.js 版本满足要求"
    fi
fi

# 步骤5: 安装 pnpm
log_step "检查并安装 pnpm..."
if ! command -v pnpm &> /dev/null; then
    log_info "pnpm 未安装，开始安装..."
    
    # 配置 npm 镜像源以加速安装
    npm config set registry https://registry.npmmirror.com
    npm install -g pnpm
    
    log_info "✅ pnpm 安装完成: $(pnpm --version)"
else
    log_info "✅ pnpm 已安装: $(pnpm --version)"
fi

# 步骤6: 创建目录
log_step "检查并创建必要目录..."

directories=("${DEPLOY_PATH}" "${BACKUP_PATH}" "${DEPLOY_PATH}/ssl")
for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log_info "创建目录: $dir"
    else
        log_info "目录已存在: $dir"
    fi
done

log_info "✅ 目录检查完成"

# 步骤7: 配置防火墙
log_step "检查并配置防火墙..."

required_ports=("3000/tcp" "4000/tcp" "80/tcp" "443/tcp")

if systemctl is-active --quiet firewalld; then
    log_info "使用 firewalld 配置防火墙规则..."
    
    # 检查端口是否已开放
    ports_to_add=()
    for port in "${required_ports[@]}"; do
        if ! firewall-cmd --list-ports | grep -q "$port"; then
            ports_to_add+=("$port")
        else
            log_info "端口 $port 已开放"
        fi
    done
    
    if [ ${#ports_to_add[@]} -gt 0 ]; then
        log_info "需要开放端口: ${ports_to_add[*]}"
        for port in "${ports_to_add[@]}"; do
            firewall-cmd --permanent --add-port="$port"
        done
        firewall-cmd --reload
        log_info "✅ firewalld 规则配置完成"
    else
        log_info "✅ 所有必要端口已开放"
    fi
    
elif command -v iptables &> /dev/null; then
    log_info "使用 iptables 配置防火墙规则..."
    
    # 检查并添加 iptables 规则
    ports_to_add=()
    for port in "3000" "4000" "80" "443"; do
        if ! iptables -L INPUT -n | grep -q "dpt:$port"; then
            ports_to_add+=("$port")
        else
            log_info "端口 $port 已开放"
        fi
    done
    
    if [ ${#ports_to_add[@]} -gt 0 ]; then
        log_info "需要开放端口: ${ports_to_add[*]}"
        for port in "${ports_to_add[@]}"; do
            iptables -I INPUT -p tcp --dport "$port" -j ACCEPT
        done
        # 保存规则
        iptables-save > /etc/sysconfig/iptables 2>/dev/null || true
        log_info "✅ iptables 规则配置完成"
    else
        log_info "✅ 所有必要端口已开放"
    fi
    
else
    log_warn "未找到防火墙工具，请手动配置端口: ${required_ports[*]}"
fi

# 步骤8: 创建环境配置
log_step "检查并创建环境配置..."

if [ -f ".env.production" ]; then
    log_info "环境配置文件已存在，创建备份..."
    cp .env.production ".env.production.backup.$(date +%Y%m%d-%H%M%S)"
fi

log_info "配置公网 IP: ${PUBLIC_IP}"

cat > .env.production << EOF
# Alibaba Cloud Linux 3 生产环境配置
# 公网 IP: ${PUBLIC_IP}

# 数据库配置
DATABASE_URL="postgresql://canary_user:AliCloud2024!@postgres:5432/canary_db"
POSTGRES_DB=canary_db
POSTGRES_USER=canary_user
POSTGRES_PASSWORD=AliCloud2024!

# Redis 配置
REDIS_URL="redis://redis:6379"

# JWT 配置
JWT_SECRET="alibaba-cloud-canary-jwt-secret-2024"
JWT_EXPIRES_IN="7d"

# API 配置
API_PORT=4000
API_HOST=0.0.0.0

# 前端配置 - 使用公网 IP
NEXT_PUBLIC_API_URL="http://${PUBLIC_IP}:4000/graphql"
NEXT_PUBLIC_WS_URL="ws://${PUBLIC_IP}:4000/graphql"

# 环境
NODE_ENV=production

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH="/app/uploads"

# CORS 配置 - 允许公网 IP 访问
CORS_ORIGIN="http://${PUBLIC_IP}:3000,http://localhost:3000"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
EOF

log_info "环境配置文件已创建（已配置公网 IP: ${PUBLIC_IP}）"

# 步骤9: 构建和部署
log_step "构建项目..."
if [ ! -f "package.json" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖
log_info "安装项目依赖..."
pnpm install --frozen-lockfile

# 构建项目
log_info "构建项目..."
pnpm build

# 步骤10: 复制文件
log_step "复制文件到部署目录..."
# 备份现有部署
if [ -d "${DEPLOY_PATH}" ] && [ -n "$(ls -A ${DEPLOY_PATH} 2>/dev/null)" ]; then
    backup_file="${BACKUP_PATH}/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    log_info "创建备份: ${backup_file}"
    tar -czf "${backup_file}" -C "${DEPLOY_PATH}" . || true
fi

# 清理并复制文件
find "${DEPLOY_PATH}" -mindepth 1 -maxdepth 1 ! -name "ssl" -exec rm -rf {} \; 2>/dev/null || true
cp -r apps/ "${DEPLOY_PATH}/"
cp -r libs/ "${DEPLOY_PATH}/"
cp package.json pnpm-workspace.yaml pnpm-lock.yaml "${DEPLOY_PATH}/"
cp tsconfig.base.json "${DEPLOY_PATH}/"
cp docker-compose.prod.yml "${DEPLOY_PATH}/docker-compose.yml"
cp nginx.conf "${DEPLOY_PATH}/" 2>/dev/null || true
cp .env.production "${DEPLOY_PATH}/"

# 步骤11: 启动服务
log_step "启动服务..."
cd "${DEPLOY_PATH}"

# 停止现有服务
docker-compose down || true

# 清理旧镜像
docker system prune -f || true

# 启动服务
log_info "启动 Docker 服务..."
docker-compose up -d --build

# 等待服务启动
log_info "等待服务启动..."
sleep 30

# 检查服务状态
log_info "检查服务状态..."
docker-compose ps

cd "${CURRENT_DIR}"

# 步骤12: 健康检查
log_step "健康检查..."
max_attempts=10
attempt=1

# 检查 API
while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:4000/health &> /dev/null; then
        log_info "✅ API 服务正常"
        break
    else
        log_warn "API 服务检查失败，尝试 $attempt/$max_attempts"
        sleep 10
        ((attempt++))
    fi
done

# 检查前端
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000 &> /dev/null; then
        log_info "✅ 前端服务正常"
        break
    else
        log_warn "前端服务检查失败，尝试 $attempt/$max_attempts"
        sleep 10
        ((attempt++))
    fi
done

# 创建系统服务
log_step "创建系统服务..."
cat > /etc/systemd/system/canary.service << 'EOF'
[Unit]
Description=Canary Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/canary
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable canary.service

# 完成
echo ""
echo "🎉 Alibaba Cloud Linux 3 部署完成！"
echo ""
echo "📍 部署路径: ${DEPLOY_PATH}"
echo "📍 备份路径: ${BACKUP_PATH}"
echo "📍 公网 IP: ${PUBLIC_IP}"
echo ""
echo "🌐 本地访问地址（从你的电脑访问）:"
echo "   🖥️  前端应用: http://${PUBLIC_IP}:3000"
echo "   🔗 GraphQL API: http://${PUBLIC_IP}:4000/graphql"
echo "   ❤️  健康检查: http://${PUBLIC_IP}:4000/health"
echo ""
echo "🌐 服务器本地访问地址:"
echo "   前端: http://localhost:3000"
echo "   API:  http://localhost:4000/graphql"
echo ""
echo "🔧 管理命令:"
echo "   查看日志: cd ${DEPLOY_PATH} && docker-compose logs -f"
echo "   重启服务: systemctl restart canary"
echo "   停止服务: systemctl stop canary"
echo "   服务状态: systemctl status canary"
echo ""
echo "⚠️  重要提醒："
echo "   1. 🔥 请在阿里云控制台配置安全组，开放端口 3000, 4000"
echo "   2. 🔐 建议修改数据库密码和 JWT 密钥"
echo "   3. 🌍 已自动配置公网 IP，可直接从本地访问"
echo ""
echo "📋 阿里云安全组配置步骤："
echo "   1. 登录阿里云控制台"
echo "   2. 进入 ECS 实例管理"
echo "   3. 点击实例 -> 安全组 -> 配置规则"
echo "   4. 添加入方向规则："
echo "      - 端口范围: 3000/3000, 协议: TCP, 授权对象: 0.0.0.0/0"
echo "      - 端口范围: 4000/4000, 协议: TCP, 授权对象: 0.0.0.0/0"
echo ""

log_info "🎉 部署流程完成！"
