# NestJS 后端架构学习指南

这是一份深度学习文档，帮助你理解 NestJS 后端服务的完整架构和各个组件的作用。

## 🏗️ 整体架构概览

```
请求进入
   ↓
Main.ts (应用启动入口)
   ↓
AppModule (根模块 - 管理所有子模块)
   ↓
[Feature Modules] (功能模块)
├─ AuthModule
├─ UserModule
├─ TodoModule
├─ CategoryModule
├─ CommentModule
├─ TagModule
├─ SearchModule
└─ StatsModule
   ↓
Module 内部结构
├─ Controller/Resolver (处理请求入口)
├─ Service (业务逻辑层)
├─ Entity (数据库模型)
├─ DTO (数据验证)
├─ Guards/Decorators (权限控制)
└─ Repository (数据访问层)
   ↓
TypeORM + PostgreSQL (数据库)
   ↓
返回响应
```

---

## 📌 核心概念详解

### 1. **main.ts - 应用启动入口**

**位置**: `apps/api/src/main.ts`

**作用**:
- 应用程序的入口点
- 创建 NestJS 应用实例
- 配置全局设置
- 启动监听服务器

**示例结构**:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局设置
  app.useGlobalPipes(new ValidationPipe());  // 全局验证管道
  app.enableCors({ origin: 'http://localhost:3000' });  // CORS 配置

  // GraphQL 配置
  // (通常在 AppModule 中通过 GraphQLModule.forRoot() 配置)

  await app.listen(process.env.PORT || 4000);
  console.log(`Server running on http://localhost:${process.env.PORT || 4000}`);
}

bootstrap();
```

**关键概念**:
- **Pipe**: 数据转换和验证（如 ValidationPipe）
- **CORS**: 跨域资源共享配置
- **listen**: 启动服务器并监听指定端口

---

### 2. **Module (模块) - NestJS 的组织单位**

**位置**: `apps/api/src/[feature]/[feature].module.ts`

**作用**:
- 模块是 NestJS 应用的基本组织单位
- 将相关的 Controller、Service、Entity 组织在一起
- 定义依赖注入的作用域
- 支持功能的隔离和重用

**示例 - TodoModule**:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TodoService } from './todo.service';
import { TodoResolver } from './todo.resolver';
import { Todo } from './entities/todo.entity';
import { Category } from '../category/entities/category.entity';

@Module({
  // imports: 导入其他模块或第三方模块
  imports: [
    TypeOrmModule.forFeature([Todo, Category]),  // 注册 Entity
  ],

  // providers: 定义服务、策略等（这些会被注入到其他地方）
  providers: [
    TodoService,      // 业务逻辑服务
    TodoResolver,     // GraphQL 解析器
  ],

  // controllers: 定义控制器（通常在 REST API 中使用）
  // 在本项目中使用 GraphQL 所以用 Resolver 代替

  // exports: 导出模块中的服务给其他模块使用
  exports: [TodoService],
})
export class TodoModule {}
```

**模块生命周期**:
```
Module 被导入
   ↓
providers 中的服务被实例化
   ↓
providers 可以被注入到 Resolver/Controller
   ↓
Resolver/Controller 处理请求
   ↓
Service 执行业务逻辑
   ↓
返回结果
```

**AppModule (根模块) 示例**:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TodoModule } from './todo/todo.module';
// ... 其他模块

@Module({
  imports: [
    // 数据库配置
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',  // 开发模式自动同步
    }),

    // GraphQL 配置
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',  // 自动生成 schema 文件
      context: ({ req }) => ({ req }),  // 将请求对象传到 resolver
    }),

    // 功能模块（所有子模块都在这里导入）
    AuthModule,
    UserModule,
    TodoModule,
    CategoryModule,
    CommentModule,
    TagModule,
    SearchModule,
    StatsModule,
  ],
})
export class AppModule {}
```

---

### 3. **Resolver - GraphQL 的请求处理器**

**位置**: `apps/api/src/[feature]/[feature].resolver.ts`

**作用**:
- GraphQL 的"Controller"（处理 Query 和 Mutation）
- 定义 GraphQL 的入口点
- 进行权限检查和参数验证
- 调用 Service 执行业务逻辑

**核心概念**:
- **@Query()**: 查询操作（读取数据）
- **@Mutation()**: 修改操作（创建/更新/删除数据）
- **@Resolver()**: 标记为 GraphQL 解析器
- **@Args()**: 获取查询参数
- **@CurrentUser()**: 获取当前认证用户

**示例 - TodoResolver**:
```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { TodoService } from './todo.service';
import { Todo } from './entities/todo.entity';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Resolver(() => Todo)
export class TodoResolver {
  constructor(private todoService: TodoService) {}

