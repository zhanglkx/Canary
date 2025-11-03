/**
 * 评论列表组件
 *
 * 功能：
 * - 显示某个 Todo 的所有评论
 * - 支持删除当前用户的评论
 * - 实时显示评论内容和发布者信息
 * - 按时间倒序排列（最新的在上）
 *
 * 学习点：
 * 1. 如何使用 Apollo Client 的 useQuery 获取评论列表
 * 2. 如何处理多条件过滤（按 todoId 获取评论）
 * 3. 如何实现评论删除功能
 * 4. 如何处理加载、错误和空状态
 * 5. 前端-后端数据流
 *
 * 数据流：
 * GET_COMMENTS(todoId)
 *   ↓ (Apollo Query)
 * HTTP POST to NestJS GraphQL
 *   ↓ (CommentResolver.comments())
 * 返回该 Todo 的所有评论
 *   ↓ (Apollo 缓存)
 * 渲染评论列表
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_COMMENTS, DELETE_COMMENT } from '@/lib/graphql/comments';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CommentListProps {
  todoId: string;
}

/**
 * 评论列表组件
 *
 * Props:
 * - todoId: 要显示评论的 Todo ID
 *
 * 功能：
 * - 查询该 Todo 的所有评论
 * - 显示评论者信息和评论内容
 * - 允许评论作者删除自己的评论
 * - 处理删除后的缓存更新
 */
export function CommentList({ todoId }: CommentListProps) {
  const { user } = useAuth();
  const [error, setError] = useState('');

  /**
   * 查询：获取该 Todo 的所有评论
   *
   * GraphQL 查询：GET_COMMENTS
   * 参数：todoId
   *
   * 流程：
   * - 组件挂载时自动发送查询
   * - 后端返回按创建时间排序的评论列表
   * - Apollo 缓存结果
   * - 页面显示评论列表
   *
   * 学习点：
   * - 条件查询：只查询指定 Todo 的评论
   * - 自动缓存：再次打开同一 Todo 时不需要重新查询
   */
  const { data, loading, error: queryError, refetch } = useQuery(GET_COMMENTS, {
    variables: { todoId },
  });

  /**
   * 修改：删除评论
   *
   * GraphQL Mutation：DELETE_COMMENT
   * 参数：commentId
   *
   * 学习点：
   * 1. refetchQueries 可以自动刷新相关数据
   * 2. 也可以使用 update 函数手动更新 Apollo 缓存
   * 3. 删除权限由后端 Guard 验证
   *    - 只有评论作者或管理员可以删除
   *    - 防止用户删除他人评论
   */
  const [deleteComment, { loading: deleting }] = useMutation(DELETE_COMMENT, {
    refetchQueries: [{ query: GET_COMMENTS, variables: { todoId } }],
    onError: (error) => {
      setError(error.message);
    },
  });

  /**
   * 处理删除评论
   *
   * 流程：
   * 1. 确认用户确实想要删除
   * 2. 调用 deleteComment mutation
   * 3. 后端验证权限和删除记录
   * 4. 刷新评论列表
   * 5. 显示成功或错误消息
   */
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      await deleteComment({ variables: { id: commentId } });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  // 处理加载状态
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  // 处理查询错误
  if (queryError) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
        <p className="text-sm text-red-600 dark:text-red-400">
          加载评论失败：{queryError.message}
        </p>
      </div>
    );
  }

  const comments: Comment[] = data?.comments || [];

  return (
    <div className="space-y-4">
      {/* 错误信息展示 */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 空状态处理 */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>还没有评论，成为第一个评论者吧！</p>
        </div>
      ) : (
        /**
         * 评论列表渲染
         *
         * 学习点：
         * 1. key 使用 comment.id（稳定的标识符）
         * 2. 条件渲染删除按钮（仅当前用户是作者时显示）
         * 3. 日期格式化显示更友好的时间
         */
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-sm transition"
            >
              {/* 评论头部：作者信息和时间 */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {comment.author.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {comment.author.email}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(comment.createdAt).toLocaleDateString()} {' '}
                  {new Date(comment.createdAt).toLocaleTimeString()}
                </p>
              </div>

              {/* 评论内容 */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {comment.content}
              </p>

              {/* 删除按钮（仅当前用户是作者时显示） */}
              {user?.id === comment.author.id && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deleting}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {deleting ? '删除中...' : '删除'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
