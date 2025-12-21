# 步骤 2：安装 Docker 环境

时间：2025-11-16  
执行人：我  
目标：检查并清理旧容器，安装 Docker Compose，配置 Docker 镜像加速

## 为什么要做这一步

1. **Docker 已安装但需要 Docker Compose**：用于管理多容器应用
2. **清理旧容器**：端口 5432 被占用，可能会与新部署冲突
3. **配置镜像加速**：加快后续镜像拉取速度

## 命令/操作

### 1. 检查并清理旧的 Docker 容器

```bash
# 查看正在运行的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 停止所有运行中的容器（如果有）
docker stop $(docker ps -q) 2>/dev/null || echo "没有运行中的容器"

# 删除所有容器（如果需要全新开始）
docker rm $(docker ps -aq) 2>/dev/null || echo "没有容器需要删除"

# 查看 Docker 镜像
docker images

# （可选）清理未使用的镜像、容器、网络
docker system prune -a --volumes -f
```

⚠️ **注意**：`docker system prune -a --volumes -f` 会删除所有未使用的资源，包括数据卷。如果有重要数据，请先备份。

### 2. 安装 Docker Compose

Alibaba Cloud Linux 3（基于 RHEL 8）推荐使用官方二进制文件安装：

```bash
# 下载最新版本的 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 如果 GitHub 下载慢，可以使用国内镜像
# curl -L "https://get.daocloud.io/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 创建软链接（方便使用）
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# 验证安装
docker-compose --version
```

### 3. 配置 Docker 镜像加速器（阿里云）

```bash
# 创建 Docker 配置目录
mkdir -p /etc/docker

# 配置阿里云镜像加速
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://99e0hvuv.mirror.aliyuncs.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://mirror.ccs.tencentyun.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# 重启 Docker 服务
systemctl daemon-reload
systemctl restart docker

# 验证配置
docker info | grep -A 5 "Registry Mirrors"

# 检查 Docker 服务状态
systemctl status docker
```

### 4. 验证 Docker 环境

```bash
# 测试 Docker
docker run --rm hello-world

# 测试 Docker Compose
docker-compose version

# 查看 Docker 信息
docker info | head -20
```

## 预期结果

### Docker Compose 安装成功
```
Docker Compose version v2.x.x
```

### 旧容器清理完成
```
docker ps          # 应该显示空列表或只有必要的容器
netstat -tulpn | grep 5432  # 端口 5432 应该不再被占用
```

### 镜像加速配置成功
```
Registry Mirrors:
 https://99e0hvuv.mirror.aliyuncs.com/
 https://docker.mirrors.ustc.edu.cn/
 https://mirror.ccs.tencentyun.com/
```

## 实际结果

### ✅ 旧容器清理成功
- 停止并删除了旧的 PostgreSQL 容器（canary-db-prod）
- 所有端口已释放（✅ 所需端口都已释放）

### ✅ Docker Compose 安装成功
- 系统已有 Docker Compose v2.27.0（插件版本）
- 创建了 wrapper 脚本，`docker-compose` 和 `docker compose` 两种命令都可用

### ✅ Docker 镜像加速器配置
- 已有多个镜像加速源配置（12 个镜像源）
- Docker 服务重启成功

### ✅ 环境验证成功
- `hello-world` 测试通过 ✅
- Docker Compose 版本：v2.27.0 ✅
- 所有所需端口（80, 443, 3000, 4000, 5432）已释放 ✅

### 📊 Docker 资源状态
```
Images: 6 个（1.604GB）
Containers: 0 个（已清空）
Volumes: 1 个（47.75MB，可回收）
Build Cache: 8.756MB
```

## 碰到的问题

1. **GitHub 下载 Docker Compose 失败**：
   - DaoCloud 镜像源连接被拒绝
   - GitHub 官方源下载中断（60MB 剩余未下载）
   
2. **下载不完整导致段错误**：
   - 不完整的二进制文件导致 `Segmentation fault`

## 解决方式

1. **发现系统已安装 Docker Compose v2.27.0 插件版本**
2. **创建 wrapper 脚本**：
   ```bash
   cat > /usr/local/bin/docker-compose <<'EOF'
   #!/bin/bash
   docker compose "$@"
   EOF
   chmod +x /usr/local/bin/docker-compose
   ```
3. **清理损坏的下载文件**
4. **验证两种命令方式都可用**

## 下一步展望

Docker 环境配置完成，所有旧容器已清理，端口已释放。下一步在本地准备生产环境配置文件（.env.production 和 nginx.prod.conf），然后打包上传代码到服务器。
