'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { todoApi, categoryApi, type Todo, type Category } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { NoSSR } from '@/components/ui/no-ssr';

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated]);

    const loadData = async () => {
        try {
            const [todosData, categoriesData] = await Promise.all([
                todoApi.getAll(),
                categoryApi.getAll()
            ]);
            setTodos(todosData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('加载数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const totalTodos = todos.length;
    const completedTodos = todos.filter(t => t.completed).length;
    const pendingTodos = totalTodos - completedTodos;
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    const priorityCounts = {
        URGENT: todos.filter(t => t.priority === 'URGENT').length,
        HIGH: todos.filter(t => t.priority === 'HIGH').length,
        MEDIUM: todos.filter(t => t.priority === 'MEDIUM').length,
        LOW: todos.filter(t => t.priority === 'LOW').length,
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">仪表板</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        查看你的任务统计和概览
                    </p>
                </div>

                <NoSSR fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>}>
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">总任务数</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalTodos}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">已完成</h3>
                                <p className="text-3xl font-bold text-green-600 mt-2">{completedTodos}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">待完成</h3>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingTodos}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">完成率</h3>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{completionRate}%</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">优先级分布</h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-red-600">紧急</span>
                                            <span className="text-gray-600 dark:text-gray-400">{priorityCounts.URGENT}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-red-600 h-2 rounded-full" style={{ width: `${(priorityCounts.URGENT / totalTodos) * 100 || 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-yellow-600">高</span>
                                            <span className="text-gray-600 dark:text-gray-400">{priorityCounts.HIGH}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${(priorityCounts.HIGH / totalTodos) * 100 || 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-blue-600">中</span>
                                            <span className="text-gray-600 dark:text-gray-400">{priorityCounts.MEDIUM}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(priorityCounts.MEDIUM / totalTodos) * 100 || 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">低</span>
                                            <span className="text-gray-600 dark:text-gray-400">{priorityCounts.LOW}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-gray-600 h-2 rounded-full" style={{ width: `${(priorityCounts.LOW / totalTodos) * 100 || 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">分类统计</h3>
                                <div className="space-y-2">
                                    {categories.length > 0 ? categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <div className="flex items-center gap-2">
                                                <span style={{ color: cat.color }}>{cat.icon}</span>
                                                <span className="text-sm text-gray-900 dark:text-white">{cat.name}</span>
                                            </div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {todos.filter(t => t.category?.id === cat.id).length} 个任务
                                            </span>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">暂无分类</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </NoSSR>
            </div>
        </div>
    );
}