  // ========== Query (读取操作) ==========

  /**
   * 查询当前用户的所有待办事项
   *
   * @returns 当前用户的 Todo 列表
   */
  @Query(() => [Todo])
  @UseGuards(GqlAuthGuard)  // 需要认证
  async todos(@CurrentUser() user: User): Promise<Todo[]> {
    // 调用 Service 获取数据
    return this.todoService.findByUser(user.id);
  }

  /**
   * 获取单个待办事项详情
   *
   * @param id - 待办事项 ID
   * @returns 待办事项详情
   */
  @Query(() => Todo, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async todo(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Todo | null> {
    return this.todoService.findById(id, user.id);
  }

  // ========== Mutation (写入操作) ==========

  /**
   * 创建新的待办事项
   *
   * @param createTodoInput - 创建 Todo 的输入数据
   * @param user - 当前认证用户
   * @returns 创建后的 Todo 对象
   */
  @Mutation(() => Todo)
  @UseGuards(GqlAuthGuard)  // 需要认证
  async createTodo(
    @Args('createTodoInput') createTodoInput: CreateTodoInput,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    return this.todoService.create(createTodoInput, user);
  }

  /**
   * 更新待办事项
   *
   * @param id - 待办事项 ID
   * @param updateTodoInput - 更新数据
   * @param user - 当前认证用户
   * @returns 更新后的 Todo 对象
   */
  @Mutation(() => Todo)
  @UseGuards(GqlAuthGuard)
  async updateTodo(
    @Args('id') id: string,
    @Args('updateTodoInput') updateTodoInput: UpdateTodoInput,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    return this.todoService.update(id, updateTodoInput, user);
  }

  /**
   * 删除待办事项
   *
   * @param id - 待办事项 ID
   * @param user - 当前认证用户
   * @returns 删除的 Todo 对象
   */
  @Mutation(() => Todo)
  @UseGuards(GqlAuthGuard)
  async deleteTodo(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    return this.todoService.delete(id, user);
  }
}
```

**对比：REST vs GraphQL**

| 项目 | REST | GraphQL |
|------|------|---------|
| 处理器 | Controller | Resolver |
| 查询 | GET /todos | Query todos { ... } |
| 创建 | POST /todos | Mutation createTodo |
| 修改 | PUT /todos/:id | Mutation updateTodo |
| 删除 | DELETE /todos/:id | Mutation deleteTodo |
| 参数 | @Param, @Query, @Body | @Args |

---

### 4. **Entity - 数据库模型和 GraphQL 类型的融合**

**位置**: `apps/api/src/[feature]/entities/[feature].entity.ts`

**作用**:
- 定义数据库表结构（TypeORM Entity）
- 同时定义 GraphQL 类型（@ObjectType）
- 一个类同时服务于两个目的

**核心装饰器**:

| 装饰器 | 来源 | 用途 |
|--------|------|------|
| @Entity() | TypeORM | 定义数据库表 |
| @ObjectType() | GraphQL | 定义 GraphQL 类型 |
| @PrimaryGeneratedColumn() | TypeORM | 主键 |
| @Field() | GraphQL | 定义 GraphQL 字段 |
| @Column() | TypeORM | 定义表列 |
| @OneToMany() / @ManyToOne() | TypeORM | 一对多关系 |
| @ManyToMany() / @JoinTable() | TypeORM | 多对多关系 |

**示例 - Todo Entity**:
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ObjectType, Field, ID, Enum } from '@nestjs/graphql';

/**
 * Todo 实体 - 同时用于数据库映射和 GraphQL 类型定义
 *
 * 这是 NestJS 的强大特性：一个类同时处理：
 * 1. 数据库表的定义和映射（TypeORM）
 * 2. GraphQL API 的类型定义（NestJS GraphQL）
 *
 * 优点：
 * - DRY 原则（Don't Repeat Yourself）
 * - 类型安全（TypeScript）
 * - 易于维护（修改一处即可）
 */
@Entity('todos')  // TypeORM: 定义数据库表名
@ObjectType()  // GraphQL: 定义 GraphQL 对象类型
export class Todo {
  /**
   * 待办事项 ID - UUID 主键
   *
   * @PrimaryGeneratedColumn('uuid') - TypeORM: 自动生成 UUID 主键
   * @Field(() => ID) - GraphQL: 定义为 ID 类型（GraphQL 特殊类型）
   */
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  /**
   * 待办事项标题 - 必填
   *
   * @Column() - TypeORM: 定义为数据库列
   * @Field() - GraphQL: 定义为 GraphQL 字段
   */
  @Column()
  @Field()
  title: string;

  /**
   * 待办事项描述 - 可选
   *
   * @Column({ nullable: true }) - TypeORM: 允许为 NULL
   * @Field({ nullable: true }) - GraphQL: 可选字段
   */
  @Column({ nullable: true })
  @Field({ nullable: true })
  description?: string;

  /**
   * 完成状态 - 默认 false
   *
   * @Column({ default: false }) - TypeORM: 默认值为 false
   */
  @Column({ default: false })
  @Field()
  completed: boolean;

  /**
   * 优先级 - 枚举类型
   *
   * 支持四个值: LOW, MEDIUM, HIGH, URGENT
   * 这展示了如何在 TypeORM 和 GraphQL 中使用枚举
   */
  @Column({ type: 'enum', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @Field()
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  /**
   * 截止日期 - 可选时间戳
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field({ nullable: true })
  dueDate?: Date;

  /**
   * 所属用户 ID - 外键
   *
   * 用于实现用户数据隔离：
   * - 用户 A 只能看到自己的 Todo
   * - 用户 B 只能看到自己的 Todo
   * - 这是多租户应用的常见模式
   */
  @Column()
  userId: string;

  /**
   * 所属分类 ID - 外键（可选）
   *
   * nullable: true 表示 Todo 可以没有分类
   */
  @Column({ nullable: true })
  categoryId?: string;

  /**
   * 创建时间 - 自动生成
   *
   * @CreateDateColumn - TypeORM: 自动设置为当前时间
   */
  @CreateDateColumn()
  @Field()
  createdAt: Date;

  /**
   * 更新时间 - 自动更新
   *
   * @UpdateDateColumn - TypeORM: 每次更新时自动设置为当前时间
   */
  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  // ========== 关系字段 (Relationships) ==========

  /**
   * 关系: 所属用户
   *
   * @ManyToOne(() => User, user => user.todos)
   * - Many: 一个用户可以有多个 Todo
   * - One: 一个 Todo 只属于一个用户
   * - user => user.todos: 反向关系名称
   *
   * @Field() - GraphQL: 在查询时可以直接获取用户信息
   * eager: true - TypeORM: 每次查询 Todo 时自动加载关联的 User
   */
  @ManyToOne(() => User, user => user.todos, { eager: true })
  @Field()
  user: User;

  /**
   * 关系: 所属分类
   *
   * @ManyToOne(() => Category, category => category.todos)
   * - Many: 一个分类可以有多个 Todo
   * - One: 一个 Todo 只属于一个分类
   *
   * nullable: true - Todo 可以没有分类
   * eager: true - 自动加载分类
   */
  @ManyToOne(() => Category, category => category.todos, { nullable: true, eager: true })
  @Field({ nullable: true })
  category?: Category;

  /**
   * 关系: 评论列表
   *
   * @OneToMany(() => Comment, comment => comment.todo)
   * - One: 一个 Todo
   * - Many: 有多个 Comment
   * - comment => comment.todo: 反向关系
   *
   * cascade: true - 删除 Todo 时自动删除关联的评论
   */
  @OneToMany(() => Comment, comment => comment.todo, { cascade: true })
  @Field(() => [Comment])
  comments: Comment[];

  /**
   * 关系: 标签列表
   *
   * @ManyToMany(() => Tag, tag => tag.todos)
   * - Many: 一个 Todo 可以有多个 Tag
   * - Many: 一个 Tag 可以属于多个 Todo
   * - tag => tag.todos: 反向关系
   *
   * eager: true - 自动加载标签
   *
   * @JoinTable() - 创建联接表（自动生成表名）
   */
  @ManyToMany(() => Tag, tag => tag.todos, { eager: true })
  @JoinTable()
  @Field(() => [Tag])
  tags: Tag[];
}
```

**关系映射详解**:

1. **一对多 (One-to-Many) / 多对一 (Many-to-One)**
```
User 表           todos 表
┌──────┐         ┌──────────┐
│ id   │◄────┐   │ id       │
│ name │   1 │ N │ userId   │ (外键)
└──────┘     └───│ title    │
                 │ completed│
                 └──────────┘

代码示例：
User Entity 中：
@OneToMany(() => Todo, todo => todo.user)
todos: Todo[];

Todo Entity 中：
@ManyToOne(() => User, user => user.todos)
user: User;
```

2. **多对多 (Many-to-Many)**
```
tags 表          tag_todos_todo 表 (联接表)     todos 表
┌──────┐        ┌──────────┐        ┌──────────┐
│ id   │◄───┐   │ tagsId   │ ├───►  │ id       │
│ name │    │ N │ todosId  │    N  │ title    │
└──────┘    └────────┬─────┘        └──────────┘
                     └─ 自动生成

代码示例：
Tag Entity 中：
@ManyToMany(() => Todo, todo => todo.tags)
todos: Todo[];

Todo Entity 中：
@ManyToMany(() => Tag, tag => tag.todos)
@JoinTable()  // 只在一端定义 @JoinTable()
tags: Tag[];
```

---

### 5. **DTO - 数据验证和类型定义**

**位置**: `apps/api/src/[feature]/dto/`

**作用**:
- 定义输入数据的结构和验证规则
- 在运行时验证数据完整性
- 区分输入数据 (Input) 和输出数据 (Type/Entity)

**核心装饰器**:

| 装饰器 | 来源 | 用途 |
|--------|------|------|
| @InputType() | GraphQL | 定义 GraphQL Input 类型 |
| @Field() | GraphQL | 定义字段 |
| @IsString() | class-validator | 验证字符串 |
| @IsEmail() | class-validator | 验证邮箱 |
| @IsEnum() | class-validator | 验证枚举值 |
| @Min() / @Max() | class-validator | 验证数字范围 |
| @MinLength() / @MaxLength() | class-validator | 验证字符串长度 |

**示例 - CreateTodoInput**:
```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

/**
 * 创建 Todo 的输入 DTO
 *
 * DTO (Data Transfer Object) 的作用：
 * 1. 定义客户端发送数据的格式
 * 2. 自动验证数据（通过 ValidationPipe）
 * 3. 错误数据直接被拒绝（无需在 Service 中验证）
 * 4. 类型安全（TypeScript）
 *
 * 验证流程：
 * 客户端发送请求
 *   ↓
 * ValidationPipe 自动验证（根据 DTO 规则）
 *   ↓
 * 验证失败 → 返回 400 错误
 *   ↓
 * 验证成功 → 数据传给 Resolver
 */
@InputType()  // GraphQL InputType 装饰器
export class CreateTodoInput {
  /**
   * 待办事项标题 - 必填
   *
   * 验证规则：
   * - @IsString(): 必须是字符串
   * - @MinLength(1): 最少 1 个字符
   * - @MaxLength(255): 最多 255 个字符
   */
  @Field()
  @IsString()
  @MinLength(1, { message: '标题不能为空' })
  @MaxLength(255, { message: '标题不能超过 255 个字符' })
  title: string;

  /**
   * 待办事项描述 - 可选
   *
   * @IsOptional() - 这个字段可以省略
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /**
   * 优先级 - 可选，默认 'MEDIUM'
   *
   * @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']) - 只接受这四个值
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    message: '优先级必须是 LOW, MEDIUM, HIGH 或 URGENT',
  })
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';

  /**
   * 截止日期 - 可选
   */
  @Field({ nullable: true })
  @IsOptional()
  dueDate?: Date;

  /**
   * 分类 ID - 可选
   */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

/**
 * 更新 Todo 的输入 DTO
 *
 * 与 CreateTodoInput 不同，所有字段都是可选的
 * 因为用户可能只想更新部分字段
 */
@InputType()
export class UpdateTodoInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @Field({ nullable: true })
  @IsOptional()
  dueDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  completed?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
```

**验证流程示例**:
```typescript
// 客户端发送 GraphQL Mutation
mutation {
  createTodo(createTodoInput: {
    title: ""  // 错误：空字符串
    priority: "INVALID"  // 错误：无效的枚举值
  }) {
    id title
  }
}

// ValidationPipe 检查
1. title: "" → @MinLength(1) 检查失败
   错误: "标题不能为空"

2. priority: "INVALID" → @IsEnum() 检查失败
   错误: "优先级必须是 LOW, MEDIUM, HIGH 或 URGENT"

// 返回 400 Bad Request 错误
{
  "message": [
    "标题不能为空",
    "优先级必须是 LOW, MEDIUM, HIGH 或 URGENT"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 6. **Service - 业务逻辑层**

**位置**: `apps/api/src/[feature]/[feature].service.ts`

**作用**:
- 实现所有业务逻辑
- 与数据库交互
- 确保数据完整性和业务规则
- 可以被多个 Resolver 或 Controller 使用

**核心原则** (关注点分离):
- Service: 只关心业务逻辑
- Resolver: 只关心请求/响应映射
- Entity: 只关心数据结构

**示例 - TodoService**:
```typescript
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Todo } from './entities/todo.entity';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';
import { User } from '../user/entities/user.entity';
import { Category } from '../category/entities/category.entity';

/**
 * TodoService - 待办事项业务逻辑层
 *
 * 设计原则：
 * 1. Single Responsibility: 只负责 Todo 相关的业务逻辑
 * 2. Dependency Injection: 依赖注入 Repository
 * 3. Error Handling: 抛出适当的异常
 * 4. User Isolation: 确保用户只能访问自己的数据
 *
 * 与 Resolver 的分工：
 * - Resolver: 处理 GraphQL 请求/响应
 * - Service: 实现业务逻辑和数据访问
 *
 * 这样做的好处：
 * - Service 可以被多个 Resolver 使用
 * - Service 可以被单元测试轻松测试
 * - 业务逻辑与 GraphQL 解耦
 */
@Injectable()  // 标记为可注入的服务
export class TodoService {
  /**
   * 构造函数 - 依赖注入
   *
   * @InjectRepository(Todo) - 注入 Todo 的 Repository
   * Repository 提供了基础的 CRUD 方法：
   * - create(): 创建实例（不保存）
   * - save(): 保存到数据库
   * - find(): 查询多条
   * - findOne(): 查询单条
   * - update(): 更新
   * - delete(): 删除
   * - createQueryBuilder(): 构建复杂查询
   */
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /**
   * 创建新的 Todo
   *
   * 业务逻辑：
   * 1. 验证输入数据（DTO 已验证）
   * 2. 验证分类是否存在且属于该用户
   * 3. 创建 Todo 实例
   * 4. 保存到数据库
   * 5. 返回创建的 Todo
   *
   * @param createTodoInput - 创建数据
   * @param user - 当前用户
   * @returns 创建的 Todo
   * @throws BadRequestException - 如果分类不存在
   */
  async create(createTodoInput: CreateTodoInput, user: User): Promise<Todo> {
    // 验证分类（如果提供了分类 ID）
    if (createTodoInput.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: createTodoInput.categoryId,
          userId: user.id,  // 确保分类属于该用户
        },
      });

