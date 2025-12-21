/**
 * 评论表单组件 - REST API 版本
 */

'use client';

import { useState, FormEvent } from 'react';
import { commentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface CommentFormProps {
  todoId: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ todoId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('评论内容不能为空');
      return;
    }

    try {
      setLoading(true);
      await commentApi.create({ content, todoId });
      setContent('');
      onCommentAdded?.();
    } catch (err: any) {
      setError(err.message || '添加评论失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading}>
        添加评论
      </Button>
    </form>
  );
}
