/**
 * Todo GraphQL 解析器 (Resolver)
 *
 * @description
 * Resolver 是 GraphQL 中的核心概念，负责定义 API 端点和数据获取逻辑。
 * 这个解析器提供了 Todo 实体的所有 GraphQL 操作。
 *
 * 核心概念解释：
 *
 * 1. **Resolver** - 解析器类
 *    - 将 GraphQL 操作映射到实际的业务逻辑
 *    - 一个 Resolver 类通常对应一个数据类型（如 Todo）
 *    - 负责在 Query、Mutation 和字段级别处理数据获取
 *
 * 2. **Query** - 查询操作（读取数据）
 *    - 类似于 REST API 中的 GET 请求
 *    - 用于查询现有数据，不修改数据库
 *    - 示例：获取 Todo 列表、获取单个 Todo 详情
 *
 * 3. **Mutation** - 修改操作（修改数据）
 *    - 类似于 REST API 中的 POST、PUT、DELETE 请求
 *    - 用于创建、更新或删除数据
 *    - 示例：创建新 Todo、更新 Todo、删除 Todo
 *
 * 4. **Args** - 参数装饰器
 *    - 用于接收 GraphQL 操作的参数
 *    - 自动进行类型验证和转换
 *
 * 5. **Decorators** - 装饰器
 *    - @Resolver - 声明一个解析器类
 *    - @Query - 声明查询操作
 *    - @Mutation - 声明修改操作
 *    - @UseGuards - 应用认证守卫
 *    - @Args - 声明参数
 *    - @CurrentUser - 自定义装饰器，获取当前用户
 *
 * GraphQL 的优势：
 * - 客户端只请求需要的字段，避免过度获取或不足获取数据
 * - 类型安全，自动校验参数类型和返回类型
 * - 自动生成 API 文档和 IDE 支持
 * - 支持嵌套查询和复杂数据关系
 *
 * REST API vs GraphQL 对比：
 * ```
 * REST:
 * GET /todos         -> 返回所有字段
 * GET /todos/:id     -> 返回所有字段
 * POST /todos        -> 创建
 * PUT /todos/:id     -> 更新
 * DELETE /todos/:id  -> 删除
 *
 * GraphQL:
 * query { todos { id title } }  -> 只获取需要的字段
 * query { todo(id: "123") { id title } }  -> 只获取需要的字段
 * mutation { createTodo(...) { id } }
 * mutation { updateTodo(...) { id } }
 * mutation { removeTodo(id: "123") }
 * ```
 */

import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Todo } from './todo.entity';
import { TodoService } from './todo.service';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

/**
 * @Resolver(() => Todo) 装饰器说明
 *
 * 这个装饰器声明这是一个处理 Todo GraphQL 类型的解析器。
 * () => Todo 是一个函数，用于延迟加载 Todo 类，避免循环依赖问题。
 *
 * 作用：
 * - 将此类注册为 NestJS GraphQL 解析器
 * - 告诉 NestJS GraphQL 驱动，这个类中的方法处理 Todo 类型的操作
 * - 自动为此类中的 @Query 和 @Mutation 方法生成 GraphQL Schema
 */

/**
 * @UseGuards(GqlAuthGuard) 装饰器说明
 *
 * 这个装饰器在类级别应用认证守卫，意味着：
 * - 该类中的所有 Query 和 Mutation 都需要用户认证
 * - 未认证的请求会被拒绝
 * - 认证信息从 HTTP 请求的 Authorization Header 中读取
 *
 * 工作流程：
 * 1. GraphQL 请求到达时，GqlAuthGuard 检查 Authorization Header
 * 2. 验证 JWT Token 的有效性
 * 3. 如果有效，提取 User 信息并将其注入到 @CurrentUser 装饰器
 * 4. 如果无效，返回认证错误
 */
@Resolver(() => Todo)
@UseGuards(GqlAuthGuard)
export class TodoResolver {
  /**
   * 构造函数 - 依赖注入
   *
   * @description
   * NestJS 使用依赖注入容器管理所有服务实例。
   * 在构造函数中声明参数类型，NestJS 会自动创建或获取该服务的实例。
   *
   * 依赖注入的好处：
   * 1. 解耦 - TodoResolver 不需要知道如何创建 TodoService
   * 2. 可测试性 - 测试时可以注入 Mock 服务
   * 3. 中央管理 - NestJS 管理服务的生命周期
   *
   * @param todoService - TodoService 实例
   *                     这个服务处理所有 Todo 相关的业务逻辑
   */
  constructor(private readonly todoService: TodoService) {}

