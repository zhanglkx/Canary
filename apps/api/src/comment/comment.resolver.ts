/**
 * CommentResolver - GraphQL 解析器（Comment 端点）
 *
 * Resolver 的作用：
 * - 将 GraphQL 查询/变更 映射到 Service 方法
 * - 处理 GraphQL 请求和响应
 * - 实现权限检查和认证逻辑
 * - 负责数据转换和格式化
 *
 * 类比：
 * 如果 Service 是"菜单"，Resolver 就是"服务员"
 * Resolver 接收客户端订单，转发给 Service 处理
 */

import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Comment } from './comment.entity';
import { CommentService } from './comment.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/user.entity';
import { Todo } from '../todo/todo.entity';

/**
 * @Resolver(Comment)
 * 标记这个类为 GraphQL Comment 的解析器
 * 这个类中的所有方法都会处理与 Comment 相关的 GraphQL 操作
 */
@Resolver(() => Comment)
export class CommentResolver {
  /**
   * 构造函数注入 CommentService
   * 这样在方法中就可以调用 service 的各个方法
   */
  constructor(private commentService: CommentService) {}

  /**
   * Query: 查询某个 Todo 的所有评论
   *
   * GraphQL 查询示例：
   * query {
   *   comments(todoId: "abc-def-123") {
   *     id
   *     content
   *     author { username }
   *     createdAt
   *   }
   * }
   *
   * @Args('todoId') - GraphQL 参数
   * @returns 评论列表
   *
   * 为什么这个查询不需要认证？
   * 因为没有 @UseGuards(GqlAuthGuard)
   * 任何用户都可以查看公开的评论
   */
  @Query(() => [Comment])
  async comments(
    @Args('todoId', { type: () => ID }) todoId: string,
  ): Promise<Comment[]> {
    // 调用 Service 方法获取评论列表
    return this.commentService.findByTodoId(todoId);
  }

  /**
   * Mutation: 创建新评论
   *
   * GraphQL 变更示例：
   * mutation {
   *   createComment(createCommentInput: {
   *     content: "需要再讨论一下"
   *     todoId: "uuid"
   *   }) {
   *     id
   *     content
   *     author { username }
   *   }
   * }
   *
   * @UseGuards(GqlAuthGuard) - 只有认证用户才能创建评论
   * @CurrentUser() - 获取当前登录的用户对象
   * @Args - GraphQL 输入参数
   *
   * @returns 创建成功的评论对象
   */
  @Mutation(() => Comment)
  @UseGuards(GqlAuthGuard)
  async createComment(
    @Args('createCommentInput') createCommentInput: CreateCommentInput,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    // 调用 Service 创建评论
    // user 会被自动作为评论的作者
    return this.commentService.create(createCommentInput, user);
  }

  /**
   * Mutation: 更新评论
   *
   * GraphQL 变更示例：
   * mutation {
   *   updateComment(id: "comment-uuid", content: "更新后的内容") {
   *     id
   *     content
   *     updatedAt
   *   }
   * }
   *
   * @UseGuards(GqlAuthGuard) - 需要认证
   * @CurrentUser() - 用于权限检查（只能更新自己的评论）
   */
  @Mutation(() => Comment)
  @UseGuards(GqlAuthGuard)
  async updateComment(
    @Args('id', { type: () => ID }) id: string,
    @Args('content') content: string,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    return this.commentService.update(id, content, user.id);
  }

  /**
   * Mutation: 删除评论
   *
   * GraphQL 变更示例：
   * mutation {
   *   deleteComment(id: "comment-uuid")
   * }
   *
   * @returns 布尔值（成功为 true）
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteComment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.commentService.remove(id, user.id);
  }

  /**
   * Field Resolver: 获取评论的作者
   *
   * 这是一个字段级的解析器
   * 当 GraphQL 查询包含 author 字段时，这个方法会被调用
   *
   * 虽然 author 字段已经在 entity 中定义，
   * 但这里我们可以添加自定义逻辑（如果需要）
   *
   * 在这个例子中，我们只是返回已经加载的 author 对象
   */
  @ResolveField(() => User)
  author(@Parent() comment: Comment): Promise<User> {
    return Promise.resolve(comment.author);
  }

  /**
   * Field Resolver: 获取评论所属的 Todo
   *
   * 类似于 author，这是一个字段级的解析器
   */
  @ResolveField(() => Todo)
  todo(@Parent() comment: Comment): Promise<Todo> {
    return Promise.resolve(comment.todo);
  }
}