      if (!category) {
        throw new BadRequestException('分类不存在或不属于该用户');
      }
    }

    // 创建 Todo 实例
    const todo = this.todoRepository.create({
      ...createTodoInput,
      userId: user.id,  // 设置所有者为当前用户
    });

    // 保存到数据库
    return this.todoRepository.save(todo);
  }

  /**
   * 获取当前用户的所有 Todo
   *
   * 用户隔离：查询时加上 userId 条件
   *
   * @param userId - 用户 ID
   * @returns Todo 列表
   */
  async findByUser(userId: string): Promise<Todo[]> {
    return this.todoRepository.find({
      where: { userId },
      // 加载关联数据
      relations: ['user', 'category', 'comments', 'tags'],
      // 按创建时间降序排列
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据 ID 获取单个 Todo
   *
   * 安全检查：验证 Todo 是否属于该用户
   *
   * @param id - Todo ID
   * @param userId - 用户 ID（用于验证所有权）
   * @returns Todo 或 null
   * @throws ForbiddenException - 如果 Todo 不属于该用户
   */
  async findById(id: string, userId: string): Promise<Todo | null> {
    const todo = await this.todoRepository.findOne({
      where: { id, userId },  // 确保 Todo 属于该用户
    });

    if (!todo) {
      return null;
    }

    return todo;
  }

  /**
   * 更新 Todo
   *
   * 安全检查：确保用户只能更新自己的 Todo
   *
   * @param id - Todo ID
   * @param updateTodoInput - 更新数据
   * @param user - 当前用户
   * @returns 更新后的 Todo
   * @throws ForbiddenException - 如果 Todo 不属于该用户
   */
  async update(
    id: string,
    updateTodoInput: UpdateTodoInput,
    user: User,
  ): Promise<Todo> {
    // 验证 Todo 存在且属于该用户
    const todo = await this.findById(id, user.id);
    if (!todo) {
      throw new ForbiddenException('无权访问该 Todo');
    }

    // 验证分类（如果要更新分类）
    if (updateTodoInput.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: updateTodoInput.categoryId,
          userId: user.id,
        },
      });

      if (!category) {
        throw new BadRequestException('分类不存在');
      }
    }

    // 使用 update 方法只更新指定的字段
    // （这比查询后修改再保存更高效）
    await this.todoRepository.update({ id }, updateTodoInput);

    // 查询并返回更新后的 Todo
    return this.todoRepository.findOne({
      where: { id },
    });
  }

  /**
   * 删除 Todo
   *
   * @param id - Todo ID
   * @param user - 当前用户
   * @returns 被删除的 Todo
   * @throws ForbiddenException - 如果 Todo 不属于该用户
   */
  async delete(id: string, user: User): Promise<Todo> {
    // 验证 Todo 存在且属于该用户
    const todo = await this.findById(id, user.id);
    if (!todo) {
      throw new ForbiddenException('无权访问该 Todo');
    }

    // 删除 Todo（关联的 Comment 会因为 cascade 自动删除）
    await this.todoRepository.delete({ id });

    return todo;
  }

  /**
   * 标记 Todo 为完成
   *
   * @param id - Todo ID
   * @param userId - 用户 ID
   * @returns 更新后的 Todo
   */
  async toggleComplete(id: string, userId: string): Promise<Todo> {
    const todo = await this.findById(id, userId);
    if (!todo) {
      throw new ForbiddenException('无权访问该 Todo');
    }

    await this.todoRepository.update({ id }, {
      completed: !todo.completed,
    });

    return this.todoRepository.findOne({ where: { id } });
  }
}
```

---

### 7. **Repository - 数据访问层**

**注意**: 在本项目中，Repository 是自动注入的，通常不需要创建自定义类。

**作用**:
- 提供对数据库的访问方法
- 隐藏 SQL 查询细节
- 由 TypeORM 自动生成

**常用 Repository 方法**:

```typescript
// 查询
repo.find() // 查询所有
repo.findOne({ where: { id } }) // 查询单条
repo.findBy({ userId }) // 按条件查询多条
repo.createQueryBuilder() // 构建复杂查询

