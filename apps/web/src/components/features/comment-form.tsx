/**
 * 评论表单组件
 *
 * 功能：
 * - 允许用户向 Todo 添加评论
 * - 验证评论内容不为空
 * - 实时显示发送状态
 * - 成功发送后清空表单
 *
 * 学习点：
 * 1. 如何使用 useMutation 执行 GraphQL 修改操作
 * 2. 如何处理表单状态和验证
 * 3. 如何在修改后更新关联查询的缓存
 * 4. refetchQueries 的作用和使用
 *
 * 数据流：
 * 用户输入评论
 *   ↓
 * 点击提交按钮
 *   ↓
 * handleSubmit 验证并构建 mutation 变量
 *   ↓
 * CREATE_COMMENT mutation 发送到后端
 *   ↓
 * NestJS CommentResolver.createComment() 处理
 *   ↓
 * 返回新创建的评论
 *   ↓
 * refetchQueries 自动刷新 GET_COMMENTS 查询
 *   ↓
 * CommentList 组件自动更新显示新评论
 *   ↓
 * 表单清空，用户看到他的评论出现在列表中
 */

'use client';

import { useState, FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_COMMENT } from '@/lib/graphql/comments';
import { GET_COMMENTS } from '@/lib/graphql/comments';
import { Button } from '@/components/ui/button';

interface CommentFormProps {
  todoId: string;
}

/**
 * 评论表单组件
 *
 * Props:
 * - todoId: 要添加评论的 Todo ID
 *
 * 功能：
 * - 提供评论输入框
 * - 验证评论内容
 * - 发送评论到后端
 * - 自动刷新评论列表
 */
export function CommentForm({ todoId }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  /**
   * 修改：创建评论
   *
   * GraphQL Mutation：CREATE_COMMENT
   * 参数：
   * - todoId: 要添加评论的 Todo ID
   * - content: 评论内容
   *
   * 学习点：
   * 1. refetchQueries 自动刷新相关查询
   *    - 参数必须包含相同的 variables
   *    - Apollo 会自动发送新的查询请求
   * 2. onCompleted 在修改成功后执行
   *    - 清空表单
   *    - 可以显示成功提示
   * 3. 权限由后端 @UseGuards(GqlAuthGuard) 验证
   *    - 只有已登录用户可以创建评论
   *    - 自动使用当前用户作为评论作者
   */
  const [createComment, { loading }] = useMutation(CREATE_COMMENT, {
    /**
     * refetchQueries 配置
     *
     * 作用：修改成功后自动刷新这些查询
     * 这样 CommentList 组件会自动收到新数据并更新
     *
     * 重要：variables 必须与原查询相同
     */
    refetchQueries: [{ query: GET_COMMENTS, variables: { todoId } }],
    onCompleted: () => {
      setContent('');
      setError('');
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  /**
   * 表单提交处理器
   *
   * 流程：
   * 1. 阻止默认表单提交
   * 2. 验证评论内容不为空
   * 3. 调用 createComment mutation
   * 4. onCompleted 清空表单
   * 5. 用户看到新评论出现在列表中
   *
   * 学习点：
   * - 前端验证（用户体验）+ 后端验证（安全）
   * - 使用 trim() 防止只有空格的提交
   * - 显示详细的错误消息
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('评论不能为空');
      return;
    }

    try {
      await createComment({
        variables: {
          todoId,
          content: content.trim(),
        },
      });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 错误信息展示 */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 评论输入框 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          添加评论
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入你的评论..."
          rows={3}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     dark:bg-gray-800 dark:text-white
                     disabled:bg-gray-100 dark:disabled:bg-gray-900
                     resize-none"
        />
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          loading={loading}
        >
          {loading ? '发布中...' : '发布评论'}
        </Button>
      </div>

      {/* 辅助信息 */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {content.length} / 500 字符
      </p>
    </form>
  );
}
