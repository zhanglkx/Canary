/**
 * TodoService - 待办事项业务服务
 *
 * @description
 * 这个服务类负责处理所有与待办事项相关的业务逻辑和数据操作。
 * 它遵循 NestJS 的 Service 层设计模式，与 Resolver 层分离。
 *
 * 核心职责：
 * 1. 封装数据库操作 - 通过 TypeORM Repository 进行 CRUD 操作
 * 2. 实现业务规则 - 如权限检查、数据验证等
 * 3. 错误处理 - 抛出适当的异常，由 Resolver 层捕获并转换为 REST API 错误
 * 4. 数据关联加载 - 自动加载关联的 User 和 Category 数据
 *
 * 架构设计：
 * REST API Resolver (API 入口)
 *         ↓
 *    TodoService (业务逻辑)
 *         ↓
 *    TypeORM Repository (数据库)
 *         ↓
 *      Database
 *
 * 权限模式：
 * - 所有方法都接收 userId 参数
 * - 所有数据库查询都包含 userId 过滤
 * - 这确保用户只能访问属于他们的待办事项
 * - 即使用户知道其他用户的 Todo ID，也无法访问
 *
 * 依赖注入：
 * - 使用 @InjectRepository(Todo) 注入 TypeORM Repository
 * - NestJS 会自动创建和管理 Repository 实例
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';

/**
 * @Injectable() 装饰器
 *
 * 将这个类标记为可被 NestJS 依赖注入系统管理的服务。
 * NestJS 会自动：
 * 1. 解析类的构造函数参数
 * 2. 在需要时创建该服务的实例
 * 3. 提供该服务给其他类（如 Resolver）
 */
@Injectable()
export class TodoService {
  /**
   * 构造函数 - 依赖注入
   *
   * @param todoRepository - TypeORM 的 Repository 实例
   *
   * Repository 是 TypeORM 提供的数据访问对象，负责：
   * - CRUD 操作（create、read、update、delete）
   * - 查询构建（where、join、relations 等）
   * - 事务管理
   *
   * @InjectRepository(Todo) 装饰器告诉 NestJS：
   * - 我需要 Todo 实体的 Repository
   * - 请自动注入这个 Repository 实例
   */
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  /**
   * 创建待办事项
   *
   * @description
   * 这个方法实现了"创建"业务逻辑。它不仅简单地保存数据，
   * 还确保新建的 Todo 自动关联到当前用户。
   *
   * 业务流程：
   * 1. 接收 CreateTodoInput（经过 DTO 验证）
   * 2. 获取当前用户 ID（由 Resolver 层传入）
   * 3. 创建 Todo 实体对象
   * 4. 将 userId 关联到新 Todo
   * 5. 保存到数据库
   * 6. 返回保存后的 Todo 对象（包含生成的 ID 和时间戳）
   *
   * @param createTodoInput - 来自 REST API mutation 的输入数据
   *        例：{ title: "学习 REST API", priority: "HIGH", dueDate: "2024-12-31" }
   * @param userId - 当前已认证用户的 ID（由 Resolver 通过 @CurrentUser 装饰器提供）
   *
   * @returns 返回创建成功的 Todo 对象，包括：
   *         - 自动生成的 id（UUID）
   *         - 自动生成的 createdAt 时间戳
   *         - 所有输入字段
   *         - userId 关联
   *
   * @throws 如果数据库操作失败，会抛出异常（由 NestJS 异常过滤器处理）
   *
   * REST API 示例：
   * ```rest-api
   * mutation {
   *   createTodo(createTodoInput: {
   *     title: "完成项目文档"
   *     priority: HIGH
   *     dueDate: "2024-12-31"
   *   }) {
   *     id title priority createdAt
   *   }
   * }
   * ```
   */
  async create(createTodoInput: CreateTodoInput, userId: string): Promise<Todo> {
    // 使用 Repository 的 create 方法创建 Todo 实体实例
    // create 只是创建内存中的对象，还未保存到数据库
    const todo = this.todoRepository.create({
      ...createTodoInput,  // 展开 DTO 中的所有属性
      userId,              // 自动关联到当前用户
    });

    // 使用 save 方法将对象保存到数据库
    // save 会执行 INSERT 语句并返回包含生成的 ID 的对象
    return this.todoRepository.save(todo);
  }

