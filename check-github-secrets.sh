#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${GREEN}GitHub Actions 部署配置检查工具${NC}              ${BLUE}║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
    echo ""
}

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

print_header

print_step "检查 GitHub Actions 部署配置"

print_info "根据错误日志分析，部署失败的原因是："
print_error "1. Error: missing server host - 缺少服务器地址"
print_error "2. Error: can't connect without a private SSH key or password - 缺少 SSH 密钥"

echo ""
print_step "需要在 GitHub 仓库中配置的 Secrets"

echo ""
echo -e "${YELLOW}必需的 GitHub Secrets：${NC}"
echo "┌─────────────────┬──────────────────────────────────────┐"
echo "│ Secret 名称     │ 描述                                 │"
echo "├─────────────────┼──────────────────────────────────────┤"
echo "│ DEPLOY_HOST     │ 服务器 IP 地址 (如: 8.159.144.140)  │"
echo "│ DEPLOY_USER     │ SSH 用户名 (如: root)                │"
echo "│ DEPLOY_KEY      │ SSH 私钥内容                         │"
echo "│ DEPLOY_PORT     │ SSH 端口 (可选，默认 22)             │"
echo "└─────────────────┴──────────────────────────────────────┘"

echo ""
print_step "配置步骤"

echo ""
print_info "1. 获取 SSH 私钥："
if [ -f ~/.ssh/aliyun_key.pem ]; then
    print_success "找到现有的 SSH 密钥文件: ~/.ssh/aliyun_key.pem"
    echo ""
    print_info "复制以下私钥内容到 GitHub Secret 'DEPLOY_KEY'："
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    cat ~/.ssh/aliyun_key.pem
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    print_warning "未找到 SSH 密钥文件 ~/.ssh/aliyun_key.pem"
    echo ""
    print_info "请运行以下命令查找 SSH 密钥："
    echo "  ls -la ~/.ssh/"
    echo ""
    print_info "或生成新的 SSH 密钥对："
    echo "  ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy_key -N \"\""
fi

echo ""
print_info "2. 在 GitHub 中添加 Secrets："
echo "   • 打开仓库 → Settings → Secrets and variables → Actions"
echo "   • 点击 'New repository secret'"
echo "   • 添加上述必需的 secrets"

echo ""
print_info "3. 测试 SSH 连接："
echo "   ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140"

echo ""
print_step "快速配置命令"

echo ""
print_info "如果你有服务器访问权限，可以运行："
echo ""
echo -e "${GREEN}# 测试 SSH 连接${NC}"
echo "ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140 'echo \"SSH 连接成功！\"'"
echo ""
echo -e "${GREEN}# 检查服务器环境${NC}"
echo "ssh -i ~/.ssh/aliyun_key.pem root@8.159.144.140 'ls -la /opt/canary/ && docker --version'"

echo ""
print_step "故障排除"

echo ""
print_warning "如果配置后仍然失败："
echo "1. 检查 SSH 密钥格式是否完整（包含 -----BEGIN 和 -----END 行）"
echo "2. 确保服务器 SSH 服务正常运行"
echo "3. 检查服务器防火墙设置"
echo "4. 验证 /opt/canary/ 目录存在且有正确权限"

echo ""
print_success "配置完成后，重新推送代码或手动触发 GitHub Actions 即可部署"

echo ""
print_info "详细配置指南请查看: setup-github-secrets-guide.md"