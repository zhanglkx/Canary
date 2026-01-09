'use client';

import { useState, useEffect } from 'react';
import { tagApi, type Tag } from '@/lib/api';
import styles from './tag-selector.module.scss';

interface TagSelectorProps {
  selectedTags?: string[];
  onChange?: (tags: string[]) => void;
}

export function TagSelector({ selectedTags = [], onChange }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await tagApi.getAll();
      setTags(data);
    } catch (error) {
      console.error('加载标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    onChange?.(newTags);
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  return (
    <div className={styles.container}>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => toggleTag(tag.id)}
          className={selectedTags.includes(tag.id) ? styles.tagSelected : styles.tagUnselected}
          style={selectedTags.includes(tag.id) && tag.color ? { backgroundColor: tag.color } : {}}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
