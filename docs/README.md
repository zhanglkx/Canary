# 📚 Canary 学习项目 - 文档中心

这是一个**最小化全栈学习项目**，帮助后端初学者理解现代全栈开发的核心概念。

## 📖 文档导航

### 🚀 快速开始
- **[快速开始指南](./guides/GETTING_STARTED.md)** - 5分钟上手项目
- **[安装与配置](./setup/INSTALLATION.md)** - 详细的安装步骤
- **[故障排除](./setup/TROUBLESHOOTING.md)** - 常见问题解决方案

### 📡 API 文档
- **[API 端点列表](./api/endpoints.md)** - 所有 API 端点完整文档
- **[认证说明](./api/authentication.md)** - JWT 认证流程
- **[API 调用示例](./api/examples.md)** - cURL, REST Client, Postman 示例

### 🔧 后端开发
- **[后端架构说明](./backend/architecture.md)** - NestJS 模块化架构详解
- **[模块说明](./backend/modules.md)** - Auth、Users、Health 各模块解析
- **[数据库配置](./backend/database.md)** - TypeORM 和 SQLite 配置
- **[后端开发指南](./backend/DEVELOPMENT.md)** - 开发技巧和最佳实践

### 🎨 前端开发
- **[前端架构说明](./frontend/architecture.md)** - Next.js 16 App Router 使用
- **[页面与组件](./frontend/pages-components.md)** - 前端文件结构
- **[样式指南](./frontend/styling.md)** - CSS Modules 使用方法
- **[前端开发指南](./frontend/DEVELOPMENT.md)** - 前端开发技巧

### 🚀 部署与上线
- **[本地开发设置](./deployment/local-development.md)** - 本地开发环境
- **[Docker 部署](./deployment/docker.md)** - Docker 和 Docker Compose
- **[生产部署](./deployment/production.md)** - 上线前清单和部署步骤

### 🗂️ 项目结构
- **[项目结构](./PROJECT_STRUCTURE.md)** - 完整的文件树和目录说明
- **[技术栈](./TECH_STACK.md)** - 所有技术和版本信息

### 📚 学习资源
- **[学习路线](./guides/LEARNING_GUIDE.md)** - 为初学者设计的学习路线
- **[概念解释](./guides/CONCEPTS.md)** - REST API, JWT, 模块化等概念
- **[推荐资源](./guides/RESOURCES.md)** - 外部学习资源链接

### ✅ 参考清单
- **[生成清单](./CHECKLIST.md)** - 项目生成验证清单

---

## 🎯 按角色快速查找

### 🟢 我是完全新手，想快速上手
1. 阅读 [快速开始指南](./guides/GETTING_STARTED.md)
2. 运行 `pnpm install && pnpm dev`
3. 查看 [学习路线](./guides/LEARNING_GUIDE.md)

### 🟡 我想理解后端如何工作
1. 了解 [后端架构](./backend/architecture.md)
2. 查看 [模块说明](./backend/modules.md)
3. 阅读 [API 端点文档](./api/endpoints.md)

### 🟠 我想开发新功能
1. 查看 [后端开发指南](./backend/DEVELOPMENT.md)
2. 参考 [API 端点列表](./api/endpoints.md)
3. 查看现有代码注释

### 🔵 我想部署到生产环境
1. 阅读 [生产部署](./deployment/production.md)
2. 查看 [Docker 部署](./deployment/docker.md)

---

## 📊 项目统计

| 类别 | 数量 |
|------|------|
| API 端点 | 5 个 |
| 后端模块 | 3 个 |
| 前端页面 | 3 个 |
| 数据库表 | 1 个 |
| 共享库 | 2 个 |

---

## 🚀 当前 MVP 功能

✅ **用户认证** - 注册和登录
✅ **用户管理** - 查看、创建、更新、删除用户
✅ **JWT 验证** - 安全的 Token 管理
✅ **API 文档** - Swagger 自动生成

---

## 📝 后续计划

完整的功能规划请查看 [学习路线](./guides/LEARNING_GUIDE.md)，包括：
- 第一阶段：用户管理完整化
- 第二阶段：安全性增强
- 第三阶段：数据验证
- 第四阶段：业务功能
- 第五阶段：文件与媒体
- 第六阶段：高级功能

---

## 🎓 主要学习点

1. **什么是前后端分离** - 理解 REST API
2. **如何设计 RESTful API** - HTTP 方法、状态码、错误处理
3. **如何实现用户认证** - JWT token、中间件、权限验证
4. **如何组织后端代码** - 模块化架构、职责分离
5. **如何使用数据库** - TypeORM、Entity、基本 CRUD

---

## 📞 需要帮助？

- 查看 [故障排除](./setup/TROUBLESHOOTING.md)
- 阅读 [概念解释](./guides/CONCEPTS.md)
- 查看代码中的详细注释

---

**最后更新**: 2025-12-20
**项目级别**: 🟢 初级学习项目
**代码复杂度**: 🟢 最小化（便于学习）
