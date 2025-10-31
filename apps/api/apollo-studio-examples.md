# 现代化 GraphQL 开发环境使用指南

## 🚀 欢迎使用 Apollo Studio 风格的 GraphQL 界面！

现在你的 GraphQL API 使用了经过优化的 GraphQL Playground，配置为提供类似 Apollo Studio 的现代化开发体验。

## 📍 访问地址

访问 [http://localhost:4000/graphql](http://localhost:4000/graphql) 来使用 Apollo Studio。

## ✨ 现代化界面的优势

### 🎨 Apollo Studio 风格设计
- 深色主题，类似 Apollo Studio 的外观
- 优化的字体和字号设置
- 更好的语法高亮和代码格式化
- 专业的开发者体验

### 🔍 强大的查询功能
- 智能的 Schema 浏览器
- 实时的查询验证和错误提示
- 字段建议和自动补全
- 查询历史记录和状态保持

### 📚 丰富的示例和文档
- 预设的完整查询示例
- 详细的使用说明和注释
- 涵盖所有 API 功能的示例
- 最佳实践指导

### 🛠️ 开发者友好功能
- 预配置的认证示例
- 变量和头部管理
- 错误追踪和调试信息
- 性能监控和优化建议

## 🚀 快速开始

### 1. 用户认证

首先注册一个新用户：

```graphql
mutation RegisterUser {
  register(registerInput: {
    email: "user@example.com"
    username: "myusername"
    password: "password123"
  }) {
    accessToken
    user {
      id
      email
      username
    }
  }
}
```

### 2. 设置认证头

复制返回的 `accessToken`，然后在 Apollo Studio 的 Headers 面板中添加：

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

### 3. 开始查询

现在你可以执行需要认证的查询：

```graphql
query GetMyProfile {
  me {
    id
    email
    username
    createdAt
  }
}
```

## 📋 常用查询示例

### 待办事项管理

```graphql
# 获取所有待办事项
query GetTodos {
  todos {
    id
    title
    description
    completed
    priority
    dueDate
    category {
      name
      color
      icon
    }
  }
}

# 创建新待办事项
mutation CreateTodo {
  createTodo(createTodoInput: {
    title: "学习 Apollo Studio"
    description: "探索 Apollo Studio 的强大功能"
    priority: HIGH
    dueDate: "2024-12-31T23:59:59.000Z"
  }) {
    id
    title
    description
    priority
    createdAt
  }
}
```

### 分类管理

```graphql
# 获取所有分类
query GetCategories {
  categories {
    id
    name
    description
    color
    icon
    todos {
      id
      title
      completed
    }
  }
}

# 创建新分类
mutation CreateCategory {
  createCategory(createCategoryInput: {
    name: "工作"
    description: "工作相关的任务"
    color: "#3B82F6"
    icon: "💼"
  }) {
    id
    name
    color
    icon
  }
}
```

## 🎯 高级功能

### 复杂嵌套查询

```graphql
query UserDashboard {
  me {
    id
    username
    email
  }
  
  todos {
    id
    title
    completed
    priority
    category {
      name
      color
    }
  }
  
  categoryStats {
    name
    todoCount
    completedCount
  }
}
```

### 使用变量

```graphql
query GetTodoById($todoId: ID!) {
  todo(id: $todoId) {
    id
    title
    description
    completed
    priority
    dueDate
    category {
      name
      color
      icon
    }
  }
}
```

变量：
```json
{
  "todoId": "your-todo-id-here"
}
```

## 💡 使用提示

1. **利用自动补全**：在输入查询时，Apollo Studio 会提供智能建议
2. **查看文档**：点击右侧的文档面板查看完整的 Schema 信息
3. **保存查询**：使用浏览器书签保存常用查询
4. **使用变量**：对于动态查询，使用变量而不是硬编码值
5. **查看错误**：Apollo Studio 提供详细的错误信息和建议

## 🔧 故障排除

### 认证问题
- 确保在 Headers 中正确设置了 Authorization token
- 检查 token 是否过期（默认有效期 1 天）
- 重新登录获取新的 token

### 查询错误
- 检查字段名称和类型是否正确
- 使用 Schema 浏览器确认可用字段
- 查看错误消息中的具体建议

### 网络问题
- 确保 API 服务器正在运行（http://localhost:4000）
- 检查浏览器控制台是否有网络错误
- 验证 CORS 设置是否正确

## 🌟 享受开发体验！

Apollo Studio 提供了现代化的 GraphQL 开发体验。探索其强大的功能，提高你的开发效率！

如果你需要更多帮助，请查看 [Apollo Studio 官方文档](https://studio.apollographql.com/docs/)。
