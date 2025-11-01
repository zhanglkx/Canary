# 🚀 快速开始指南

## 项目简介

这是一个为 **GraphQL + NestJS + Next.js** 初学者设计的完整学习项目。

项目包含：
- ✅ GraphQL API 后端 (NestJS)
- ✅ React 前端 (Next.js)
- ✅ 完整的用户认证
- ✅ 待办事项管理
- ✅ 评论系统
- ✅ 标签系统（多对多关系）
- ✅ 搜索和过滤
- ✅ 统计和分析

所有代码都有**详细的中文注释**，非常适合初学者学习！

## 📋 前置要求

```bash
node --version  # >= 20
pnpm --version  # >= 9
```

## 🔧 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 启动数据库
```bash
# 使用 Docker
docker compose -f docker-compose.dev.yml up -d
```

### 3. 启动项目
```bash
# 同时启动前端和后端
pnpm dev

# 或分别启动：
# 终端 1
pnpm dev:api

# 终端 2  
pnpm dev:web
```

## 🌐 访问应用

- **前端**: http://localhost:3000
- **Apollo Studio** (GraphQL IDE): http://localhost:4000/apollo-studio
- **GraphQL API**: http://localhost:4000/graphql

## 📚 首先阅读

1. `CLAUDE.md` - 项目架构指南
2. `FEATURES.md` - 功能详解和学习路线

## 📝 核心 GraphQL 操作

### 注册
```graphql
mutation {
  register(registerInput: {
    email: "test@example.com"
    username: "testuser"
    password: "password123"
  }) {
    accessToken
    user { id email }
  }
}
```

### 创建待办事项
```graphql
mutation {
  createTodo(createTodoInput: {
    title: "学习 GraphQL"
    priority: HIGH
  }) {
    id title priority
  }
}
```

### 查询所有待办事项
```graphql
query {
  todos {
    id title completed priority
    tags { name }
    comments { content }
  }
}
```

### 搜索待办事项
```graphql
query {
  searchTodos(filter: {
    keyword: "项目"
    priority: HIGH
  }) {
    id title
  }
}
```

### 查看统计数据
```graphql
query {
  dashboard {
    todoStats {
      total completed completionPercentage
    }
    categoryStats {
      categoryName totalTodos
    }
  }
}
```

## 🧠 学习路线

**第 1 天**: GraphQL 基础和认证
**第 2 天**: CRUD 操作
**第 3 天**: 关系映射 (一对多、多对多)
**第 4 天**: 搜索、过滤、统计
**第 5 天**: 前端集成

详见 `FEATURES.md` 中的完整学习路线。

## ✨ 新增功能 (⭐ 标记)

- **Comment Module** - 评论/讨论功能
- **Tag Module** - 标签系统 (多对多关系)
- **Stats Module** - 统计和分析
- **Search Module** - 搜索和过滤

所有这些都展示了重要的学习概念！

## 📖 所有文件都有详细注释！

每个源文件都包含：
- 📌 文件功能说明
- 📌 类和方法的详细注释
- 📌 GraphQL 操作示例
- 📌 关键概念解释

## 🎉 开始学习吧！

打开 Apollo Studio，开始你的 GraphQL 学习之旅！
