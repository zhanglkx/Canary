# GraphQL 与 NestJS 详细教程

## 目录
1. [GraphQL 基础概念](#graphql-基础概念)
2. [在 NestJS 中使用 GraphQL](#在-nestjs-中使用-graphql)
3. [Code First vs Schema First](#code-first-vs-schema-first)
4. [实际应用示例](#实际应用示例)
5. [最佳实践](#最佳实践)

## GraphQL 基础概念

### 什么是 GraphQL？

GraphQL 是一种用于 API 的查询语言，它允许客户端精确地获取所需的数据。与传统的 REST API 相比，GraphQL 提供了以下优势：

- **按需获取数据**：客户端可以精确指定需要哪些字段
- **单个请求获取关联数据**：避免多次请求
- **类型系统**：提供自动完成和类型检查
- **实时更新**：通过 Subscription 支持实时数据

### 核心概念

1. **Query（查询）**
```graphql
query {
  todos {
    id
    title
    category {
      name
    }
  }
}
```

2. **Mutation（修改）**
```graphql
mutation {
  createTodo(createTodoInput: {
    title: "学习 GraphQL"
    description: "掌握基础知识"
  }) {
    id
    title
  }
}
```

3. **Type（类型）**
```graphql
type Todo {
  id: ID!
  title: String!
  completed: Boolean
  category: Category
}
```

## 在 NestJS 中使用 GraphQL

### 设置过程

1. **安装依赖**
```bash
npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express
```

2. **配置 GraphQL 模块**
```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
})
```

3. **创建 Resolver**
```typescript
@Resolver(() => Todo)
export class TodoResolver {
  @Query(() => [Todo])
  async todos() {
    return this.todoService.findAll();
  }
}
```

### 装饰器说明

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| @ObjectType() | 定义 GraphQL 类型 | @ObjectType()<br>export class Todo |
| @Field() | 定义类型的字段 | @Field()<br>title: string; |
| @Query() | 定义查询方法 | @Query(() => [Todo])<br>todos() |
| @Mutation() | 定义修改方法 | @Mutation(() => Todo)<br>createTodo() |
| @Args() | 接收参数 | @Args('id') id: string |

## Code First vs Schema First

### Code First 方式（本项目采用）

在 TypeScript 中使用装饰器定义 schema：

```typescript
@ObjectType()
export class Todo {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => Boolean, { defaultValue: false })
  completed: boolean;
}
```

优点：
- 类型安全
- 更好的 IDE 支持
- 代码即文档
- 自动生成 schema

### Schema First 方式

先定义 GraphQL schema：

```graphql
type Todo {
  id: ID!
  title: String!
  completed: Boolean
}
```

然后实现对应的类：

```typescript
export class Todo {
  id: string;
  title: string;
  completed: boolean;
}
```

## 实际应用示例

### 1. 创建实体

```typescript
// todo.entity.ts
@ObjectType()
@Entity('todos')
export class Todo {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;
}
```

### 2. 创建输入类型

```typescript
// create-todo.input.ts
@InputType()
export class CreateTodoInput {
  @Field()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  description?: string;
}
```

### 3. 实现 Resolver

```typescript
// todo.resolver.ts
@Resolver(() => Todo)
export class TodoResolver {
  @Query(() => [Todo])
  async todos(@CurrentUser() user: User) {
    return this.todoService.findAll(user.id);
  }

  @Mutation(() => Todo)
  async createTodo(
    @Args('createTodoInput') input: CreateTodoInput,
    @CurrentUser() user: User,
  ) {
    return this.todoService.create(input, user.id);
  }
}
```

## 最佳实践

### 1. 类型安全

- 使用 TypeScript 装饰器
- 定义明确的输入类型
- 利用 class-validator 进行验证

### 2. 性能优化

- 使用 DataLoader 处理 N+1 问题
- 实现字段级别的权限控制
- 合理使用缓存

### 3. 错误处理

```typescript
@Catch()
export class GraphQLErrorFilter implements GqlExceptionFilter {
  catch(exception: any) {
    return new GraphQLError(exception.message);
  }
}
```

### 4. 测试

```typescript
describe('TodoResolver', () => {
  it('should create todo', async () => {
    const result = await resolver.createTodo(
      { title: 'Test Todo' },
      mockUser,
    );
    expect(result.title).toBe('Test Todo');
  });
});
```

## 前端集成

### 1. Apollo Client 设置

```typescript
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
});
```

### 2. 使用 Hooks

```typescript
const { data, loading } = useQuery(GET_TODOS);
const [createTodo] = useMutation(CREATE_TODO);
```

## 进阶主题

1. **自定义标量类型**
2. **复杂查询优化**
3. **实时订阅**
4. **批处理请求**
5. **缓存策略**

## 调试技巧

1. **使用 Apollo Studio**
   - 访问 `/apollo-studio` 进行调试
   - 测试查询和修改
   - 查看 schema 文档

2. **日志和监控**
   - 使用 Apollo Plugin 记录查询性能
   - 监控慢查询
   - 分析查询模式

## 常见问题解决

1. **N+1 查询问题**
2. **认证和授权**
3. **错误处理**
4. **性能优化**
5. **缓存策略**

希望这个指南能帮助你更好地理解 GraphQL 和 NestJS 的结合使用！