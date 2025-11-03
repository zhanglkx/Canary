/**
 * TagResolver - GraphQL 解析器（Tag 端点）
 *
 * 支持的 GraphQL 操作：
 * - Query: tags（获取所有标签）
 * - Mutation: createTag（创建标签）
 * - Mutation: addTagToTodo（添加标签到 Todo）
 * - Mutation: removeTagFromTodo（从 Todo 移除标签）
 * - Mutation: deleteTag（删除标签）
 */

import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Tag } from './tag.entity';
import { TagService } from './tag.service';
import { CreateTagInput } from './dto/create-tag.input';
import { Todo } from '../todo/todo.entity';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';

@Resolver(() => Tag)
export class TagResolver {
  constructor(private tagService: TagService) {}

  /**
   * Query: 获取当前用户的所有标签
   *
   * GraphQL 查询示例：
   * query {
   *   tags {
   *     id
   *     name
   *     color
   *     todos { id title }
   *   }
   * }
   */
  @Query(() => [Tag])
  @UseGuards(GqlAuthGuard)
  async tags(@CurrentUser() user: User): Promise<Tag[]> {
    return this.tagService.findByUser(user.id);
  }

  /**
   * Query: 获取单个标签详情
   *
   * GraphQL 查询示例：
   * query {
   *   tag(id: "tag-uuid") {
   *     id
   *     name
   *     todos { id title }
   *   }
   * }
   */
  @Query(() => Tag)
  @UseGuards(GqlAuthGuard)
  async tag(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Tag> {
    return this.tagService.findOne(id, user.id);
  }

  /**
   * Mutation: 创建新标签
   *
   * GraphQL 变更示例：
   * mutation {
   *   createTag(createTagInput: {
   *     name: "紧急"
   *     color: "#FF5733"
   *   }) {
   *     id
   *     name
   *     color
   *   }
   * }
   */
  @Mutation(() => Tag)
  @UseGuards(GqlAuthGuard)
  async createTag(
    @Args('createTagInput') createTagInput: CreateTagInput,
    @CurrentUser() user: User,
  ): Promise<Tag> {
    return this.tagService.create(createTagInput, user);
  }

  /**
   * Mutation: 添加标签到 Todo（多对多关系）
   *
   * 这展示了如何处理多对多关系的操作
   *
   * GraphQL 变更示例：
   * mutation {
   *   addTagToTodo(tagId: "tag-uuid", todoId: "todo-uuid") {
   *     id
   *     title
   *     tags { id name }
   *   }
   * }
   *
   * @returns 更新后的 Todo（包含所有标签）
   */
  @Mutation(() => Todo)
  @UseGuards(GqlAuthGuard)
  async addTagToTodo(
    @Args('tagId', { type: () => ID }) tagId: string,
    @Args('todoId', { type: () => ID }) todoId: string,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    return this.tagService.addTagToTodo(tagId, todoId, user.id);
  }

  /**
   * Mutation: 从 Todo 移除标签
   *
   * GraphQL 变更示例：
   * mutation {
   *   removeTagFromTodo(tagId: "tag-uuid", todoId: "todo-uuid") {
   *     id
   *     title
   *     tags { id name }
   *   }
   * }
   */
  @Mutation(() => Todo)
  @UseGuards(GqlAuthGuard)
  async removeTagFromTodo(
    @Args('tagId', { type: () => ID }) tagId: string,
    @Args('todoId', { type: () => ID }) todoId: string,
    @CurrentUser() user: User,
  ): Promise<Todo> {
    return this.tagService.removeTagFromTodo(tagId, todoId, user.id);
  }

  /**
   * Mutation: 删除标签
   *
   * GraphQL 变更示例：
   * mutation {
   *   deleteTag(id: "tag-uuid")
   * }
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteTag(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.tagService.remove(id, user.id);
  }
}
