# NestJS + GraphQL 学习指南

## 项目概述

这是一个现代化的全栈应用程序，展示了如何使用 NestJS 和 GraphQL 构建强大的 API，以及如何使用 Next.js 构建前端应用。

## 核心概念

### 1. NestJS 基础
- **模块化架构**: 每个功能都被封装在独立的模块中（参见 `apps/api/src/*/*.module.ts`）
- **依赖注入**: 使用装饰器和提供者管理依赖关系
- **装饰器**: 使用装饰器来声明模块、控制器、服务等

### 2. GraphQL 实现
- **Code First 方式**: 使用 TypeScript 装饰器自动生成 GraphQL schema
- **Resolver 模式**: 使用解析器处理查询和修改操作
- **类型安全**: 完整的类型定义和自动类型生成

### 3. 认证系统
- **JWT 认证**: 使用 JSON Web Tokens 进行用户认证
- **Guard 保护**: 使用守卫保护需要认证的路由
- **自定义装饰器**: 实现当前用户获取等功能

## 重要文件说明

### 后端 (apps/api/src/)
1. `app.module.ts` - 应用程序的根模块，包含全局配置
2. `todo/todo.resolver.ts` - GraphQL 解析器示例，展示查询和修改操作
3. `auth/auth.resolver.ts` - 认证系统实现
4. `*.entity.ts` - 数据库模型和 GraphQL 类型定义

### 前端 (apps/web/src/)
1. `lib/graphql/*.ts` - GraphQL 查询和修改定义
2. `lib/apollo-wrapper.tsx` - Apollo Client 配置
3. `app/**/page.tsx` - Next.js 页面组件

## GraphQL 使用示例

### 1. 查询操作
```graphql
# 获取待办事项列表
query {
  todos {
    id
    title
    completed
    category {
      name
    }
  }
}
```

### 2. 修改操作
```graphql
# 创建新待办事项
mutation {
  createTodo(createTodoInput: {
    title: "学习 GraphQL"
    description: "掌握查询和修改操作"
  }) {
    id
    title
  }
}
```

## 学习路径建议

1. 从 `app.module.ts` 开始，理解项目的总体架构
2. 研究 `todo.entity.ts` 和 `todo.resolver.ts`，了解 GraphQL 实现
3. 查看 `auth.resolver.ts`，学习认证系统的实现
4. 研究前端的 GraphQL 集成方式

## 开发工具

1. **Apollo Studio**: 访问 `/apollo-studio` 进行 API 测试
2. **GraphQL Playground**: 可通过配置启用，用于查询测试
3. **TypeScript**: 利用类型系统确保代码安全

## 最佳实践

1. 使用 Code First 方式定义 GraphQL schema
2. 保持模块的独立性和职责单一
3. 使用适当的装饰器和守卫保护路由
4. 利用 TypeScript 的类型系统
5. 保持代码的可测试性

## 进阶主题

1. 自定义装饰器的实现
2. GraphQL 订阅的使用
3. 数据加载优化
4. 错误处理最佳实践
5. 缓存策略

希望这个指南能帮助你更好地理解和使用这个项目！