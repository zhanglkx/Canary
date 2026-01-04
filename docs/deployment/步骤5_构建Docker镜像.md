# 步骤 5：构建 Docker 镜像

时间：2025-11-16  
执行人：我  
目标：在服务器上使用 Docker Compose 构建应用的 Docker 镜像

## 为什么要做这一步

1. **构建容器镜像**：将应用代码打包成 Docker 镜像
2. **多阶段构建**：优化镜像大小，只包含运行时需要的文件
3. **准备部署**：构建完成后才能启动容器

## 命令/操作

### 1. 进入项目目录并构建镜像

```bash
# 在服务器上执行（确保已 SSH 连接）
cd /root/canary

# 查看 docker-compose.prod.yml 配置
cat docker-compose.prod.yml | grep -A 5 "build:"

# 开始构建（这个过程可能需要 5-15 分钟）
docker-compose -f docker-compose.prod.yml build

# 如果需要强制重新构建（不使用缓存）
# docker-compose -f docker-compose.prod.yml build --no-cache
```

### 2. 监控构建进度

构建过程会显示：
- 下载基础镜像（node:20-alpine）
- 安装 pnpm 依赖
- 编译 TypeScript 代码
- 构建 Next.js 应用
- 创建生产镜像

### 3. 验证构建结果

```bash
# 查看构建的镜像
docker images | grep canary

# 查看镜像详情
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep -E "REPOSITORY|canary"

# 查看 Docker 磁盘使用
docker system df
```

## 预期结果

### 构建成功
```
Successfully built [image-id]
Successfully tagged canary-api-prod:latest
Successfully tagged canary-web-prod:latest
```

### 镜像列表
```
REPOSITORY         TAG       SIZE       CREATED
canary-web-prod    latest    ~200-400MB  刚刚
canary-api-prod    latest    ~200-400MB  刚刚
postgres           16-alpine ~275MB      (已存在)
nginx              alpine    ~53MB       (已存在)
```

### 验证标准
- ✅ API 镜像构建成功（canary-api-prod）
- ✅ Web 镜像构建成功（canary-web-prod）
- ✅ 没有构建错误
- ✅ 镜像大小合理（< 500MB）

## 实际结果

### ✅ 构建成功

**镜像列表**：
```
REPOSITORY    TAG       SIZE      CREATED AT
canary-api    latest    397MB     2025-11-16 14:10:20 +0800 CST
canary-web    latest    912MB     2025-11-16 13:52:54 +0800 CST
```

**构建时间**：
- API: ~10 分钟
- Web: ~15 分钟（含 Next.js 构建）
- 总计: ~25 分钟

### 📊 镜像大小分析
- **API (397MB)**: 合理，包含 NestJS + 依赖
- **Web (912MB)**: 稍大，包含 Next.js + React + 所有依赖

## 碰到的问题

### 1. **网络超时问题**
- npm registry 下载失败
- Alpine 包下载超时

### 2. **sqlite3 编译失败**
- 缺少 Python 环境
- Python 3.12 缺少 distutils 模块

### 3. **内存不足**
- 服务器 1.8GB 内存，并行构建导致 OOM
- Web 构建时突然退出

## 解决方式

### 1. **配置国内镜像源**
```dockerfile
# Alpine 镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# npm 镜像源
RUN pnpm config set registry https://registry.npmmirror.com
```

### 2. **安装编译依赖**
```dockerfile
RUN apk add --no-cache python3 py3-setuptools make g++
```

### 3. **添加 Swap 和分步构建**
```bash
# 添加 2GB swap
sudo fallocate -l 2G /swapfile
sudo swapon /swapfile

# 分别构建，避免并行
docker-compose -f docker-compose.prod.yml build api
docker-compose -f docker-compose.prod.yml build web
```

### 关键经验
- ✅ 使用国内镜像源至关重要（速度提升 10 倍以上）
- ✅ Alpine Linux 需要安装完整的编译工具链
- ✅ 小内存服务器建议分步构建，避免 OOM

### 常见问题解决方案

1. **内存不足**：
   ```bash
   # 查看内存使用
   free -h
   
   # 如果内存不足，可以添加 swap
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   ```

2. **网络超时**：
   - 已配置 Docker 镜像加速，应该不会有问题
   - 如果依然超时，可以多试几次

3. **磁盘空间不足**：
   ```bash
   # 清理旧镜像
   docker system prune -a
   ```

## 下一步展望

镜像构建完成后，使用 Docker Compose 启动所有服务容器（PostgreSQL、API、Web、Nginx）。
