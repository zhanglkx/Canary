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
import styles from './page.module.less';

const priorityClasses = {
  LOW: styles.priorityLow,
  MEDIUM: styles.priorityMedium,
  HIGH: styles.priorityHigh,
  URGENT: styles.priorityUrgent,
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
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>我的待办事项</h1>
          <p className={styles.subtitle}>
            管理你的任务，保持高效
          </p>
        </div>

        <NoSSR fallback={<div className={styles.skeleton}></div>}>
          <div className={styles.content}>
            {/* 左侧：创建/编辑表单 */}
            <div>
              <div className={styles.formCard}>
                <h2 className={styles.formTitle}>
                  {editingTodo ? '编辑待办事项' : '创建新待办事项'}
                </h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                  <Input
                    label="标题"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入待办事项标题"
                    required
                  />

                  <div>
                    <label className={styles.label}>
                      描述
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="输入描述（可选）"
                      rows={3}
                      className={styles.textarea}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>
                      分类
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className={styles.select}
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
                    <label className={styles.label}>
                      优先级
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className={styles.select}
                    >
                      <option value="LOW">低</option>
                      <option value="MEDIUM">中</option>
                      <option value="HIGH">高</option>
                      <option value="URGENT">紧急</option>
                    </select>
                  </div>

                  <div>
                    <label className={styles.label}>
                      截止日期
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={styles.select}
                    />
                  </div>

                  {error && (
                    <div className={styles.error}>
                      <p className={styles.errorText}>{error}</p>
                    </div>
                  )}

                  <div className={styles.buttonGroup}>
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
            <div className={styles.listSection}>
              {/* 搜索和过滤栏 */}
              <div className={styles.filterCard}>
                <h3 className={styles.filterTitle}>搜索和过滤</h3>
                <div className={styles.filterGrid}>
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
                    <label className={styles.label}>
                      状态
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className={styles.select}
                    >
                      <option value="all">全部</option>
                      <option value="pending">待完成</option>
                      <option value="completed">已完成</option>
                    </select>
                  </div>

                  <div>
                    <label className={styles.label}>
                      优先级
                    </label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className={styles.select}
                    >
                      <option value="all">全部</option>
                      <option value="URGENT">紧急</option>
                      <option value="HIGH">高</option>
                      <option value="MEDIUM">中</option>
                      <option value="LOW">低</option>
                    </select>
                  </div>

                  <div>
                    <label className={styles.label}>
                      排序
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className={styles.select}
                    >
                      <option value="createdAt">创建时间</option>
                      <option value="dueDate">截止日期</option>
                      <option value="priority">优先级</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '@spacing-md' }}>
                  <label className={styles.label}>
                    分类
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '@spacing-sm' }}>
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
              <div className={styles.todosCard}>
                <div style={{ padding: '@spacing-md @spacing-xl', borderBottom: '1px solid @gray-200' }}>
                  <h2 className={styles.filterTitle}>
                    待办事项 ({filteredAndSortedTodos.length})
                  </h2>
                </div>
                <div className={styles.todosList}>
                  {todosLoading ? (
                    <div style={{ padding: '@spacing-2xl', textAlign: 'center', color: '@gray-500' }}>
                      加载中...
                    </div>
                  ) : filteredAndSortedTodos.length === 0 ? (
                    <div style={{ padding: '@spacing-2xl', textAlign: 'center', color: '@gray-500' }}>
                      {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                        ? '没有找到匹配的待办事项'
                        : '还没有待办事项，创建第一个吧！'}
                    </div>
                  ) : (
                    filteredAndSortedTodos.map((todo: Todo) => (
                      <div key={todo.id} className={styles.todoItem}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '@spacing-lg', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => handleToggleComplete(todo)}
                              style={{ marginTop: '@spacing-xs', width: '16px', height: '16px' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '@spacing-sm', marginBottom: '@spacing-xs' }}>
                                <h3
                                  style={{
                                    fontSize: '@font-size-sm',
                                    fontWeight: 500,
                                    textDecoration: todo.completed ? 'line-through' : 'none',
                                    color: todo.completed ? '@gray-500' : '@gray-900',
                                  }}
                                >
                                  {todo.title}
                                </h3>
                                <span className={priorityClasses[todo.priority]}>
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
