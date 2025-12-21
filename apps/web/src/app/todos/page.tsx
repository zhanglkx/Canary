/**
 * 待办事项管理页面 - REST API 版本
 *
 * 这个页面展示了 Next.js + Axios + REST API 的完整工作流程。
 */

'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { todoApi, categoryApi, type Todo, type Category } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoSSR } from '@/components/ui/no-ssr';

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

  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [error, setError] = useState('');

  // 搜索和过滤状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'priority'>('createdAt');

  // 数据和加载状态
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // 认证检查
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // 加载 Todos
  const loadTodos = async () => {
    try {
      setTodosLoading(true);
      const data = await todoApi.getAll();
      setTodos(data);
    } catch (err: any) {
      setError(err.message || '加载待办事项失败');
    } finally {
      setTodosLoading(false);
    }
  };

  // 加载分类
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (err: any) {
      console.error('加载分类失败:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (isAuthenticated) {
      loadTodos();
      loadCategories();
    }
  }, [isAuthenticated]);

  // 重置表单
  const resetForm = () => {
    setEditingTodo(null);
    setTitle('');
    setDescription('');
    setCategoryId('');
    setPriority('MEDIUM');
    setDueDate('');
    setError('');
  };

  // 过滤和排序
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = todos.filter((todo: Todo) => {
      const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'completed' && todo.completed) ||
        (filterStatus === 'pending' && !todo.completed);
      
      const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
      
      const matchesCategory = filterCategory === 'all' ||
        (filterCategory === 'uncategorized' && !todo.category) ||
        todo.category?.id === filterCategory;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    filtered.sort((a: Todo, b: Todo) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [todos, searchTerm, filterStatus, filterPriority, filterCategory, sortBy]);

  // 提交表单
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }

    try {
      const data = {
        title,
        description: description || undefined,
        categoryId: categoryId || undefined,
        priority,
        dueDate: dueDate || undefined,
      };

      if (editingTodo) {
        setUpdating(true);
        await todoApi.update(editingTodo.id, data);
      } else {
        setCreating(true);
        await todoApi.create(data);
      }
      
      resetForm();
      await loadTodos();
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setCreating(false);
      setUpdating(false);
    }
  };

  // 编辑
  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setCategoryId(todo.category?.id || '');
    setPriority(todo.priority);
    setDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '');
  };

  // 切换完成状态
  const handleToggleComplete = async (todo: Todo) => {
    try {
      await todoApi.update(todo.id, { completed: !todo.completed });
      await loadTodos();
    } catch (err: any) {
      setError(err.message || '更新失败');
    }
  };

  // 删除
  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个待办事项吗？')) {
      try {
        await todoApi.delete(id);
        await loadTodos();
      } catch (err: any) {
        setError(err.message || '删除失败');
      }
    }
  };

  // 工具函数
  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (dueDate: string) => {
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

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