// 创建/保存
repo.create(data) // 创建实例（不保存）
repo.save(entity) // 保存到数据库

// 更新
repo.update({ id }, updateData) // 更新指定字段

// 删除
repo.delete({ id }) // 删除

// 统计
repo.count() // 统计数量
```

**在 Service 中使用 Repository**:

```typescript
// 在 Service 构造函数中注入
constructor(
  @InjectRepository(Todo)
  private todoRepository: Repository<Todo>,
) {}

// 在方法中使用
const todos = await this.todoRepository.find({
  where: { userId },
  relations: ['category', 'comments', 'tags'],
});
```

---

### 8. **Guard - 权限守卫**

**位置**: `apps/api/src/common/guards/`

**作用**:
- 在请求到达 Resolver 前进行权限检查
- 验证用户身份
- 验证用户权限

**常见 Guard 类型**:

| Guard | 用途 |
|-------|------|
| GqlAuthGuard | 验证 JWT Token，确保用户已登录 |
| RolesGuard | 验证用户角色（如 admin） |
| JwtGuard | REST API 的 JWT 验证 |

**示例 - GqlAuthGuard**:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * GraphQL 认证守卫
 *
 * 作用：验证 GraphQL 请求中的 JWT Token
 *
 * 流程：
 * 1. 检查请求头中的 Authorization 字段
 * 2. 提取 Bearer Token
 * 3. 验证 Token 有效性
 * 4. 如果有效，将 User 信息注入到 Context
 * 5. 如果无效，返回 401 Unauthorized
 *
 * 使用：
 * @UseGuards(GqlAuthGuard)
 * async todos(@CurrentUser() user: User) { ... }
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context) {
    const gqlContext = context.getContext();
    return gqlContext.req;  // GraphQL 上下文中获取 Express 请求对象
  }
}
```

