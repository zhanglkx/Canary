#!/bin/bash

# SSH 密钥检查和修复脚本

set -e

SSH_KEY_PATH="$HOME/.ssh/aliyun_key.pem"

echo "=========================================="
echo "SSH 密钥检查和修复工具"
echo "=========================================="
echo ""

# 1. 检查密钥文件是否存在
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ 错误: 找不到 SSH 密钥文件: $SSH_KEY_PATH"
    exit 1
fi

echo "✓ 找到 SSH 密钥文件"
echo ""

# 2. 检查密钥文件权限
PERMS=$(stat -f "%Lp" "$SSH_KEY_PATH" 2>/dev/null || stat -c "%a" "$SSH_KEY_PATH" 2>/dev/null)
if [ "$PERMS" != "600" ]; then
    echo "⚠ 警告: 密钥权限不正确 (当前: $PERMS, 期望: 600)"
    echo "正在修复权限..."
    chmod 600 "$SSH_KEY_PATH"
    echo "✓ 权限已修复为 600"
else
    echo "✓ 密钥权限正确 (600)"
fi
echo ""

# 3. 检查密钥格式
echo "检查密钥格式..."
KEY_TYPE=$(head -1 "$SSH_KEY_PATH")

if [[ "$KEY_TYPE" == "-----BEGIN RSA PRIVATE KEY-----"* ]]; then
    echo "✓ 检测到 RSA 私钥 (传统 PEM 格式)"
    KEY_FORMAT="RSA"
elif [[ "$KEY_TYPE" == "-----BEGIN OPENSSH PRIVATE KEY-----"* ]]; then
    echo "✓ 检测到 OpenSSH 私钥格式"
    KEY_FORMAT="OPENSSH"
elif [[ "$KEY_TYPE" == "-----BEGIN PRIVATE KEY-----"* ]]; then
    echo "✓ 检测到 PKCS#8 私钥格式"
    KEY_FORMAT="PKCS8"
else
    echo "❌ 错误: 无法识别的密钥格式"
    echo "第一行内容: $KEY_TYPE"
    exit 1
fi
echo ""

# 4. 验证密钥有效性
echo "验证密钥有效性..."
if ssh-keygen -l -f "$SSH_KEY_PATH" >/dev/null 2>&1; then
    KEY_INFO=$(ssh-keygen -l -f "$SSH_KEY_PATH")
    echo "✓ 密钥有效: $KEY_INFO"
else
    echo "❌ 错误: 密钥格式无效或已损坏"
    echo ""
    echo "可能的原因："
    echo "1. 密钥文件包含额外的空格或换行符"
    echo "2. 密钥文件被截断或不完整"
    echo "3. 密钥需要密码解密"
    exit 1
fi
echo ""

# 5. 检查是否有换行符问题
echo "检查文件编码和换行符..."
if file "$SSH_KEY_PATH" | grep -q "CRLF"; then
    echo "⚠ 警告: 检测到 Windows 风格换行符 (CRLF)"
    echo "正在转换为 Unix 风格 (LF)..."
    
    # 创建备份
    cp "$SSH_KEY_PATH" "${SSH_KEY_PATH}.backup"
    
    # 转换换行符
    tr -d '\r' < "${SSH_KEY_PATH}.backup" > "$SSH_KEY_PATH"
    
    echo "✓ 换行符已转换"
    echo "  备份文件: ${SSH_KEY_PATH}.backup"
else
    echo "✓ 换行符格式正确"
fi
echo ""

# 6. 测试 SSH 连接
echo "=========================================="
echo "测试 SSH 连接到阿里云服务器"
echo "=========================================="
echo ""

ALIYUN_HOST="8.159.144.140"
echo "正在连接到: $ALIYUN_HOST"
echo ""

if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$ALIYUN_HOST "echo 'SSH 连接成功'" 2>/dev/null; then
    echo "✓ SSH 连接测试成功！"
else
    echo "❌ SSH 连接失败"
    echo ""
    echo "可能的原因："
    echo "1. 服务器防火墙阻止连接"
    echo "2. 密钥未添加到服务器的 authorized_keys"
    echo "3. 网络连接问题"
    echo ""
    echo "调试命令："
    echo "  ssh -vvv -i $SSH_KEY_PATH root@$ALIYUN_HOST"
fi
echo ""

# 7. 生成 GitHub Secret 内容
echo "=========================================="
echo "GitHub Secret 配置"
echo "=========================================="
echo ""
echo "如果需要重新配置 GitHub Secret (ALIYUN_SSH_KEY)，"
echo "请复制以下完整内容（包括开头和结尾标记）："
echo ""
echo "--- 开始复制 ---"
cat "$SSH_KEY_PATH"
echo "--- 结束复制 ---"
echo ""

echo "=========================================="
echo "检查完成"
echo "=========================================="
