/**
 * SearchResolver - 搜索功能解析器
 *
 * 功能说明：
 * 提供强大的搜索和过滤功能
 * 用户可以按标题、描述、优先级、状态等多维度搜索 Todo
 *
 * GraphQL 实现的搜索方式：
 * 与 REST API 的查询参数不同，GraphQL 使用输入类型来定义搜索条件
 * 这使得 API 更加灵活和类型安全
 */

import { Resolver, Query, Args, InputType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Todo } from '../todo/todo.entity';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

/**
 * 搜索和过滤输入 DTO
 *
 * 这个类定义了客户端在搜索 Todo 时可以提供的所有条件
 *
 * GraphQL 变更示例：
 * query {
 *   searchTodos(filter: {
 *     keyword: "紧急"
 *     priority: URGENT
 *     completed: false
 *   }) {
 *     id title priority
 *   }
 * }
 */
@InputType()
export class TodoFilterInput {
  /**
   * 关键词搜索（全文搜索）
   * 搜索 title 和 description 字段
   */
  @Field({ nullable: true })
  keyword?: string;

  /**
   * 按优先级过滤
   * 可选值：LOW, MEDIUM, HIGH, URGENT
   */
  @Field({ nullable: true })
  priority?: string;

  /**
   * 按完成状态过滤
   * true: 只显示已完成
   * false: 只显示未完成
   * null/undefined: 显示所有
   */
  @Field({ nullable: true })
  completed?: boolean;

  /**
   * 按分类 ID 过滤
   * 只显示指定分类下的 Todo
   */
  @Field({ nullable: true })
  categoryId?: string;

  /**
   * 按标签 ID 过滤
   * 只显示有该标签的 Todo
   */
  @Field({ nullable: true })
  tagId?: string;
}

/**
 * 搜索解析器
 */
@Resolver()
export class SearchResolver {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  /**
   * Query: 搜索和过滤 Todo
   *
   * GraphQL 查询示例：
   * query {
   *   searchTodos(filter: {
   *     keyword: "需求"
   *     priority: HIGH
   *     completed: false
   *   }) {
   *     id
   *     title
   *     description
   *     priority
   *     completed
   *     category { name }
   *     tags { name }
   *   }
   * }
   *
   * 功能说明：
   * 1. keyword: 模糊搜索 title 和 description（大小写不敏感）
   * 2. priority: 精确匹配优先级
   * 3. completed: 精确匹配完成状态
   * 4. categoryId: 精确匹配分类
   * 5. tagId: 搜索有该标签的 Todo
   *
   * 多条件搜索时，条件之间是 AND 关系
   * 例如：priority=HIGH AND completed=false AND keyword=xxx
   */
  @Query(() => [Todo])
  @UseGuards(GqlAuthGuard)
  async searchTodos(
    @Args('filter', { nullable: true }) filter: TodoFilterInput,
    @CurrentUser() user: User,
  ): Promise<Todo[]> {
    // 开始构建查询
    let query = this.todoRepository
      .createQueryBuilder('todo')
      .where('todo.userId = :userId', { userId: user.id });

    // 应用各种过滤条件
    // 为什么使用 QueryBuilder 而不是 find？
    // 因为 find 的 where 语句只能处理简单的条件
    // QueryBuilder 可以构建更复杂的查询，如 LIKE、IN 等

    // 1. 关键词搜索（全文搜索）
    if (filter?.keyword) {
      // ILike 是模糊匹配（数据库不敏感大小写）
      // 搜索 title 或 description 中包含关键词的 Todo
      query = query.andWhere(
        '(todo.title ILIKE :keyword OR todo.description ILIKE :keyword)',
        { keyword: `%${filter.keyword}%` },
      );
    }

    // 2. 优先级过滤
    if (filter?.priority) {
      query = query.andWhere('todo.priority = :priority', {
        priority: filter.priority,
      });
    }

    // 3. 完成状态过滤
    if (filter?.completed !== undefined && filter?.completed !== null) {
      query = query.andWhere('todo.completed = :completed', {
        completed: filter.completed,
      });
    }

    // 4. 分类过滤
    if (filter?.categoryId) {
      query = query.andWhere('todo.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    // 5. 标签过滤
    // 标签是多对多关系，所以需要使用 join
    if (filter?.tagId) {
      query = query
        .leftJoinAndSelect('todo.tags', 'tag')
        .andWhere('tag.id = :tagId', { tagId: filter.tagId });
    } else {
      // 即使没有过滤标签，也加载 tags 关系
      query = query.leftJoinAndSelect('todo.tags', 'tag');
    }

    // 加载其他关系
    query = query
      .leftJoinAndSelect('todo.user', 'user')
      .leftJoinAndSelect('todo.category', 'category')
      .leftJoinAndSelect('todo.comments', 'comment');

    // 按创建时间倒序排列（最新的在前）
    query = query.orderBy('todo.createdAt', 'DESC');

    // 执行查询并返回结果
    return await query.getMany();
  }

  /**
   * Query: 高级搜索和过滤
   *
   * 这是一个演示"如何处理更复杂的搜索"的例子
   * 实际应用中，你可能需要支持更多的搜索选项，如：
   * - 日期范围
   * - 多个标签的 OR/AND 关系
   * - 排序选项
   *
   * GraphQL 查询示例：
   * query {
   *   advancedSearch(
   *     keyword: "项目"
   *     priorities: [URGENT, HIGH]
   *     sortBy: "dueDate"
   *   ) {
   *     id title priority dueDate
   *   }
   * }
   */
  @Query(() => [Todo])
  @UseGuards(GqlAuthGuard)
  async advancedSearch(
    @CurrentUser() user: User,
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('priorities', { type: () => [String], nullable: true }) priorities?: string[],
    @Args('sortBy', { nullable: true }) sortBy?: string,
  ): Promise<Todo[]> {
    let query = this.todoRepository
      .createQueryBuilder('todo')
      .where('todo.userId = :userId', { userId: user.id });

    // 关键词搜索
    if (keyword) {
      query = query.andWhere(
        '(todo.title ILIKE :keyword OR todo.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 优先级多选
    if (priorities && priorities.length > 0) {
      query = query.andWhere('todo.priority IN (:...priorities)', {
        priorities,
      });
    }

    // 加载关系
    query = query
      .leftJoinAndSelect('todo.user', 'user')
      .leftJoinAndSelect('todo.category', 'category')
      .leftJoinAndSelect('todo.tags', 'tag');

    // 排序
    const orderBy = sortBy || 'createdAt';
    const validOrderFields = ['createdAt', 'dueDate', 'priority', 'completed'];

    if (validOrderFields.includes(orderBy)) {
      // 数字和日期倒序，字符串正序
      const order = ['priority'].includes(orderBy) ? 'DESC' : 'DESC';
      query = query.orderBy(`todo.${orderBy}`, order);
    } else {
      query = query.orderBy('todo.createdAt', 'DESC');
    }

    return await query.getMany();
  }
}