  /**
   * 查询用户的所有待办事项
   *
   * @description
   * 检索当前用户的所有待办事项，并按创建时间倒序排列（最新的在前）。
   *
   * 业务规则：
   * 1. 只返回属于该用户的 Todo（通过 userId 过滤）
   * 2. 自动加载关联的 User 和 Category 数据
   * 3. 按创建时间降序排列（新的任务显示在最上面）
   *
   * 关联加载的重要性：
   * - 使用 relations: ['user', 'category'] 告诉 TypeORM 预加载关联的对象
   * - 这避免了 N+1 查询问题（逐行查询每个 Todo 时，还要查询其 User 和 Category）
   * - 一个查询就能获得所有数据，提高了性能
   *
   * @param userId - 当前用户的 ID，用于过滤只属于该用户的 Todo
   *
   * @returns 返回该用户的所有 Todo 对象数组
   *         如果用户没有任何 Todo，返回空数组 []
   *
   * 数据库查询示例：
   * ```sql
   * SELECT * FROM todos
   * WHERE user_id = 'user-uuid'
   * ORDER BY created_at DESC
   * ```
   *
   * REST API 示例：
   * ```rest-api
   * query {
   *   todos {
   *     id title priority completed
   *     user { username email }
   *     category { name color }
   *   }
   * }
   * ```
   */
  async findAll(userId: string): Promise<Todo[]> {
    return this.todoRepository.find({
      // where 子句：只查询属于该用户的 Todo
      where: { userId },

      // relations：预加载关联的对象
      // 这样可以在一次查询中获得 Todo、User 和 Category 的数据
      relations: ['user', 'category'],

      // order：排序方式，按 createdAt 降序（最新的在前）
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 查询单个待办事项
   *
   * @description
   * 根据 Todo ID 和 userId 查询单个 Todo 对象。
   * 这个方法既用于读取操作，也用于更新和删除前的权限验证。
   *
   * 权限验证的实现方式：
   * - 在 where 条件中同时查询 id 和 userId
   * - 这确保只有所有者才能找到该 Todo
   * - 如果用户试图访问不属于他们的 Todo，数据库不会返回任何记录
   * - 然后抛出 NotFoundException，告知调用者 Todo 不存在
   *
   * @param id - 待办事项的 ID（UUID）
   * @param userId - 当前用户的 ID（权限检查）
   *
   * @returns 返回找到的 Todo 对象（包括 user 和 category 关联对象）
   *
   * @throws NotFoundException 如果：
   *         1. Todo ID 不存在
   *         2. Todo 不属于当前用户（权限检查失败）
   *
   * 使用场景：
   * 1. 用户查看单个 Todo 详情
   * 2. 更新 Todo 前的权限验证
   * 3. 删除 Todo 前的权限验证
   *
   * REST API 示例：
   * ```rest-api
   * query {
   *   todo(id: "todo-uuid") {
   *     id title priority completed
   *     user { username }
   *     category { name }
   *   }
   * }
   * ```
   */
  async findOne(id: string, userId: string): Promise<Todo> {
    // 同时查询 id 和 userId，实现权限检查
    const todo = await this.todoRepository.findOne({
      where: { id, userId },  // id AND userId 条件
      relations: ['user', 'category'],  // 预加载关联数据
    });

    // 如果数据库没有返回任何记录，说明：
    // 1. 该 ID 的 Todo 不存在，或
    // 2. 该 Todo 不属于当前用户（权限检查失败）
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    return todo;
  }

  /**
   * 更新待办事项
   *
   * @description
   * 更新指定的 Todo 对象。这个方法首先验证权限（通过 findOne），
   * 然后更新指定字段，最后保存到数据库。
   *
   * 业务流程：
   * 1. 调用 findOne 进行权限检查和获取现有 Todo
   * 2. 使用 Object.assign 将新的更新字段合并到 Todo 对象
   * 3. 将更新后的对象保存回数据库
   * 4. 返回更新后的 Todo
   *
   * 安全性说明：
   * - findOne 会检查该 Todo 是否属于当前用户
   * - 只有所有者才能成功执行到这一步
   * - 这实现了安全的权限控制
   *
   * 部分更新的支持：
   * - UpdateTodoInput 中的字段都是可选的
   * - 只有提供的字段会被更新
   * - 未提供的字段保持原样
   *
   * @param id - 待办事项的 ID
   * @param updateTodoInput - 更新的数据
   *        例：{ title: "新标题", completed: true }
   *        未提供的字段不会被修改
   * @param userId - 当前用户的 ID（权限检查）
   *
   * @returns 返回更新后的 Todo 对象
   *
   * @throws NotFoundException 如果 Todo 不存在或不属于当前用户
   *
   * 更新字段示例：
   * - title: 修改任务标题
   * - description: 修改描述
   * - priority: 修改优先级
   * - completed: 标记为完成/未完成
   * - dueDate: 修改截止日期
   * - categoryId: 移动到其他分类
   *
   * REST API 示例：
   * ```rest-api
   * mutation {
   *   updateTodo(
   *     id: "todo-uuid"
   *     updateTodoInput: {
   *       title: "更新后的标题"
   *       completed: true
   *     }
   *   ) {
   *     id title completed updatedAt
   *   }
   * }
   * ```
   */
  async update(id: string, updateTodoInput: UpdateTodoInput, userId: string): Promise<Todo> {
    // 步骤 1：权限验证和获取现有 Todo
    // findOne 会抛出异常如果：
    // - Todo 不存在
    // - Todo 不属于当前用户
    const todo = await this.findOne(id, userId);

    // 步骤 2：合并更新字段
    // Object.assign 将 updateTodoInput 中的所有字段合并到 todo 对象
    // 只有在 updateTodoInput 中提供的字段会被更新
    // 注意：updateTodoInput 中的字段都是可选的，所以不会意外覆盖字段
    Object.assign(todo, updateTodoInput);

    // 步骤 3：保存到数据库
    // save 会执行 UPDATE 语句
    // 返回包含任何自动生成的字段（如 updatedAt）的对象
    return this.todoRepository.save(todo);
  }

  /**
   * 删除待办事项
   *
   * @description
   * 删除指定的 Todo。首先验证权限，然后从数据库中删除。
   *
   * 业务流程：
   * 1. 调用 findOne 进行权限检查
   * 2. 调用 remove 从数据库删除
   * 3. 返回成功标志
   *
   * 删除的安全性：
   * - 只有 Todo 的所有者才能删除它
   * - 尝试删除不存在的或不属于用户的 Todo 会抛出异常
   *
   * 删除的级联影响（由 Todo Entity 的 cascade 配置决定）：
   * - 删除 Todo 时可能级联删除其评论（如果配置了 cascade）
   * - 删除 Todo 时会自动移除与标签的多对多关联
   *
   * @param id - 待办事项的 ID
   * @param userId - 当前用户的 ID（权限检查）
   *
   * @returns 返回 true 表示删除成功
   *         实际上，如果有问题会抛出异常，所以返回值总是 true
   *
   * @throws NotFoundException 如果 Todo 不存在或不属于当前用户
   *
   * REST API 示例：
   * ```rest-api
   * mutation {
   *   removeTodo(id: "todo-uuid")
   * }
   * ```
   */
  async remove(id: string, userId: string): Promise<boolean> {
    // 步骤 1：权限验证和获取 Todo
    // findOne 会检查该 Todo 是否属于当前用户
    const todo = await this.findOne(id, userId);

    // 步骤 2：删除 Todo
    // remove 方法会从数据库中删除该实体
    // 如果需要级联删除相关数据，在 Entity 的关联定义中配置 cascade: true
    await this.todoRepository.remove(todo);

    // 步骤 3：返回成功标志
    // 返回 true 表示删除成功
    return true;
  }
}