  /**
   * 创建待办事项 Mutation
   *
   * @description
   * 这个方法处理 GraphQL mutation 请求，创建一个新的待办事项。
   *
   * @Mutation 装饰器说明：
   * - () => Todo: 返回类型是 Todo 对象
   * - 自动生成 GraphQL schema 中的 createTodo mutation
   * - NestJS GraphQL 会自动验证参数类型和返回类型
   *
   * 参数说明：
   * - @Args('createTodoInput'): 从 GraphQL 请求中提取名为 'createTodoInput' 的参数
   *   该参数类型为 CreateTodoInput（由 DTO 定义），包含：
   *   - title (string, 必需): 待办事项标题
   *   - description (string, 可选): 详细描述
   *   - priority (enum, 可选): 优先级 (LOW|MEDIUM|HIGH|URGENT)
   *   - dueDate (DateTime, 可选): 截止日期
   *   - categoryId (UUID, 可选): 所属分类 ID
   *
   * - @CurrentUser() user: User: 自定义装饰器
   *   自动从认证 token 中提取当前用户信息
   *   GqlAuthGuard 已确保用户已认证
   *   包含: id, email, username, createdAt, updatedAt
   *
   * 业务流程：
   * 1. GqlAuthGuard 检查认证信息，提取用户 ID
   * 2. @Args 装饰器验证并转换 GraphQL 参数
   * 3. 调用 TodoService.create() 处理业务逻辑
   * 4. Service 将 userId 自动关联到新 Todo
   * 5. 返回创建成功的 Todo 对象（包含生成的 ID）
   *
   * 权限检查：
   * - @UseGuards(GqlAuthGuard): 只有认证用户才能调用
   * - 新建的 Todo 自动属于当前用户
   * - 其他用户无法访问这个 Todo
   *
   * GraphQL 使用示例：
   * ```graphql
   * mutation CreateNewTodo {
   *   createTodo(createTodoInput: {
   *     title: "学习 GraphQL"
   *     description: "理解 Query 和 Mutation 的区别"
   *     priority: HIGH
   *     dueDate: "2024-12-31"
   *     categoryId: "category-uuid"
   *   }) {
   *     id
   *     title
   *     priority
   *     createdAt
   *     category {
   *       name
   *       color
   *     }
   *   }
   * }
   * ```
   *
   * 返回值说明：
   * - 返回完整的 Todo 对象
   * - 包含自动生成的 id (UUID)
   * - 包含自动生成的 createdAt 时间戳
   * - 可以在响应中请求任何 Todo 字段和关联的对象字段
   *
   * @param createTodoInput - 包含新 Todo 数据的 DTO 对象
   * @param user - 当前认证用户对象
   * @returns 创建成功的 Todo 对象
   * @throws UnauthorizedException 如果用户未认证
   * @throws BadRequestException 如果输入数据无效
   */
  @Mutation(() => Todo)
  async createTodo(
    @Args('createTodoInput') createTodoInput: CreateTodoInput,
    @CurrentUser() user: User,
  ) {
    // 调用 Service 处理创建逻辑，自动关联 userId
    return this.todoService.create(createTodoInput, user.id);
  }

