'use client';

import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GET_TODOS, GET_CATEGORIES, GET_CATEGORY_STATS } from '@/lib/graphql/queries';
import { useAuth } from '@/lib/auth-context';
import { NoSSR } from '@/components/ui/no-ssr';

interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    createdAt: string;
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

interface CategoryStat {
    id: string;
    name: string;
    color: string;
    icon: string;
    todoCount: number;
    completedCount: number;
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

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    // 使用 useEffect 处理重定向，避免在渲染期间调用 router.push
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const { data: todosData, loading: todosLoading } = useQuery(GET_TODOS, {
        skip: !isAuthenticated,
    });

    const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_CATEGORIES, {
        skip: !isAuthenticated,
    });

    const { data: categoryStatsData, loading: categoryStatsLoading } = useQuery(GET_CATEGORY_STATS, {
        skip: !isAuthenticated,
    });

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

    const todos: Todo[] = todosData?.todos || [];
    const categories: Category[] = categoriesData?.categories || [];
    const categoryStats: CategoryStat[] = categoryStatsData?.categoryStats || [];

    // 计算统计数据
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.completed).length;
    const pendingTodos = totalTodos - completedTodos;
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    // 按优先级分组
    const todosByPriority = todos.reduce((acc, todo) => {
        acc[todo.priority] = (acc[todo.priority] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // 即将到期的任务（7天内）
    const upcomingTodos = todos.filter(todo => {
        if (!todo.dueDate || todo.completed) return false;
        const dueDate = new Date(todo.dueDate);
        const now = new Date();
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0;
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    // 过期任务
    const overdueTodos = todos.filter(todo => {
        if (!todo.dueDate || todo.completed) return false;
        const dueDate = new Date(todo.dueDate);
        const now = new Date();
        return dueDate < now;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">仪表板</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        查看你的待办事项统计和概览
                    </p>
                </div>

                <NoSSR fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>}>
                    {/* 统计卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">📋</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                                总任务数
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                                {totalTodos}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">✅</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                                已完成
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                                {completedTodos}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">⏳</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                                待完成
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                                {pendingTodos}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">📊</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                                完成率
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                                {completionRate}%
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* 优先级分布 */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">优先级分布</h3>
                            <div className="space-y-3">
                                {Object.entries(priorityLabels).map(([priority, label]) => {
                                    const count = todosByPriority[priority] || 0;
                                    const percentage = totalTodos > 0 ? Math.round((count / totalTodos) * 100) : 0;
                                    return (
                                        <div key={priority} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[priority as keyof typeof priorityColors]}`}>
                                                    {label}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                                                    {count}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 分类统计 */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">分类统计</h3>
                            <div className="space-y-3">
                                {categoryStatsLoading ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400">加载中...</div>
                                ) : categoryStats.length === 0 ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400">暂无分类</div>
                                ) : (
                                    categoryStats.map((stat) => {
                                        const completionRate = stat.todoCount > 0 ? Math.round((stat.completedCount / stat.todoCount) * 100) : 0;
                                        return (
                                            <div key={stat.id} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className="w-6 h-6 rounded flex items-center justify-center text-white text-sm"
                                                        style={{ backgroundColor: stat.color }}
                                                    >
                                                        {stat.icon}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {stat.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {stat.completedCount}/{stat.todoCount}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-500">
                                                        ({completionRate}%)
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 即将到期 */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">即将到期 (7天内)</h3>
                            <div className="space-y-3">
                                {upcomingTodos.length === 0 ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400">暂无即将到期的任务</div>
                                ) : (
                                    upcomingTodos.slice(0, 5).map((todo) => {
                                        const dueDate = new Date(todo.dueDate!);
                                        const now = new Date();
                                        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <div key={todo.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {todo.title}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        {diffDays === 0 ? '今天到期' : `${diffDays}天后到期`}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[todo.priority]}`}>
                                                    {priorityLabels[todo.priority]}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* 过期任务 */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">过期任务</h3>
                            <div className="space-y-3">
                                {overdueTodos.length === 0 ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400">暂无过期任务</div>
                                ) : (
                                    overdueTodos.slice(0, 5).map((todo) => {
                                        const dueDate = new Date(todo.dueDate!);
                                        const now = new Date();
                                        const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <div key={todo.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {todo.title}
                                                    </p>
                                                    <p className="text-xs text-red-600 dark:text-red-400">
                                                        过期 {diffDays} 天
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[todo.priority]}`}>
                                                    {priorityLabels[todo.priority]}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </NoSSR>
            </div>
        </div>
    );
}