**使用方式**:

```typescript
@Query(() => [Todo])
@UseGuards(GqlAuthGuard)  // 添加认证守卫
async todos(@CurrentUser() user: User): Promise<Todo[]> {
  // 只有认证用户才能到达这里
  return this.todoService.findByUser(user.id);
}
```

---

### 9. **Decorator - 自定义装饰器**

**位置**: `apps/api/src/common/decorators/`

**作用**:
- 简化代码
- 提高可读性
- 实现元编程

**常见装饰器**:

| 装饰器 | 作用 |
|--------|------|
| @CurrentUser() | 获取当前认证用户 |
| @Field() | 定义 GraphQL 字段 |
| @Query() | 定义 GraphQL 查询 |
| @Mutation() | 定义 GraphQL 修改 |

**示例 - CurrentUser 装饰器**:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * 自定义装饰器：@CurrentUser()
 *
 * 作用：自动从 JWT Token 中提取当前用户信息
 *
 * 使用：
 * @Query()
 * @UseGuards(GqlAuthGuard)
 * async todos(@CurrentUser() user: User) {
 *   return this.todoService.findByUser(user.id);
 * }
 *
 * 原理：
 * 1. GqlAuthGuard 验证 Token 并将 User 信息放在 req.user
 * 2. CurrentUser 装饰器从 req.user 中提取并返回 User 对象
 * 3. Service 接收 User 对象
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext().req.user;
  },
);
```

---

## 🔄 完整请求流程

让我们追踪一个完整的 GraphQL 请求流程：

### 场景：创建待办事项

```graphql
mutation {
  createTodo(createTodoInput: {
    title: "学习 NestJS"
    priority: "HIGH"
  }) {
    id
    title
    completed
  }
}
```

### 流程详解

```
1️⃣  客户端发送请求
    └─ GraphQL Mutation 到 http://localhost:4000/graphql

