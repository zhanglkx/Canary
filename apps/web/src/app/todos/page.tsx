/**
 * 待办事项管理页面 - 完整的前后端交互示例
 *
 * 这个页面展示了 Next.js + Apollo Client + GraphQL 的完整工作流程。
 *
 * 学习目标：
 * 1. 如何使用 Apollo Client 查询和修改数据
 * 2. 如何管理前端的复杂状态
 * 3. 如何实现过滤、搜索和排序功能
 * 4. 如何处理错误和加载状态
 * 5. 如何在前端实现 CRUD 操作
 *
 * 前后端交互流程：
 * 前端用户操作
 *   ↓
 * React State 更新
 *   ↓
 * Apollo Client 发送 GraphQL Query/Mutation
 *   ↓
 * HTTP POST 请求到 NestJS GraphQL 服务器
 *   ↓
 * GraphQL 解析和验证
 *   ↓
 * Resolver 处理请求
 *   ↓
 * Service 执行业务逻辑
 *   ↓
 * TypeORM 查询数据库
 *   ↓
 * 数据返回到前端
 *   ↓
 * Apollo Client 更新缓存
 *   ↓
 * React 重新渲染组件
 *   ↓
 * 用户看到更新的 UI
 */

'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_TODOS, GET_CATEGORIES } from '@/lib/graphql/queries';
import { CREATE_TODO, UPDATE_TODO, REMOVE_TODO } from '@/lib/graphql/mutations';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoSSR } from '@/components/ui/no-ssr';

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  HIGH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const priorityLabels = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急',
};

