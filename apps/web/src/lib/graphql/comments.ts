/**
 * 评论模块 GraphQL 操作
 *
 * 这个文件定义了所有与评论相关的 GraphQL 查询和变更操作。
 *
 * 学习点：
 * 1. 如何在前端定义 GraphQL 查询和 Mutation
 * 2. 如何使用变量参数化查询
 * 3. 如何定义查询返回的数据结构
 * 4. Apollo Client 如何使用这些定义自动生成 TypeScript 类型
 *
 * 对应后端：
 * - CommentResolver (apps/api/src/comment/comment.resolver.ts)
 * - CommentService (apps/api/src/comment/comment.service.ts)
 */

import { gql } from '@apollo/client';

/**
 * 获取待办事项的所有评论
 *
 * GraphQL 查询概览：
 * - 参数：todoId（待办事项 ID）
 * - 返回：评论列表数组
 *
 * 数据结构：
 * {
 *   id: 评论的唯一标识
 *   content: 评论内容
 *   author: 评论者信息（用户）
 *   createdAt: 创建时间
 *   updatedAt: 更新时间
 * }
 *
 * 使用示例：
 * ```
 * const { data, loading } = useQuery(GET_COMMENTS, {
 *   variables: { todoId: 'todo-123' }
 * });
 *
 * if (loading) return <Loading />;
 * const comments = data?.comments;
 * ```
 *
 * 对应后端：
 * @Query(() => [Comment])
 * async comments(@Args('todoId') todoId: string): Promise<Comment[]>
 */
export const GET_COMMENTS = gql`
  query GetComments($todoId: ID!) {
    /**
     * comments: 后端返回的根字段名
     * (todoId: $todoId): 参数，从 variables 中获取
     */
    comments(todoId: $todoId) {
      id
      content
      author {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * 创建新评论
 *
 * GraphQL Mutation 概览：
 * - 参数：todoId（所属的待办事项）、content（评论内容）
 * - 作用：在数据库中创建新的评论记录
 * - 返回：新创建的评论对象
 *
 * 权限控制：
 * - 后端使用 @UseGuards(GqlAuthGuard) 确保用户已登录
 * - 自动将 author 设置为当前认证用户
 * - 任何已登录用户都可以发表评论
 *
 * 使用示例：
 * ```
 * const [createComment] = useMutation(CREATE_COMMENT);
 *
 * await createComment({
 *   variables: {
 *     todoId: 'todo-123',
 *     content: '这个任务需要更多信息'
 *   }
 * });
 * ```
 *
 * 对应后端：
 * @Mutation(() => Comment)
 * @UseGuards(GqlAuthGuard)
 * async createComment(
 *   @Args('todoId') todoId: string,
 *   @Args('content') content: string,
 *   @CurrentUser() user: User
 * ): Promise<Comment>
 */
export const CREATE_COMMENT = gql`
  mutation CreateComment($todoId: ID!, $content: String!) {
    /**
     * createComment: 后端 Mutation 的名称
     * 参数会自动通过 DTO 验证
     */
    createComment(todoId: $todoId, content: $content) {
      id
      content
      author {
        id
        username
      }
      createdAt
    }
  }
`;

/**
 * 更新评论内容
 *
 * GraphQL Mutation 概览：
 * - 参数：id（评论 ID）、content（新内容）
 * - 作用：修改现有评论的内容
 * - 返回：更新后的评论对象
 *
 * 权限控制：
 * - 后端检查当前用户是否是评论的作者
 * - 只有评论作者才能修改评论
 * - 如果非作者尝试修改会返回错误
 *
 * 使用示例：
 * ```
 * const [updateComment] = useMutation(UPDATE_COMMENT);
 *
 * await updateComment({
 *   variables: {
 *     id: 'comment-123',
 *     content: '更新后的评论内容'
 *   }
 * });
 * ```
 *
 * 对应后端：
 * @Mutation(() => Comment)
 * @UseGuards(GqlAuthGuard)
 * async updateComment(
 *   @Args('id') id: string,
 *   @Args('content') content: string,
 *   @CurrentUser() user: User
 * ): Promise<Comment>
 */
export const UPDATE_COMMENT = gql`
  mutation UpdateComment($id: ID!, $content: String!) {
    updateComment(id: $id, content: $content) {
      id
      content
      updatedAt
    }
  }
`;

/**
 * 删除评论
 *
 * GraphQL Mutation 概览：
 * - 参数：id（评论 ID）
 * - 作用：从数据库中删除指定的评论
 * - 返回：布尔值（true 表示删除成功）
 *
 * 权限控制：
 * - 后端检查当前用户是否是评论的作者或 admin
 * - 只有评论作者或管理员才能删除
 * - 保护用户隐私和防止恶意删除
 *
 * 使用示例：
 * ```
 * const [deleteComment] = useMutation(DELETE_COMMENT);
 *
 * await deleteComment({
 *   variables: {
 *     id: 'comment-123'
 *   }
 * });
 * ```
 *
 * 对应后端：
 * @Mutation(() => Boolean)
 * @UseGuards(GqlAuthGuard)
 * async deleteComment(
 *   @Args('id') id: string,
 *   @CurrentUser() user: User
 * ): Promise<boolean>
 */
export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;
