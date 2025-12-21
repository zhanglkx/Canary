/**
 * 评论列表组件 - REST API 版本
 */

'use client';

import { useState, useEffect } from 'react';
import { commentApi, type Comment } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

interface CommentListProps {
  todoId: string;
}

export function CommentList({ todoId }: CommentListProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [todoId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentApi.getByTodoId(todoId);
      setComments(data);
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条评论吗？')) {
      try {
        await commentApi.delete(id);
        await loadComments();
      } catch (error: any) {
        alert(error.message || '删除失败');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">加载中...</div>;
  }

  if (comments.length === 0) {
    return <div className="text-center py-4 text-gray-500">还没有评论</div>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                {comment.author.username}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            {user?.id === comment.authorId && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                删除
              </button>
            )}
          </div>
          <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
