# 快速开始指南（5 分钟上手）

## 前置要求

- **Node.js**: 20.x 或更高版本
- **pnpm**: 9.15+ （或使用 npm/yarn）
- **Git**: 用于版本控制

### 检查已安装版本

```bash
node --version      # 应该是 v20.x 或更高
pnpm --version      # 应该是 9.15 或更高
```

---

## 第 1 步：克隆和安装（1 分钟）

```bash
# 1. 进入项目目录
cd /path/to/Canary

# 2. 安装依赖
pnpm install

# 3. 等待安装完成（首次可能需要 2-3 分钟）
```

---

## 第 2 步：启动开发服务器（1 分钟）

```bash
# 一个命令启动前后端
pnpm dev

# 输出应该显示:
# ▲ Next.js 16.1.0
# - local:        http://localhost:3000
# [Nest] 20  12/20 10:00:00     LOG [NestFactory] Application initialized
# - Backend:      http://localhost:4000
```

---

## 第 3 步：打开浏览器（1 分钟）

| 地址 | 说明 |
|------|------|
| `http://localhost:3000` | 前端（Next.js） |
| `http://localhost:4000/api/health` | 后端健康检查 |
| `http://localhost:4000/api/docs` | API 文档（Swagger） |

---

## 第 4 步：测试 API（2 分钟）

### 使用 REST Client (VS Code) 测试

1. 在 VS Code 中创建文件 `test.http`
2. 粘贴以下内容:

```http
### 健康检查
GET http://localhost:4000/api/health

### 注册用户
POST http://localhost:4000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Test User",
  "password": "TestPass123!"
}

### 登录（使用上面注册的邮箱密码）
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass123!"
}
```

3. 点击 "Send Request" 发送请求

### 使用 Swagger UI 测试

直接打开 `http://localhost:4000/api/docs`，在浏览器中点击 "Try it out" 按钮测试 API。

---

## 常见问题

### 端口已被占用？

```bash
# 找到占用端口的进程
lsof -i :3000    # 前端端口
lsof -i :4000    # 后端端口

# 关闭进程
kill -9 <PID>
```

### 依赖安装出错？

```bash
# 清空缓存重新安装
pnpm run clean
pnpm install
```

### 数据库问题？

```bash
# 删除旧的数据库文件
rm apps/backend/db.sqlite

# 重新启动后端，会自动创建新数据库
pnpm -F @canary/backend dev
```

---

## 下一步

- 📖 阅读 [学习路线](../guides/LEARNING_GUIDE.md) 了解项目结构
- 🔧 查看 [安装与配置](./INSTALLATION.md) 获取详细设置说明
- 📡 查看 [API 文档](../api/endpoints.md) 了解所有可用的接口
- 🎓 查看 [概念解释](../guides/CONCEPTS.md) 理解核心概念

---

## 个别命令

```bash
# 只运行前端
pnpm -F @canary/frontend dev

# 只运行后端
pnpm -F @canary/backend dev

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm run type-check

# 构建生产版本
pnpm build

# 清理所有生成文件
pnpm run clean
```

---

**预计时间**: 5-10 分钟

**如需更详细的说明，请查看**:
- [安装与配置](./INSTALLATION.md)
- [故障排除](./TROUBLESHOOTING.md)