  /**
   * 查询所有待办事项 Query
   *
   * @description
   * 这个方法处理 GraphQL query 请求，检索当前用户的所有待办事项。
   *
   * @Query 装饰器说明：
   * - () => [Todo]: 返回类型是 Todo 数组（方括号表示数组）
   * - { name: 'todos' }: GraphQL schema 中的 query 名称
   * - 自动生成 GraphQL schema 中的 todos query
   *
   * 业务流程：
   * 1. GqlAuthGuard 检查认证信息
   * 2. @CurrentUser() 装饰器提取当前用户信息
   * 3. 调用 TodoService.findAll() 获取用户的所有 Todo
   * 4. Service 自动按 userId 过滤，只返回属于该用户的 Todo
   * 5. Service 自动加载关联的 User 和 Category 数据
   * 6. 按创建时间倒序排列（最新的在前）
   * 7. 返回 Todo 数组给客户端
   *
   * 数据隔离：
   * - 每个用户只能查看属于他们的 Todo
   * - Service 层通过 userId 过滤确保安全
   * - 即使知道其他用户的 Todo ID，也无法查询
   *
   * 性能优化：
   * - 使用 eager loading 预加载 User 和 Category
   * - 避免 N+1 查询问题
   * - 一个数据库查询就能获得所有必要数据
   *
   * GraphQL 使用示例：
   * ```graphql
   * query GetAllTodos {
   *   todos {
   *     id
   *     title
   *     priority
   *     completed
   *     dueDate
   *     user {
   *       username
   *       email
   *     }
   *     category {
   *       name
   *       color
   *       icon
   *     }
   *   }
   * }
   * ```
   *
   * 客户端灵活选择字段：
   * - 客户端可以选择只获取需要的字段
   * - 减少网络流量和数据处理
   * - 这是 GraphQL vs REST 的主要优势
   *
   * @param user - 当前认证用户
   * @returns 该用户的所有 Todo 数组
   * @throws UnauthorizedException 如果用户未认证
   */
  @Query(() => [Todo], { name: 'todos' })
  async findAll(@CurrentUser() user: User) {
    // 调用 Service 获取该用户的所有 Todo
    return this.todoService.findAll(user.id);
  }

  /**
   * 查询单个待办事项 Query
   *
   * @description
   * 这个方法处理 GraphQL query 请求，检索指定 ID 的待办事项详情。
   *
   * @Query 装饰器说明：
   * - () => Todo: 返回类型是单个 Todo 对象
   * - { name: 'todo' }: GraphQL schema 中的 query 名称
   *
   * @Args 装饰器说明：
   * - 'id': GraphQL 参数名
   * - { type: () => ID }: 参数类型是 GraphQL ID 类型（自动验证 UUID 格式）
   * GraphQL ID 类型会自动验证输入是有效的标识符
   *
   * 业务流程：
   * 1. GqlAuthGuard 检查认证信息
   * 2. @Args 装饰器验证 id 参数的格式
   * 3. @CurrentUser() 装饰器提取当前用户
   * 4. 调用 TodoService.findOne(id, userId)
   * 5. Service 检查该 Todo 是否存在且属于当前用户
   * 6. 如果不存在或无权访问，抛出 NotFoundException
   * 7. 返回 Todo 对象（包括关联的 User 和 Category）
   *
   * 权限检查：
   * - Service 会检查 Todo 是否属于当前用户
   * - 未认证用户无法访问
   * - 已认证用户只能访问属于他们的 Todo
   * - 尝试访问他人的 Todo 会返回 404 错误
   *
   * GraphQL 使用示例：
   * ```graphql
   * query GetTodoDetails {
   *   todo(id: "550e8400-e29b-41d4-a716-446655440000") {
   *     id
   *     title
   *     description
   *     priority
   *     completed
   *     dueDate
   *     createdAt
   *     updatedAt
   *     user {
   *       id
   *       username
   *       email
   *     }
   *     category {
   *       id
   *       name
   *       color
   *       icon
   *     }
   *   }
   * }
   * ```
   *
   * @param id - 待办事项的 UUID（GraphQL ID 类型）
   * @param user - 当前认证用户
   * @returns 指定的 Todo 对象
   * @throws UnauthorizedException 如果用户未认证
   * @throws NotFoundException 如果 Todo 不存在或不属于当前用户
   */
  @Query(() => Todo, { name: 'todo' })
  async findOne(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: User) {
    // 调用 Service 获取单个 Todo（自动进行权限检查）
    return this.todoService.findOne(id, user.id);
  }

