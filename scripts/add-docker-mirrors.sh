#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SERVER_HOST="${SERVER_HOST:-8.159.144.140}"
SERVER_USER="${SERVER_USER:-root}"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/aliyun_key.pem}"

# 要添加的新镜像源
NEW_MIRRORS=(
  "https://docker.m.daocloud.io"
  "https://dockerproxy.com"
  "https://docker.nju.edu.cn"
  "https://docker.mirrors.sjtug.sjtu.edu.cn"
)

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
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

SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

print_info "连接到服务器 ${SERVER_USER}@${SERVER_HOST}..."
print_info "添加 Docker 镜像加速器..."

ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} bash << 'ENDSSH'
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
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

# 要添加的新镜像源
NEW_MIRRORS=(
  "https://docker.m.daocloud.io"
  "https://dockerproxy.com"
  "https://docker.nju.edu.cn"
  "https://docker.mirrors.sjtug.sjtu.edu.cn"
)

print_info "📋 读取当前 Docker 配置..."

# 创建 /etc/docker 目录（如果不存在）
mkdir -p /etc/docker

# 备份现有配置
if [ -f /etc/docker/daemon.json ]; then
    BACKUP_FILE="/etc/docker/daemon.json.bak.$(date +%Y%m%d_%H%M%S)"
    cp /etc/docker/daemon.json "$BACKUP_FILE"
    print_success "配置已备份到: $BACKUP_FILE"
    
    # 显示当前配置
    echo ""
    print_info "当前配置："
    cat /etc/docker/daemon.json | python3 -m json.tool 2>/dev/null || cat /etc/docker/daemon.json
    echo ""
else
    print_info "未找到现有配置，将创建新配置"
fi

# 使用 Python 处理 JSON（更可靠）
print_info "🔧 合并镜像源配置..."

python3 << 'PYTHON_SCRIPT'
import json
import sys
from pathlib import Path

# 新镜像源
new_mirrors = [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.nju.edu.cn",
    "https://docker.mirrors.sjtug.sjtu.edu.cn"
]

daemon_json_path = Path("/etc/docker/daemon.json")

# 读取现有配置
if daemon_json_path.exists():
    try:
        with open(daemon_json_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"⚠️  读取现有配置失败: {e}", file=sys.stderr)
        config = {}
else:
    config = {}

# 获取现有镜像源
existing_mirrors = config.get("registry-mirrors", [])

# 合并镜像源（去重，保留顺序）
all_mirrors = list(existing_mirrors)
for mirror in new_mirrors:
    if mirror not in all_mirrors:
        all_mirrors.append(mirror)

# 更新配置
config["registry-mirrors"] = all_mirrors

# 确保其他必要配置存在
if "log-driver" not in config:
    config["log-driver"] = "json-file"
if "log-opts" not in config:
    config["log-opts"] = {
        "max-size": "100m",
        "max-file": "3"
    }
if "storage-driver" not in config:
    config["storage-driver"] = "overlay2"

# 写入新配置
with open(daemon_json_path, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print(f"✅ 配置已更新，共 {len(all_mirrors)} 个镜像源")
PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    print_error "配置更新失败"
    exit 1
fi

# 显示更新后的配置
echo ""
print_info "更新后的配置："
cat /etc/docker/daemon.json | python3 -m json.tool 2>/dev/null || cat /etc/docker/daemon.json
echo ""

# 重新加载 systemd 配置
print_info "🔄 重新加载 systemd 配置..."
systemctl daemon-reload

# 重启 Docker 服务
print_info "🔄 重启 Docker 服务..."
if systemctl restart docker; then
    print_success "Docker 服务已重启"
else
    print_error "Docker 服务重启失败"
    exit 1
fi

# 等待 Docker 服务完全启动
sleep 3

# 验证 Docker 服务状态
if systemctl is-active --quiet docker; then
    print_success "Docker 服务运行正常"
else
    print_error "Docker 服务未正常运行"
    exit 1
fi

# 验证镜像源配置
echo ""
print_info "验证镜像源配置..."
if docker info 2>/dev/null | grep -A 20 "Registry Mirrors"; then
    print_success "镜像源配置已生效"
else
    print_warning "无法验证镜像源配置，但配置已写入"
fi

echo ""
print_success "✅ Docker 镜像加速器配置完成！"
print_info "已添加的镜像源："
for mirror in "${NEW_MIRRORS[@]}"; do
    echo "  - $mirror"
done
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    print_success "✅ 镜像源配置完成！"
    echo ""
    print_info "已成功添加以下镜像源到阿里云服务器："
    for mirror in "${NEW_MIRRORS[@]}"; do
        echo "  - $mirror"
    done
else
    print_error "配置失败"
    exit 1
fi
