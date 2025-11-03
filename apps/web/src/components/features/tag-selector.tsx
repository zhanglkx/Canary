/**
 * 标签选择器组件
 *
 * 功能：
 * - 显示当前用户的所有标签
 * - 允许为 Todo 添加/移除标签
 * - 实时显示标签列表
 * - 支持创建新标签
 *
 * 学习点：
 * 1. 多对多关系管理（Todo ↔ Tag）
 * 2. 如何同时管理多个 mutation（添加和移除标签）
 * 3. 标签重复使用（一个标签可用于多个 Todo）
 * 4. 缓存更新策略
 *
 * 数据流：
 * 1. 页面加载时查询所有标签：GET_TAGS
 * 2. 显示该 Todo 当前的标签
 * 3. 用户点击添加/移除标签
 * 4. 发送 ADD_TAG_TO_TODO 或 REMOVE_TAG_FROM_TODO mutation
 * 5. 后端更新数据库中的 Todo-Tag 关系
 * 6. 前端缓存更新，标签列表刷新
 *
 * 重要概念：
 * - Todo 和 Tag 是多对多关系
 * - 删除标签时不会删除 Todo 本身
 * - 删除 Tag 时会删除所有关联的 Todo-Tag 关系
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TAGS, ADD_TAG_TO_TODO, REMOVE_TAG_FROM_TODO, CREATE_TAG } from '@/lib/graphql/tags';
import { GET_TODOS } from '@/lib/graphql/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  todoId: string;
  currentTags?: Tag[];
}

/**
 * 标签选择器组件
 *
 * Props:
 * - todoId: 要管理标签的 Todo ID
 * - currentTags: 该 Todo 当前的标签列表
 *
 * 功能：
 * - 显示所有可用标签
 * - 允许添加/移除标签
 * - 支持创建新标签
 */
export function TagSelector({ todoId, currentTags = [] }: TagSelectorProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [error, setError] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  /**
   * 查询：获取当前用户的所有标签
   *
   * GraphQL 查询：GET_TAGS
   * 返回：标签列表和每个标签的使用统计
   *
   * 学习点：
   * - 标签是用户级别的资源
   * - 后端自动过滤只返回当前用户的标签
   * - 支持跨 Todo 重复使用标签
   */
  const { data: tagsData, loading: tagsLoading } = useQuery(GET_TAGS);

  /**
   * 修改：向 Todo 添加标签
   *
   * GraphQL Mutation：ADD_TAG_TO_TODO
   * 参数：
   * - tagId: 标签 ID
   * - todoId: Todo ID
   *
   * 学习点：
   * 1. 这是建立多对多关系的操作
   * 2. 后端会创建 Todo-Tag 关联记录
   * 3. 使用 refetchQueries 刷新 Todo 数据
   *    - Todo 对象会包含新增的标签
   * 4. 权限验证：后端确保标签和 Todo 都属于当前用户
   */
  const [addTag, { loading: addingTag }] = useMutation(ADD_TAG_TO_TODO, {
    refetchQueries: [{ query: GET_TODOS }],
    onError: (error) => {
      setError(error.message);
    },
  });

  /**
   * 修改：从 Todo 移除标签
   *
   * GraphQL Mutation：REMOVE_TAG_FROM_TODO
   * 参数：
   * - tagId: 标签 ID
   * - todoId: Todo ID
   *
   * 学习点：
   * 1. 这只是删除关联关系，不删除标签本身
   * 2. 标签可以继续被其他 Todo 使用
   * 3. 后端删除 Todo-Tag 记录
   * 4. 前端更新 Todo 的标签列表
   */
  const [removeTag, { loading: removingTag }] = useMutation(REMOVE_TAG_FROM_TODO, {
    refetchQueries: [{ query: GET_TODOS }],
    onError: (error) => {
      setError(error.message);
    },
  });

  /**
   * 修改：创建新标签
   *
   * GraphQL Mutation：CREATE_TAG
   * 参数：
   * - name: 标签名称
   * - color: 标签颜色（十六进制）
   *
   * 学习点：
   * 1. 用户可以动态创建新标签
   * 2. 标签颜色用十六进制表示
   * 3. 创建后自动添加到当前 Todo
   * 4. refetchQueries 刷新标签列表
   */
  const [createTag, { loading: creatingTag }] = useMutation(CREATE_TAG, {
    refetchQueries: [{ query: GET_TAGS }],
    onCompleted: (data) => {
      // 创建标签后自动添加到 Todo
      addTag({
        variables: {
          tagId: data.createTag.id,
          todoId,
        },
      });
      setNewTagName('');
      setIsCreatingTag(false);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  /**
   * 处理添加标签
   *
   * 流程：
   * 1. 检查该标签是否已添加
   * 2. 调用 addTag mutation
   * 3. 后端创建关联关系
   * 4. 前端显示新标签
   */
  const handleAddTag = (tagId: string) => {
    const tagExists = currentTags.some((t) => t.id === tagId);
    if (tagExists) {
      setError('该标签已添加');
      return;
    }

    addTag({ variables: { tagId, todoId } });
  };

  /**
   * 处理移除标签
   *
   * 流程：
   * 1. 调用 removeTag mutation
   * 2. 后端删除关联关系
   * 3. 前端更新标签列表
   */
  const handleRemoveTag = (tagId: string) => {
    removeTag({ variables: { tagId, todoId } });
  };

  /**
   * 处理创建新标签
   *
   * 流程：
   * 1. 验证标签名称不为空
   * 2. 调用 createTag mutation
   * 3. onCompleted 自动添加到 Todo
   * 4. 清空表单
   */
  const handleCreateTag = async () => {
    setError('');

    if (!newTagName.trim()) {
      setError('标签名称不能为空');
      return;
    }

    try {
      await createTag({
        variables: {
          name: newTagName.trim(),
          color: newTagColor,
        },
      });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  const allTags: Tag[] = tagsData?.tags || [];
  const currentTagIds = currentTags.map((t) => t.id);

  return (
    <div className="space-y-4">
      {/* 错误信息 */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 当前标签显示 */}
      {currentTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            当前标签
          </label>
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: tag.color }}
              >
                <span>{tag.name}</span>
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  disabled={removingTag}
                  className="hover:opacity-70 transition"
                  title="移除标签"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 标签选择器 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          可用标签
        </label>
        {tagsLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">加载中...</div>
        ) : allTags.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            还没有标签，创建一个吧
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleAddTag(tag.id)}
                disabled={addingTag || currentTagIds.includes(tag.id)}
                className="px-3 py-1 rounded-full text-sm text-white opacity-70 hover:opacity-100
                           disabled:opacity-50 disabled:cursor-not-allowed transition"
                style={{ backgroundColor: tag.color }}
              >
                + {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 创建新标签 */}
      <div>
        <button
          type="button"
          onClick={() => setIsCreatingTag(!isCreatingTag)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isCreatingTag ? '取消' : '+ 创建新标签'}
        </button>

        {isCreatingTag && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
            <Input
              label="标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="输入标签名称"
              disabled={creatingTag}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                标签颜色
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-8 w-12 rounded cursor-pointer"
                  disabled={creatingTag}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{newTagColor}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateTag}
                disabled={creatingTag}
                loading={creatingTag}
                className="px-3 py-1 text-sm"
              >
                创建
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsCreatingTag(false)}
                className="px-3 py-1 text-sm"
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
