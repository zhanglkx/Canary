'use client';

import { useState, useEffect } from 'react';
import { tagApi, type Tag } from '@/lib/api';

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
    return <div className="text-sm text-gray-500">加载中...</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => toggleTag(tag.id)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedTags.includes(tag.id)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}
          style={selectedTags.includes(tag.id) && tag.color ? { backgroundColor: tag.color } : {}}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
