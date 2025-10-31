import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TodoModule } from './todo/todo.module';
import { CategoryModule } from './category/category.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: {
        settings: {
          'editor.theme': 'dark',
          'editor.fontSize': 14,
          'editor.reuseHeaders': true,
          'request.credentials': 'include',
        },
        tabs: [
          {
            endpoint: '/graphql',
            query: `# 🚀 欢迎使用 GraphQL Playground!
# 这里是一些示例查询，帮助你开始使用 API

# 1. 获取当前用户信息 (需要先登录)
query GetMe {
  me {
    id
    email
    username
    createdAt
  }
}

# 2. 获取所有待办事项
query GetTodos {
  todos {
    id
    title
    description
    completed
    priority
    dueDate
    category {
      id
      name
      color
      icon
    }
    createdAt
  }
}

# 3. 获取所有分类
query GetCategories {
  categories {
    id
    name
    description
    color
    icon
    createdAt
  }
}

# 4. 获取分类统计
query GetCategoryStats {
  categoryStats {
    id
    name
    color
    icon
    todoCount
    completedCount
  }
}`,
            variables: '{}',
            headers: {
              'Content-Type': 'application/json',
            },
          },
          {
            endpoint: '/graphql',
            query: `# 🔐 用户认证相关操作

# 用户注册
mutation Register {
  register(registerInput: {
    email: "test@example.com"
    username: "testuser"
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

# 用户登录
mutation Login {
  login(loginInput: {
    email: "test@example.com"
    password: "password123"
  }) {
    accessToken
    user {
      id
      email
      username
    }
  }
}`,
            variables: '{}',
            headers: {
              'Content-Type': 'application/json',
            },
          },
          {
            endpoint: '/graphql',
            query: `# ✅ 待办事项管理

# 创建新的待办事项
mutation CreateTodo {
  createTodo(createTodoInput: {
    title: "学习 GraphQL"
    description: "深入了解 GraphQL 的使用方法"
    priority: HIGH
    dueDate: "2024-12-31T23:59:59.000Z"
    # categoryId: "your-category-id-here"
  }) {
    id
    title
    description
    completed
    priority
    dueDate
    category {
      id
      name
      color
      icon
    }
    createdAt
  }
}

# 更新待办事项
mutation UpdateTodo {
  updateTodo(
    id: "your-todo-id-here"
    updateTodoInput: {
      title: "已更新的标题"
      completed: true
      priority: MEDIUM
    }
  ) {
    id
    title
    completed
    priority
    updatedAt
  }
}

# 删除待办事项
mutation RemoveTodo {
  removeTodo(id: "your-todo-id-here")
}`,
            variables: '{}',
            headers: {
              'Content-Type': 'application/json',
            },
          },
          {
            endpoint: '/graphql',
            query: `# 📁 分类管理

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
    description
    color
    icon
    createdAt
  }
}

# 更新分类
mutation UpdateCategory {
  updateCategory(
    id: "your-category-id-here"
    updateCategoryInput: {
      name: "个人项目"
      color: "#10B981"
      icon: "🚀"
    }
  ) {
    id
    name
    color
    icon
    updatedAt
  }
}

# 删除分类
mutation RemoveCategory {
  removeCategory(id: "your-category-id-here")
}`,
            variables: '{}',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ],
      },
      introspection: true, // 启用内省，这样可以查看完整的 Schema
      context: ({ req, res }) => ({ req, res }),
      csrfPrevention: false, // 禁用 CSRF 保护以解决前端连接问题
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'learning_nest_next'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    TodoModule,
    CategoryModule,
  ],
})
export class AppModule {}
