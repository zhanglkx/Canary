/**
 * 评论列表组件 - REST API 版本
 */

'use client';

import { useState, useEffect } from 'react';
import { commentApi, type Comment } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import styles from './comment-list.module.less';

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
    return <div className={styles.loading}>加载中...</div>;
  }

  if (comments.length === 0) {
    return <div className={styles.empty}>还没有评论</div>;
  }

  return (
    <div className={styles.container}>
      {comments.map((comment) => (
        <div key={comment.id} className={styles.comment}>
          <div className={styles.header}>
            <div className={styles.authorInfo}>
              <span className={styles.authorName}>
                {comment.author.username}
              </span>
              <span className={styles.date}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            {user?.id === comment.authorId && (
              <button
                onClick={() => handleDelete(comment.id)}
                className={styles.deleteButton}
              >
                删除
              </button>
            )}
          </div>
          <p className={styles.content}>{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