2️⃣  GraphQL 服务器接收请求 (Apollo Server)
    └─ 解析 GraphQL 查询语法
    └─ 路由到正确的 Resolver

3️⃣  Resolver 处理请求 (TodoResolver.createTodo)
    ├─ 提取参数: createTodoInput
    ├─ 检查 @UseGuards(GqlAuthGuard) 守卫
    │  └─ 验证请求头中的 Authorization Token
    │     ├─ 如果 Token 无效 → 返回 401 Unauthorized
    │     └─ 如果 Token 有效 → 提取 User 信息
    ├─ 获取 @CurrentUser() 装饰器的用户信息
    └─ 调用 Service 方法

4️⃣  Service 执行业务逻辑 (TodoService.create)
    ├─ 接收 CreateTodoInput DTO
    │  └─ DTO 已通过 ValidationPipe 验证
    ├─ 验证业务规则
    │  └─ 如果提供了 categoryId，检查分类是否存在
    ├─ 调用 Repository 保存数据
    │  └─ repository.save(todo)
    └─ 返回创建的 Todo 对象

5️⃣  TypeORM Repository 与数据库交互
    ├─ 生成 SQL: INSERT INTO todos (...)
    ├─ 执行 SQL 查询
    └─ 返回插入的行 (包含生成的 ID)

