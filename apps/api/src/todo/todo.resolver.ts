/**
 * GraphQL 解析器（Resolver）教学示例
 *
 * GraphQL 中的核心概念：
 * 1. Resolver - 定义如何获取和修改数据的类
 * 2. Query - 查询操作（类似 REST 的 GET）
 * 3. Mutation - 修改操作（类似 REST 的 POST/PUT/DELETE）
 * 4. Args - 请求参数
 * 5. Field - 字段解析器
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
 * Todo 解析器
 * @Resolver(() => Todo) - 声明这是一个 Todo 类型的解析器
 * @UseGuards(GqlAuthGuard) - 应用 GraphQL 认证守卫，确保只有认证用户可以访问
 */
@Resolver(() => Todo)
@UseGuards(GqlAuthGuard)
export class TodoResolver {
  /**
   * 构造函数 - 依赖注入 TodoService
   * NestJS 使用依赖注入来管理服务实例
   */
  constructor(private readonly todoService: TodoService) {}

  /**
   * 创建待办事项
   *
   * @Mutation 装饰器表示这是一个 GraphQL mutation 操作
   * 对应的 GraphQL 操作：
   * mutation {
   *   createTodo(createTodoInput: {
   *     title: "学习 GraphQL",
   *     description: "了解 Query 和 Mutation"
   *   }) {
   *     id
   *     title
   *   }
   * }
   */
  @Mutation(() => Todo)
  async createTodo(
    @Args('createTodoInput') createTodoInput: CreateTodoInput,
    @CurrentUser() user: User,
  ) {
    return this.todoService.create(createTodoInput, user.id);
  }

  /**
   * 查询所有待办事项
   *
   * @Query 装饰器表示这是一个 GraphQL query 操作
   * 返回类型是 Todo 数组：[Todo]
   *
   * 对应的 GraphQL 查询：
   * query {
   *   todos {
   *     id
   *     title
   *     completed
   *   }
   * }
   */
  @Query(() => [Todo], { name: 'todos' })
  async findAll(@CurrentUser() user: User) {
    return this.todoService.findAll(user.id);
  }

  /**
   * 查询单个待办事项
   *
   * @Args 装饰器用于接收查询参数
   * type: () => ID 表示参数类型是 GraphQL 的 ID 类型
   *
   * 对应的 GraphQL 查询：
   * query {
   *   todo(id: "123") {
   *     id
   *     title
   *     completed
   *   }
   * }
   */
  @Query(() => Todo, { name: 'todo' })
  async findOne(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: User) {
    return this.todoService.findOne(id, user.id);
  }

  @Mutation(() => Todo)
  async updateTodo(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTodoInput') updateTodoInput: UpdateTodoInput,
    @CurrentUser() user: User,
  ) {
    return this.todoService.update(id, updateTodoInput, user.id);
  }

  @Mutation(() => Boolean)
  async removeTodo(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: User) {
    return this.todoService.remove(id, user.id);
  }
}
