#!/bin/bash

# 快速设置脚本
# 用于初始化本地部署环境

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_separator() {
    echo -e "${CYAN}========================================${NC}"
}

# 显示横幅
show_banner() {
    log_separator
    echo -e "${CYAN}    Canary 部署环境设置${NC}"
    echo -e "${CYAN}    快速配置本地部署环境${NC}"
    log_separator
    echo ""
}

# 检查必要工具
check_requirements() {
    log_step "检查必要工具..."
    
    local missing_tools=()
    
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    else
        log_success "Docker 已安装: $(docker --version | head -n1)"
    fi
    
    if ! command -v pnpm &> /dev/null; then
        missing_tools+=("pnpm")
    else
        log_success "pnpm 已安装: $(pnpm --version)"
    fi
    
    if ! command -v ssh &> /dev/null; then
        missing_tools+=("ssh")
    else
        log_success "SSH 已安装"
    fi
    
    if ! command -v scp &> /dev/null; then
        missing_tools+=("scp")
    else
        log_success "SCP 已安装"
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "缺少必要工具: ${missing_tools[*]}"
        echo ""
        log_info "安装指南:"
        
        for tool in "${missing_tools[@]}"; do
            case $tool in
                docker)
                    echo "  Docker: https://docs.docker.com/get-docker/"
                    ;;
                pnpm)
                    echo "  pnpm: npm install -g pnpm"
                    ;;
                ssh|scp)
                    echo "  SSH/SCP: 通常系统自带，或安装 openssh-client"
                    ;;
            esac
        done
        
        exit 1
    fi
    
    log_success "所有必要工具已安装"
}

# 创建配置文件
create_config_files() {
    log_step "创建配置文件..."
    
    # 创建 .env.production
    if [ ! -f ".env.production" ]; then
        if [ -f "env.production.example" ]; then
            cp env.production.example .env.production
            log_success "已创建 .env.production (基于示例文件)"
            log_warning "请编辑 .env.production 填入真实配置"
        else
            log_warning ".env.production 和示例文件都不存在"
        fi
    else
        log_info ".env.production 已存在，跳过创建"
    fi
    
    # 创建 scripts/config.sh
    if [ ! -f "scripts/config.sh" ]; then
        if [ -f "scripts/config.example.sh" ]; then
            cp scripts/config.example.sh scripts/config.sh
            log_success "已创建 scripts/config.sh (基于示例文件)"
            log_warning "请编辑 scripts/config.sh 填入真实配置"
        else
            log_warning "scripts/config.sh 和示例文件都不存在"
        fi
    else
        log_info "scripts/config.sh 已存在，跳过创建"
    fi
}