6️⃣  返回结果链路
    TodoService.create() → Todo 对象
    └─ TodoResolver.createTodo()
       └─ 返回 GraphQL 格式的 Todo
          └─ Apollo Server
             └─ 返回 JSON 响应到客户端

7️⃣  客户端接收响应
    {
      "data": {
        "createTodo": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "title": "学习 NestJS",
          "completed": false
        }
      }
    }

错误处理示例：
├─ 如果缺少 Authorization Token
│  └─ GqlAuthGuard 抛出 401 错误
├─ 如果 title 为空
│  └─ ValidationPipe 抛出 400 错误
└─ 如果 categoryId 不存在
   └─ TodoService 抛出 BadRequestException
```

---

## 📊 模块间通信流程

```
AuthModule
├─ 提供认证功能（登录、注册、JWT 生成）
└─ 导出 AuthService

     ↓ UserModule 导入 AuthModule

UserModule
├─ 使用 AuthService 进行认证
├─ 定义 User Entity
└─ 导出 UserService

     ↓ TodoModule、CategoryModule 等导入 UserModule

TodoModule
├─ 在 Service 中接收 @CurrentUser() 用户
├─ 验证用户所有权
└─ 提供 Todo 操作

     ↓ AppModule 导入所有模块

AppModule (根模块)
├─ 配置数据库连接
├─ 配置 GraphQL
└─ 启动应用
```

---

## 🎯 学习要点总结

| 组件 | 职责 | 示例 |
|------|------|------|
| **main.ts** | 应用启动，配置全局设置 | CORS、ValidationPipe |
| **Module** | 组织相关代码，管理依赖 | @Module({ providers, imports }) |
| **Resolver** | 处理 GraphQL 请求 | @Query(), @Mutation() |
| **Entity** | 定义数据模型 | @Entity(), @Column() |
| **DTO** | 验证输入数据 | @InputType(), @IsString() |
| **Service** | 实现业务逻辑 | 创建、更新、删除、查询 |
| **Guard** | 权限检查 | GqlAuthGuard 验证 JWT |
| **Decorator** | 提取参数 | @CurrentUser(), @Args() |

---

## 🔗 关键流程图

### 请求 → 响应流程
```
GraphQL Query/Mutation
    ↓ (通过 HTTP POST)
