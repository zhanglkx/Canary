/**
 * Batch Resolver - 批量操作 GraphQL 端点
 *
 * 提供批量操作的 GraphQL mutations
 */

import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GraphQLInt } from 'graphql';
import { BatchService } from './batch.service';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';
import { Todo } from '../todo/todo.entity';

@Resolver()
export class BatchResolver {
  constructor(private readonly batchService: BatchService) {}

  /**
   * Mutation: 批量标记 Todo 为完成
   *
   * GraphQL 变更示例：
   * mutation {
   *   markTodosAsCompleted(todoIds: ["id1", "id2", "id3"])
   * }
   */
  @Mutation(() => GraphQLInt)
  @UseGuards(GqlAuthGuard)
  async markTodosAsCompleted(
    @Args('todoIds', { type: () => [String] }) todoIds: string[],
    @CurrentUser() user: User,
  ): Promise<number> {
    return this.batchService.markTodosAsCompleted(todoIds, user.id);
  }

  /**
   * Mutation: 批量删除 Todo
   *
   * GraphQL 变更示例：
   * mutation {
   *   deleteTodos(todoIds: ["id1", "id2", "id3"])
   * }
   */
  @Mutation(() => GraphQLInt)
  @UseGuards(GqlAuthGuard)
  async deleteTodos(
    @Args('todoIds', { type: () => [String] }) todoIds: string[],
    @CurrentUser() user: User,
  ): Promise<number> {
    return this.batchService.deleteTodos(todoIds, user.id);
  }

  /**
   * Mutation: 批量更新优先级
   *
   * GraphQL 变更示例：
   * mutation {
   *   updatePriority(todoIds: ["id1", "id2"], priority: "HIGH")
   * }
   */
  @Mutation(() => GraphQLInt)
  @UseGuards(GqlAuthGuard)
  async updatePriority(
    @Args('todoIds', { type: () => [String] }) todoIds: string[],
    @Args('priority') priority: string,
    @CurrentUser() user: User,
  ): Promise<number> {
    return this.batchService.updatePriority(todoIds, priority, user.id);
  }

  /**
   * Mutation: 批量添加标签到 Todo
   *
   * GraphQL 变更示例：
   * mutation {
   *   addTagsToTodos(
   *     todoIds: ["todo1", "todo2"]
   *     tagIds: ["tag1", "tag2"]
   *   )
   * }
   */
  @Mutation(() => GraphQLInt)
  @UseGuards(GqlAuthGuard)
  async addTagsToTodos(
    @Args('todoIds', { type: () => [String] }) todoIds: string[],
    @Args('tagIds', { type: () => [String] }) tagIds: string[],
    @CurrentUser() user: User,
  ): Promise<number> {
    return this.batchService.addTagsToTodos(todoIds, tagIds, user.id);
  }

  /**
   * Query: 获取所有待完成 Todo
   *
   * GraphQL 查询示例：
   * query {
   *   pendingTodos {
   *     id
   *     title
   *     priority
   *     dueDate
   *   }
   * }
   */
  @Query(() => [Todo])
  @UseGuards(GqlAuthGuard)
  async pendingTodos(@CurrentUser() user: User): Promise<Todo[]> {
    return this.batchService.getPendingTodos(user.id);
  }

  /**
   * Mutation: 清理已完成的旧 Todo（超过 30 天）
   *
   * GraphQL 变更示例：
   * mutation {
   *   cleanupCompletedTodos
   * }
   */
  @Mutation(() => GraphQLInt)
  @UseGuards(GqlAuthGuard)
  async cleanupCompletedTodos(@CurrentUser() user: User): Promise<number> {
    return this.batchService.cleanupCompletedTodos(user.id);
  }
}