# 设置脚本权限
set_permissions() {
    log_step "设置脚本执行权限..."
    
    local scripts=(
        "scripts/local-build.sh"
        "scripts/local-push.sh"
        "scripts/remote-deploy.sh"
        "scripts/deploy-local.sh"
        "scripts/setup.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            log_success "已设置 $script 执行权限"
        else
            log_warning "$script 不存在"
        fi
    done
}

# 测试 Docker
test_docker() {
    log_step "测试 Docker 环境..."
    
    if ! docker info &> /dev/null; then
        log_error "Docker 服务未运行，请启动 Docker"
        exit 1
    fi
    
    log_success "Docker 服务正常运行"
    
    # 测试拉取镜像
    log_info "测试拉取基础镜像..."
    if docker pull node:20-alpine &> /dev/null; then
        log_success "Docker 镜像拉取正常"
    else
        log_warning "Docker 镜像拉取失败，可能网络问题"
    fi
}

# 安装项目依赖
install_dependencies() {
    log_step "安装项目依赖..."
    
    if [ -f "pnpm-lock.yaml" ]; then
        log_info "使用 pnpm 安装依赖..."
        if pnpm install --frozen-lockfile; then
            log_success "依赖安装完成"
        else
            log_warning "依赖安装失败，但不影响部署脚本使用"
        fi
    elif [ -f "package-lock.json" ]; then
        log_info "使用 npm 安装依赖..."
        if npm ci; then
            log_success "依赖安装完成"
        else
            log_warning "依赖安装失败，但不影响部署脚本使用"
        fi
    else
        log_warning "未找到锁定文件，跳过依赖安装"
    fi
}

# 配置向导
config_wizard() {
    if [ "$INTERACTIVE" != "true" ]; then
        return
    fi
    
    log_step "配置向导..."
    
    echo ""
    log_info "请提供以下配置信息 (按 Enter 使用默认值):"
    
    # GitHub 用户名
    read -p "GitHub 用户名 [$GHCR_OWNER]: " input_owner
    if [ -n "$input_owner" ]; then
        export GHCR_OWNER="$input_owner"
    fi
    
    # GitHub Token
    echo ""
    log_info "GitHub Personal Access Token (需要 write:packages 权限):"
    log_info "获取地址: https://github.com/settings/tokens"
    read -s -p "GitHub Token (可选，稍后也可设置): " input_token
    if [ -n "$input_token" ]; then
        export GITHUB_TOKEN="$input_token"
    fi
    echo ""
    
    # 远程服务器
    echo ""
    read -p "远程服务器地址 (IP 或域名，可选): " input_host
    if [ -n "$input_host" ]; then
        export REMOTE_HOST="$input_host"
    fi
    
    read -p "远程服务器用户名 [root]: " input_user
    if [ -n "$input_user" ]; then
        export REMOTE_USER="$input_user"
    else
        export REMOTE_USER="root"
    fi
    
    # 保存配置到文件
    if [ -n "$GHCR_OWNER" ] || [ -n "$GITHUB_TOKEN" ] || [ -n "$REMOTE_HOST" ]; then
        log_info "保存配置到 scripts/config.sh..."
        
        cat > scripts/config.sh << EOF
#!/bin/bash
# 自动生成的配置文件

export GHCR_OWNER="${GHCR_OWNER:-zhanglkx}"
export IMAGE_TAG="latest"
EOF
        
        if [ -n "$GITHUB_TOKEN" ]; then
            echo "export GITHUB_TOKEN=\"$GITHUB_TOKEN\"" >> scripts/config.sh
        fi
        
        if [ -n "$REMOTE_HOST" ]; then
            echo "export REMOTE_HOST=\"$REMOTE_HOST\"" >> scripts/config.sh
        fi
        
        if [ -n "$REMOTE_USER" ]; then
            echo "export REMOTE_USER=\"$REMOTE_USER\"" >> scripts/config.sh
        fi
        
        echo "export REMOTE_PATH=\"/opt/canary\"" >> scripts/config.sh
        echo "export NEXT_PUBLIC_API_URL=\"http://localhost:4000\"" >> scripts/config.sh
        
        log_success "配置已保存到 scripts/config.sh"
    fi
}

# 测试 SSH 连接
test_ssh_connection() {
    if [ -z "$REMOTE_HOST" ]; then
        log_info "未配置远程服务器，跳过 SSH 测试"
        return
    fi
    
    log_step "测试 SSH 连接..."
    
    local remote_user="${REMOTE_USER:-root}"
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$remote_user@$REMOTE_HOST" "echo 'SSH test successful'" &> /dev/null; then
        log_success "SSH 连接测试成功: $remote_user@$REMOTE_HOST"
    else
        log_warning "SSH 连接测试失败: $remote_user@$REMOTE_HOST"
        log_info "请确保:"
        log_info "  1. 服务器地址正确"
        log_info "  2. SSH 密钥已配置"
        log_info "  3. 服务器可访问"
        
        if [ "$INTERACTIVE" = "true" ]; then
            echo ""
            read -p "是否要配置 SSH 密钥? (y/N): " setup_ssh
            if [[ $setup_ssh =~ ^[Yy]$ ]]; then
                setup_ssh_key
            fi
        fi
    fi
}

# 设置 SSH 密钥
setup_ssh_key() {
    log_step "设置 SSH 密钥..."
    
    if [ ! -f "$HOME/.ssh/id_rsa.pub" ]; then
        log_info "生成 SSH 密钥..."
        read -p "请输入邮箱地址: " email
        ssh-keygen -t rsa -b 4096 -C "$email" -f "$HOME/.ssh/id_rsa" -N ""
        log_success "SSH 密钥已生成"
    fi
    
    log_info "公钥内容:"
    cat "$HOME/.ssh/id_rsa.pub"
    
    echo ""
    log_info "请将上面的公钥添加到远程服务器的 ~/.ssh/authorized_keys 文件中"
    log_info "或者运行以下命令:"
    log_info "  ssh-copy-id $REMOTE_USER@$REMOTE_HOST"
    
    read -p "按 Enter 继续..."
}

# 显示使用指南
show_usage_guide() {
    log_step "使用指南"
    
    echo ""
    log_info "设置完成！现在可以使用以下命令:"
    
    echo ""
    echo "  # 完整部署流程"
    if [ -f "scripts/config.sh" ]; then
        echo "  source scripts/config.sh && ./scripts/deploy-local.sh"
    else
        echo "  ./scripts/deploy-local.sh --host YOUR_SERVER_IP"
    fi
    
    echo ""
    echo "  # 预览执行步骤"
    echo "  ./scripts/deploy-local.sh --dry-run"
    
    echo ""
    echo "  # 分步执行"
    echo "  ./scripts/deploy-local.sh --build-only   # 仅构建"
    echo "  ./scripts/deploy-local.sh --push-only    # 仅推送"
    echo "  ./scripts/deploy-local.sh --deploy-only  # 仅部署"
    
    echo ""
    echo "  # 查看帮助"
    echo "  ./scripts/deploy-local.sh --help"
    
    echo ""
    log_info "配置文件:"
    log_info "  .env.production     - 应用环境配置"
    log_info "  scripts/config.sh   - 部署脚本配置"
    
    echo ""
    log_info "详细文档: scripts/README.md"
}

# 主函数
main() {
    show_banner
    
    log_info "开始设置部署环境..."
    log_info "时间: $(date)"
    
    check_requirements
    create_config_files
    set_permissions
    test_docker
    
    if [ "$SKIP_DEPS" != "true" ]; then
        install_dependencies
    fi
    
    config_wizard
    test_ssh_connection
    show_usage_guide
    
    log_separator
    log_success "环境设置完成！"
    log_separator
}

# 处理命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --interactive|-i)
            export INTERACTIVE=true
            shift
            ;;
        --skip-deps)
            export SKIP_DEPS=true
            shift
            ;;
        --owner)
            export GHCR_OWNER="$2"
            shift 2
            ;;
        --host)
            export REMOTE_HOST="$2"
            shift 2
            ;;
        --user)
            export REMOTE_USER="$2"
            shift 2
            ;;
        --help|-h)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  --interactive, -i  交互式配置"
            echo "  --skip-deps        跳过依赖安装"
            echo "  --owner OWNER      指定 GitHub 用户名"
            echo "  --host HOST        指定远程服务器地址"
            echo "  --user USER        指定远程服务器用户名"
            echo "  --help, -h         显示帮助信息"
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            exit 1
            ;;
    esac
done

# 执行主函数
main