  /**
   * 更新待办事项 Mutation
   *
   * @description
   * 这个方法处理 GraphQL mutation 请求，更新指定的待办事项。
   *
   * 参数说明：
   * - id: 待办事项的 UUID
   * - updateTodoInput: 包含要更新的字段的 DTO 对象
   *   所有字段都是可选的，只有提供的字段会被更新
   *   包含可能的字段：
   *   - title: 新标题
   *   - description: 新描述
   *   - priority: 新优先级
   *   - completed: 更新完成状态
   *   - dueDate: 新截止日期
   *   - categoryId: 移动到新分类
   *
   * 业务流程：
   * 1. GqlAuthGuard 检查认证信息
   * 2. 参数验证和类型转换
   * 3. 调用 TodoService.update(id, updateTodoInput, userId)
   * 4. Service 先调用 findOne() 进行权限检查和存在性验证
   * 5. Service 使用 Object.assign 合并更新字段
   * 6. Service 保存更新到数据库
   * 7. 返回更新后的 Todo 对象
   *
   * 权限检查：
   * - 只有 Todo 的所有者才能更新
   * - Service 的 findOne 会进行权限验证
   * - 其他用户的更新请求会返回 404 错误
   *
   * 部分更新支持：
   * - UpdateTodoInput 中的所有字段都是可选的
   * - 只提供想要更新的字段，其他字段保持不变
   * - 这是 PATCH 语义（部分更新），不是 PUT（完整替换）
   *
   * GraphQL 使用示例：
   * ```graphql
   * mutation UpdateTodo {
   *   updateTodo(
   *     id: "550e8400-e29b-41d4-a716-446655440000"
   *     updateTodoInput: {
   *       title: "更新的标题"
   *       completed: true
   *       priority: URGENT
   *     }
   *   ) {
   *     id
   *     title
   *     completed
   *     priority
   *     updatedAt
   *   }
   * }
   * ```
   *
   * @param id - 待办事项的 UUID
   * @param updateTodoInput - 包含更新数据的 DTO（所有字段可选）
   * @param user - 当前认证用户
   * @returns 更新后的 Todo 对象
   * @throws UnauthorizedException 如果用户未认证
   * @throws NotFoundException 如果 Todo 不存在或不属于当前用户
   * @throws BadRequestException 如果输入数据无效
   */
  @Mutation(() => Todo)
  async updateTodo(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTodoInput') updateTodoInput: UpdateTodoInput,
    @CurrentUser() user: User,
  ) {
    // 调用 Service 处理更新逻辑
    return this.todoService.update(id, updateTodoInput, user.id);
  }

  /**
   * 删除待办事项 Mutation
   *
   * @description
   * 这个方法处理 GraphQL mutation 请求，删除指定的待办事项。
   *
   * @Mutation(() => Boolean) 说明：
   * - 返回类型是布尔值（true 表示删除成功）
   * - 失败时会抛出异常而不是返回 false
   * - GraphQL 错误会被自动转换为 GraphQL 错误响应
   *
   * 业务流程：
   * 1. GqlAuthGuard 检查认证信息
   * 2. 参数验证
   * 3. 调用 TodoService.remove(id, userId)
   * 4. Service 先调用 findOne() 进行权限检查
   * 5. Service 从数据库删除该 Todo
   * 6. 返回 true 表示删除成功
   *
   * 权限检查：
   * - 只有 Todo 的所有者才能删除
   * - Service 的 findOne 会进行权限验证
   * - 其他用户的删除请求会返回 404 错误
   *
   * 级联删除：
   * - 删除 Todo 时，关联的 Comment 会根据 Entity 配置被级联删除
   * - 删除 Todo 时，与 Tag 的多对多关联会自动清除
   * - User 引用不会被删除（那是用户账户本身）
   * - Category 引用不会被删除（分类继续存在）
   *
   * GraphQL 使用示例：
   * ```graphql
   * mutation DeleteTodo {
   *   removeTodo(id: "550e8400-e29b-41d4-a716-446655440000")
   * }
   * ```
   *
   * 成功响应：
   * ```json
   * {
   *   "data": {
   *     "removeTodo": true
   *   }
   * }
   * ```
   *
   * 错误响应（权限不足或不存在）：
   * ```json
   * {
   *   "errors": [
   *     {
   *       "message": "Todo with ID xxx not found",
   *       "extensions": {
   *         "code": "NOT_FOUND"
   *       }
   *     }
   *   ]
   * }
   * ```
   *
   * @param id - 待办事项的 UUID
   * @param user - 当前认证用户
   * @returns true 表示删除成功
   * @throws UnauthorizedException 如果用户未认证
   * @throws NotFoundException 如果 Todo 不存在或不属于当前用户
   */
  @Mutation(() => Boolean)
  async removeTodo(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: User) {
    // 调用 Service 处理删除逻辑（自动进行权限检查）
    return this.todoService.remove(id, user.id);
  }
}