Apollo Server
    ↓ (解析)
GqlAuthGuard
    ├─ 有效 → @CurrentUser() 装饰器
    └─ 无效 → 401 错误
    ↓
Resolver Method
    ↓ (验证参数和权限)
Service Method
    ↓ (业务逻辑)
Repository.save/find/update/delete
    ↓ (生成 SQL)
PostgreSQL Database
    ↓ (返回数据)
Service 返回结果
    ↓
Resolver 格式化响应
    ↓
Apollo Server 序列化
    ↓
JSON 响应到客户端
```

### 依赖注入流程
```
@Module({
  providers: [TodoService, TodoResolver]
})

TodoResolver 需要 TodoService
    ↓
NestJS DI 容器检查
    ↓
在 providers 中找到 TodoService
    ↓
实例化 TodoService
    ↓
将实例注入到 TodoResolver 的构造函数
    ↓
TodoResolver 可以使用 this.todoService
```

---

## 🚀 实战建议

1. **理解依赖注入**: NestJS 的核心，所有服务都通过构造函数注入
2. **分离关注点**: Resolver 只处理 HTTP/GraphQL，Service 处理业务逻辑
3. **验证数据**: 使用 DTO 和 ValidationPipe 进行自动验证
4. **用户隔离**: 所有查询都应该加上 userId 条件
5. **错误处理**: 使用适当的异常（BadRequestException、ForbiddenException）
6. **关系管理**: 正确定义 Entity 之间的关系（一对多、多对多）
7. **测试 Service**: Service 层易于单元测试，无需 HTTP 上下文

