/**
 * 搜索表单组件
 *
 * 功能：
 * - 提供简单搜索和高级搜索功能
 * - 实时搜索结果显示
 * - 多条件组合过滤
 * - 搜索结果高亮显示
 *
 * 学习点：
 * 1. 如何实现实时搜索（debounce 优化性能）
 * 2. 简单搜索 vs 高级搜索的区别
 * 3. 多条件过滤（AND 逻辑）
 * 4. 前端响应式搜索建议
 *
 * 搜索类型：
 * 1. 简单搜索：SEARCH_TODOS
 *    - 按关键词在标题和描述中模糊匹配
 *    - 快速响应，用于实时搜索建议
 *
 * 2. 高级搜索：ADVANCED_SEARCH
 *    - 支持多条件组合
 *    - 条件包括：优先级、完成状态、分类、标签、日期范围
 *    - 用于精确查询
 *
 * 数据流：
 * 用户输入搜索条件
 *   ↓
 * 防抖处理（避免频繁请求）
 *   ↓
 * 发送 SEARCH_TODOS 或 ADVANCED_SEARCH 查询
 *   ↓
 * 后端执行 QueryBuilder 构建的动态查询
 *   ↓
 * 返回匹配结果
 *   ↓
 * 前端显示搜索结果列表
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { SEARCH_TODOS, ADVANCED_SEARCH } from '@/lib/graphql/search';
import { Input } from '@/components/ui/input';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  completed: boolean;
  dueDate?: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  createdAt: string;
}

interface SearchFormProps {
  onResultsChange?: (results: SearchResult[]) => void;
  showAdvanced?: boolean;
}

/**
 * 搜索表单组件
 *
 * Props:
 * - onResultsChange: 搜索结果改变时的回调
 * - showAdvanced: 是否显示高级搜索选项
 */
export function SearchForm({ onResultsChange, showAdvanced = false }: SearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // 高级搜索选项
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('createdAt');

  /**
   * 防抖处理
   *
   * 作用：
   * - 避免每次输入都发送请求
   * - 用户停止输入 500ms 后才发送请求
   * - 减少服务器压力
   * - 改善用户体验
   *
   * 学习点：
   * - 防抖（debounce）在实时搜索中很重要
   * - 通常设置 300-500ms 延迟
   * - 在 useEffect 中实现
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  /**
   * 简单搜索查询
   *
   * GraphQL 查询：SEARCH_TODOS
   * 参数：keyword
   *
   * 学习点：
   * - skip: 当关键词为空时不发送请求
   * - 自动缓存搜索结果
   * - 同一个关键词搜索多次不需要重新查询
   */
  const { data: simpleResults, loading: simpleLoading } = useQuery(SEARCH_TODOS, {
    variables: { keyword: debouncedKeyword },
    skip: !debouncedKeyword || useAdvanced,
  });

  /**
   * 高级搜索查询
   *
   * GraphQL 查询：ADVANCED_SEARCH
   * 参数：
   * - keyword: 搜索关键词
   * - priorities: 优先级数组
   * - completed: 完成状态
   * - categoryId: 分类 ID
   * - tagIds: 标签 ID 数组
   * - sortBy: 排序字段
   *
   * 学习点：
   * - 所有参数都是可选的
   * - 后端只使用提供的参数进行过滤
   * - 支持复杂的 AND 逻辑组合
   */
  const { data: advancedResults, loading: advancedLoading } = useQuery(ADVANCED_SEARCH, {
    variables: {
      keyword: debouncedKeyword,
      priorities: priorities.length > 0 ? priorities : undefined,
      completed: completed !== null ? completed : undefined,
      categoryId: categoryId || undefined,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
      sortBy,
    },
    skip: !useAdvanced || (!debouncedKeyword && priorities.length === 0 && completed === null),
  });

  const results: SearchResult[] = useAdvanced
    ? (advancedResults?.advancedSearch || [])
    : (simpleResults?.searchTodos || []);
  const loading = useAdvanced ? advancedLoading : simpleLoading;

  /**
   * 结果改变时调用回调
   *
   * 用途：
   * - 通知父组件搜索结果已改变
   * - 可用于实时更新 UI
   * - 支持在不同页面展示搜索结果
   */
  useEffect(() => {
    onResultsChange?.(results);
  }, [results, onResultsChange]);

  /**
   * 处理优先级过滤变化
   *
   * 学习点：
   * - 多选过滤器实现
   * - 允许选择多个优先级（OR 逻辑）
   * - 与其他过滤条件组合时为 AND 逻辑
   */
  const handlePriorityToggle = (priority: string) => {
    setPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  return (
    <div className="space-y-4">
      {/* 搜索输入框 */}
      <div className="relative">
        <Input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="搜索待办事项..."
          disabled={loading}
        />
      </div>

      {/* 模式切换 */}
      {showAdvanced && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="advanced-search"
            checked={useAdvanced}
            onChange={(e) => setUseAdvanced(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded cursor-pointer"
          />
          <label
            htmlFor="advanced-search"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            高级搜索
          </label>
        </div>
      )}

      {/* 高级搜索选项 */}
      {showAdvanced && useAdvanced && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          {/* 优先级过滤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              优先级
            </label>
            <div className="flex flex-wrap gap-2">
              {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityToggle(priority)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    priorities.includes(priority)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {priority === 'URGENT'
                    ? '紧急'
                    : priority === 'HIGH'
                    ? '高'
                    : priority === 'MEDIUM'
                    ? '中'
                    : '低'}
                </button>
              ))}
            </div>
          </div>

          {/* 完成状态过滤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              状态
            </label>
            <div className="flex gap-2">
              {[
                { label: '全部', value: null },
                { label: '待完成', value: false },
                { label: '已完成', value: true },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  onClick={() => setCompleted(option.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    completed === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 排序选项 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              排序
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         dark:bg-gray-700 dark:text-white"
            >
              <option value="createdAt">创建时间</option>
              <option value="dueDate">截止日期</option>
              <option value="priority">优先级</option>
            </select>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {showResults && (debouncedKeyword || useAdvanced) && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              搜索中...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              没有找到匹配的结果
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                            {result.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {result.category && (
                            <span
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: result.category.color }}
                            >
                              {result.category.name}
                            </span>
                          )}
                          {result.tags?.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            result.priority === 'URGENT'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : result.priority === 'HIGH'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : result.priority === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}
                        >
                          {result.priority === 'URGENT'
                            ? '紧急'
                            : result.priority === 'HIGH'
                            ? '高'
                            : result.priority === 'MEDIUM'
                            ? '中'
                            : '低'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
