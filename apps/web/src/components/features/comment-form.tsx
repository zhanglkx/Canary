/**
 * 评论表单组件 - REST API 版本
 */

'use client';

import { useState, FormEvent } from 'react';
import { commentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import styles from './comment-form.module.less';

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
    <form onSubmit={handleSubmit} className={styles.form}>
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          rows={3}
          className={styles.textarea}
        />
      </div>

      {error && (
        <div className={styles.error}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading}>
        添加评论
      </Button>
    </form>
  );
}