export default function TodosPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  /**
   * 表单状态管理
   *
   * 学习点：
   * 1. 分离关注点 - 表单状态独立于查询状态
   * 2. 可编辑模式 - editingTodo 不为 null 时，表单切换到编辑模式
   * 3. 错误处理 - 表单级别的错误管理
   *
   * 流程：
   * - 用户输入 → useState 更新状态
   * - 点击保存 → handleSubmit 调用 createTodo 或 updateTodo mutation
   * - mutation 完成 → resetForm() 清空状态
   * - Apollo Client 自动刷新缓存 → UI 更新
   */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [error, setError] = useState('');

  /**
   * 搜索和过滤状态管理
   *
   * 学习点：
   * 1. 与表单状态分离 - 搜索不修改数据库，只改变前端显示
   * 2. 多条件过滤 - searchTerm、filterStatus、filterPriority、filterCategory、sortBy
   * 3. 性能优化 - 使用 useMemo 计算过滤结果，避免重复计算
   *
   * 数据流：
   * - 用户输入搜索/过滤条件
   * - setState 更新本地状态
   * - useMemo 依赖这些状态，计算 filteredAndSortedTodos
   * - React 重新渲染列表显示过滤后的结果
   * - 不发送任何请求到后端，完全前端操作
   */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'priority'>('createdAt');

  /**
   * 认证状态检查和重定向
   *
   * 学习点：
   * 1. 使用 useEffect 处理副作用（路由重定向）
   * 2. 避免在渲染期间直接调用 router.push
   * 3. 条件执行 - 仅在 isAuthenticated 为 false 时执行
   *
   * 最佳实践：
   * - 将 router.push 放在 useEffect 中，不要在组件体内调用
   * - 避免在渲染过程中改变路由，会导致性能问题
   */
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  /**
   * 查询：获取当前用户的所有待办事项
   *
   * GraphQL 查询：GET_TODOS
   * 后端对应：TodoResolver.todos() 方法
   *
   * 学习点：
   * 1. useQuery hook - 自动发送 GraphQL 查询到后端
   * 2. skip 条件 - 当 isAuthenticated 为 false 时跳过查询
   * 3. 缓存自动管理 - Apollo Client 自动缓存结果
   * 4. refetch 函数 - 手动刷新数据
   *
   * 流程：
   * - 组件挂载时，如果已认证，自动发送 GET_TODOS 查询
   * - 后端返回当前用户的所有 Todos
   * - 结果存储在 todosData.todos 中
   * - 数据变化时自动重新获取
   */
  const { data: todosData, loading: todosLoading, refetch } = useQuery(GET_TODOS, {
    skip: !isAuthenticated,
  });

  /**
   * 查询：获取当前用户的所有分类
   *
   * GraphQL 查询：GET_CATEGORIES
   * 后端对应：CategoryResolver.categories() 方法
   *
   * 学习点：
   * 1. 多个独立查询 - 前端可以同时进行多个 useQuery
   * 2. 缓存共享 - 多个组件查询同一个字段会共享缓存
   * 3. 加载状态管理 - categoriesLoading 跟踪加载状态
   *
   * 用途：
   * - 填充分类选择器
   * - 提供分类过滤选项
   * - 显示分类标签
   */
  const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_CATEGORIES, {
    skip: !isAuthenticated,
  });

  /**
   * 修改：创建新的待办事项
   *
   * GraphQL Mutation：CREATE_TODO
   * 后端对应：TodoResolver.createTodo() 方法
   *
   * 学习点：
   * 1. useMutation hook - 返回函数用于执行修改操作
   * 2. onCompleted 回调 - 修改成功后执行清理工作
   * 3. onError 回调 - 修改失败时显示错误信息
   * 4. refetch() - 重新获取列表数据，保证 UI 同步
   *
   * 执行流程：
   * - handleSubmit 调用 createTodo()
   * - Apollo Client 发送 CREATE_TODO mutation
   * - NestJS 后端接收请求，验证数据，创建 Todo
   * - 后端返回新创建的 Todo
   * - onCompleted 触发 → resetForm() 清空表单 → refetch() 刷新列表
   * - 页面显示新增的 Todo
   */
  const [createTodo, { loading: creating }] = useMutation(CREATE_TODO, {
    onCompleted: () => {
      resetForm();
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  /**
   * 修改：更新现有的待办事项
   *
   * GraphQL Mutation：UPDATE_TODO
   * 后端对应：TodoResolver.updateTodo() 方法
   *
   * 学习点：
   * 1. 与 createTodo 类似的流程，但传递 todoId 和要更新的字段
   * 2. 部分更新 - 只更新提供的字段，其他字段保持不变
   * 3. 乐观更新可选 - Apollo 支持乐观 UI 更新
   *
   * 使用场景：
   * - 编辑现有的 Todo 内容
   * - 修改优先级、分类、截止日期等
   * - 用户点击"更新"按钮时触发
   */
  const [updateTodo, { loading: updating }] = useMutation(UPDATE_TODO, {
    onCompleted: () => {
      resetForm();
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  /**
   * 修改：删除待办事项
   *
   * GraphQL Mutation：REMOVE_TODO
   * 后端对应：TodoResolver.removeTodo() 方法
   *
   * 学习点：
   * 1. 删除操作通常返回 Boolean 而不是完整对象
   * 2. 删除后需要刷新列表显示最新状态
   * 3. 前端实现确认对话框防止误删
   *
   * 执行流程：
   * - handleDelete 先显示确认对话框
   * - 用户确认后调用 removeTodo()
   * - 后端删除数据库中的记录
   * - onCompleted 触发 refetch() 更新列表
   * - 被删除的 Todo 从列表中消失
   */
  const [removeTodo] = useMutation(REMOVE_TODO, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  /**
   * 重置表单状态
   *
   * 学习点：
   * 1. 提取为单独的函数便于复用
   * 2. 确保清空所有相关状态
   * 3. 用于创建/编辑完成后的清理工作
   */
  const resetForm = () => {
    setEditingTodo(null);
    setTitle('');
    setDescription('');
    setCategoryId('');
    setPriority('MEDIUM');
    setDueDate('');
    setError('');
  };

  /**
   * 计算过滤和排序后的待办事项列表
   *
   * 学习点 - 性能优化：
   * 1. useMemo 记忆化计算结果，避免每次渲染都重新计算
   * 2. 依赖数组指定了哪些值改变时需要重新计算
   * 3. 依赖数组包含：todosData、searchTerm、4个过滤条件、sortBy
   * 4. 当这些值不变时，useMemo 返回缓存的结果
   * 5. 此优化对于大型列表（1000+条）特别重要
   *
   * 业务逻辑 - 多条件过滤（AND 关系）：
   * 1. 搜索过滤 - 标题或描述包含搜索词
   * 2. 状态过滤 - 所有、已完成、待完成
   * 3. 优先级过滤 - 选中的优先级
   * 4. 分类过滤 - 选中的分类或无分类
   * 5. 所有过滤条件都需要满足（AND 逻辑）
   *
   * 排序策略：
   * 1. 按创建时间：最新的先显示（descending）
   * 2. 按截止日期：最近的先显示（ascending）
   * 3. 按优先级：紧急→高→中→低
   *
   * 数据流：
   * - 用户改变搜索/过滤条件
   * - setState 更新状态值
   * - React 重新渲染
   * - useMemo 检查依赖数组，发现值改变
   * - 重新执行过滤逻辑
   * - 返回新的过滤结果
   * - React 用新数据重新渲染列表
   */
  const filteredAndSortedTodos = useMemo(() => {
    if (!todosData?.todos) return [];

    let filtered = todosData.todos.filter((todo: Todo) => {
      /**
       * 搜索过滤：在标题和描述中查找关键词
       * 不区分大小写的模糊匹配
       */
      const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      /**
       * 状态过滤：显示全部、仅已完成、或仅待完成
       */
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'completed' && todo.completed) ||
        (filterStatus === 'pending' && !todo.completed);

      /**
       * 优先级过滤：用户选中的优先级
       */
      const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;

      /**
       * 分类过滤：
       * - 'all' 显示所有分类
       * - 'uncategorized' 显示没有分类的 Todo
       * - 具体 categoryId 显示该分类的 Todo
       */
      const matchesCategory = filterCategory === 'all' ||
        (filterCategory === 'uncategorized' && !todo.category) ||
        todo.category?.id === filterCategory;

      /**
       * AND 逻辑：所有条件都必须满足
       */
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    /**
     * 排序逻辑：按用户选择的字段排序
     */
    filtered.sort((a: Todo, b: Todo) => {
      switch (sortBy) {
        /**
         * 按截止日期排序：
         * - 没有截止日期的放在最后
         * - 有截止日期的按日期升序排列
         */
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

        /**
         * 按优先级排序：紧急 > 高 > 中 > 低
         */
        case 'priority':
          const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];

        /**
         * 默认：按创建时间降序排列（最新的先）
         */
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [todosData?.todos, searchTerm, filterStatus, filterPriority, filterCategory, sortBy]);

  /**
   * 表单提交处理器
   *
   * 流程：
   * 1. 阻止默认表单提交
   * 2. 清空之前的错误信息
   * 3. 验证标题非空
   * 4. 构建变量对象，将空值转为 null（GraphQL 标准）
   * 5. 根据 editingTodo 状态决定是创建还是更新
   * 6. 执行相应的 mutation
   * 7. onCompleted 会自动清空表单和刷新列表
   *
   * 学习点：
   * - 表单验证在前端进行
   * - 后端也会再次验证（深度防御）
   * - 使用 null 而不是 undefined，因为 GraphQL 默认排除 undefined
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }

    try {
      const variables = {
        title,
        description: description || null,
        categoryId: categoryId || null,
        priority,
        dueDate: dueDate || null,
      };

      if (editingTodo) {
        await updateTodo({
          variables: {
            id: editingTodo.id,
            ...variables,
          },
        });
      } else {
        await createTodo({
          variables,
        });
      }
    } catch (err) {
      // Error handled by onError callback
    }
  };

  /**
   * 编辑事件处理器
   *
   * 流程：
   * 1. 设置 editingTodo，表单切换到编辑模式
   * 2. 填充表单中的所有字段
   * 3. 注意 dueDate 的处理：截断时间部分（split('T')[0]）
   *    因为 HTML date input 需要 YYYY-MM-DD 格式
   *
   * 学习点：
   * - 日期格式转换很重要
   * - 表单标题会根据 editingTodo 改变（"创建"vs"编辑"）
   */
  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setCategoryId(todo.category?.id || '');
    setPriority(todo.priority);
    setDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '');
  };

  /**
   * 完成状态切换处理器
   *
   * 流程：
   * 1. 点击复选框时调用
   * 2. 发送 updateTodo mutation，只更新 completed 字段
   * 3. 其他字段保持不变（null 会被 GraphQL 忽略）
   * 4. 后端返回更新后的 Todo
   * 5. Apollo Client 更新缓存，UI 立即更新
   *
   * 学习点：
   * - 部分更新：只更新一个字段
   * - 乐观 UI 更新：Apollo 可以立即更新 UI，然后再发送请求
   */
  const handleToggleComplete = async (todo: Todo) => {
    try {
      await updateTodo({
        variables: {
          id: todo.id,
          completed: !todo.completed,
        },
      });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  /**
   * 删除事件处理器
   *
   * 流程：
   * 1. 显示确认对话框，防止误删
   * 2. 用户确认后调用 removeTodo mutation
   * 3. 后端删除数据库中的记录
   * 4. onCompleted 刷新列表
   * 5. 被删除的 Todo 从列表消失
   *
   * 最佳实践：
   * - 删除操作需要确认
   * - 提供撤销选项（可选）
   */
  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个待办事项吗？')) {
      try {
        await removeTodo({
          variables: { id },
        });
      } catch (err) {
        // Error handled by onError callback
      }
    }
  };

  /**
   * 判断任务是否已过期
   *
   * 逻辑：
   * - 截止日期早于今天 AND
   * - 不是今天（排除今天过期的情况）
   *
   * 学习点：
   * - 在 UI 中用不同颜色标记过期任务
   * - 帮助用户识别需要紧急处理的任务
   */
  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  /**
   * 判断任务是否今天到期
   *
   * 逻辑：
   * - 截止日期是今天
   *
   * 用途：
   * - 用黄色标记今天到期的任务
   * - 提醒用户尽快完成
   */
  const isDueToday = (dueDate: string) => {
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  // 如果未认证，显示加载状态而不是 null
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  const categories: Category[] = categoriesData?.categories || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">我的待办事项</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            管理你的任务，保持高效
          </p>
        </div>

        <NoSSR fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：创建/编辑表单 */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {editingTodo ? '编辑待办事项' : '创建新待办事项'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="标题"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入待办事项标题"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      描述
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="输入描述（可选）"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      分类
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">无分类</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      优先级
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="LOW">低</option>
                      <option value="MEDIUM">中</option>
                      <option value="HIGH">高</option>
                      <option value="URGENT">紧急</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      截止日期
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                      <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" loading={creating || updating} className="flex-1">
                      {editingTodo ? '更新' : '创建'}
                    </Button>
                    {editingTodo && (
                      <Button type="button" variant="secondary" onClick={resetForm}>
                        取消
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* 右侧：搜索、过滤和待办事项列表 */}
            <div className="lg:col-span-2">
              {/* 搜索和过滤栏 */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Input
                      label="搜索"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜索待办事项..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      状态
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="all">全部</option>
                      <option value="pending">待完成</option>
                      <option value="completed">已完成</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      优先级
                    </label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="all">全部</option>
                      <option value="URGENT">紧急</option>
                      <option value="HIGH">高</option>
                      <option value="MEDIUM">中</option>
                      <option value="LOW">低</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      排序
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="createdAt">创建时间</option>
                      <option value="dueDate">截止日期</option>
                      <option value="priority">优先级</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    分类
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${filterCategory === 'all'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                      全部
                    </button>
                    <button
                      onClick={() => setFilterCategory('uncategorized')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${filterCategory === 'uncategorized'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                      无分类
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setFilterCategory(category.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${filterCategory === category.id
                          ? 'text-white'
                          : 'text-gray-800 dark:text-gray-300'
                          }`}
                        style={{
                          backgroundColor: filterCategory === category.id ? category.color : '#f3f4f6',
                        }}
                      >
                        {category.icon} {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 待办事项列表 */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    待办事项 ({filteredAndSortedTodos.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {todosLoading ? (
                    <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      加载中...
                    </div>
                  ) : filteredAndSortedTodos.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                        ? '没有找到匹配的待办事项'
                        : '还没有待办事项，创建第一个吧！'}
                    </div>
                  ) : (
                    filteredAndSortedTodos.map((todo: Todo) => (
                      <div key={todo.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => handleToggleComplete(todo)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className={`text-sm font-medium ${todo.completed
                                    ? 'line-through text-gray-500 dark:text-gray-500'
                                    : 'text-gray-900 dark:text-white'
                                    }`}
                                >
                                  {todo.title}
                                </h3>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[todo.priority]}`}>
                                  {priorityLabels[todo.priority]}
                                </span>
                                {todo.category && (
                                  <span
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: todo.category.color }}
                                  >
                                    {todo.category.icon} {todo.category.name}
                                  </span>
                                )}
                              </div>
                              {todo.description && (
                                <p
                                  className={`mt-1 text-sm ${todo.completed
                                    ? 'line-through text-gray-400 dark:text-gray-600'
                                    : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                  {todo.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                                <span>创建: {new Date(todo.createdAt).toLocaleDateString()}</span>
                                {todo.dueDate && (
                                  <span className={`${isOverdue(todo.dueDate) ? 'text-red-600 dark:text-red-400 font-medium' :
                                    isDueToday(todo.dueDate) ? 'text-yellow-600 dark:text-yellow-400 font-medium' :
                                      'text-gray-500 dark:text-gray-500'
                                    }`}>
                                    截止: {new Date(todo.dueDate).toLocaleDateString()}
                                    {isOverdue(todo.dueDate) && ' (已过期)'}
                                    {isDueToday(todo.dueDate) && ' (今天到期)'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEdit(todo)}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDelete(todo.id)}
                              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </NoSSR>
      </div>
    </div>
  );
}