'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_ME } from '@/lib/graphql/queries';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoSSR } from '@/components/ui/no-ssr';

interface UserStats {
    totalTodos: number;
    completedTodos: number;
    pendingTodos: number;
    completionRate: number;
    categoriesCount: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { data, loading } = useQuery(GET_ME, {
        skip: !isAuthenticated,
    });

    // 使用 useEffect 处理重定向，避免在渲染期间调用 router.push
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

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

    // 模拟用户统计数据（实际应该从后端获取）
    const userStats: UserStats = {
        totalTodos: 25,
        completedTodos: 18,
        pendingTodos: 7,
        completionRate: 72,
        categoriesCount: 5,
    };

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 这里应该调用更新用户信息的 GraphQL mutation
        // 目前只是模拟
        try {
            // await updateUser({ variables: { username, email } });
            setSuccess('个人资料更新成功！');
            setIsEditing(false);
        } catch (err) {
            setError('更新失败，请重试');
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm('确定要删除账户吗？此操作无法撤销，所有数据将被永久删除。')) {
            if (confirm('请再次确认：您真的要删除账户吗？')) {
                try {
                    // await deleteUser();
                    logout();
                    router.push('/');
                } catch (err) {
                    setError('删除账户失败，请重试');
                }
            }
        }
    };

    const achievements = [
        {
            id: 1,
            title: '新手上路',
            description: '创建了第一个待办事项',
            icon: '🎯',
            earned: true,
            earnedDate: '2024-01-15',
        },
        {
            id: 2,
            title: '效率达人',
            description: '完成率达到 70%',
            icon: '⚡',
            earned: true,
            earnedDate: '2024-02-20',
        },
        {
            id: 3,
            title: '分类大师',
            description: '创建了 5 个分类',
            icon: '📁',
            earned: true,
            earnedDate: '2024-03-10',
        },
        {
            id: 4,
            title: '完美主义者',
            description: '完成率达到 100%',
            icon: '💎',
            earned: false,
        },
        {
            id: 5,
            title: '持续专注',
            description: '连续 30 天使用应用',
            icon: '🔥',
            earned: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">个人资料</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        管理你的账户信息和查看统计数据
                    </p>
                </div>

                <NoSSR fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 左侧：个人信息 */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* 基本信息卡片 */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">基本信息</h2>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsEditing(!isEditing)}
                                    >
                                        {isEditing ? '取消' : '编辑'}
                                    </Button>
                                </div>

                                {isEditing ? (
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <Input
                                            label="用户名"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                        <Input
                                            label="邮箱"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />

                                        {error && (
                                            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                                                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                                            </div>
                                        )}

                                        {success && (
                                            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                                                <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Button type="submit">保存更改</Button>
                                            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                                                取消
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                用户名
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.username}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                邮箱
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                注册时间
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 成就系统 */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">成就徽章</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {achievements.map((achievement) => (
                                        <div
                                            key={achievement.id}
                                            className={`p-4 rounded-lg border-2 ${achievement.earned
                                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`text-2xl ${achievement.earned ? '' : 'grayscale opacity-50'}`}>
                                                    {achievement.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={`font-medium ${achievement.earned
                                                        ? 'text-green-900 dark:text-green-100'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        {achievement.title}
                                                    </h3>
                                                    <p className={`text-sm ${achievement.earned
                                                        ? 'text-green-700 dark:text-green-300'
                                                        : 'text-gray-500 dark:text-gray-500'
                                                        }`}>
                                                        {achievement.description}
                                                    </p>
                                                    {achievement.earned && achievement.earnedDate && (
                                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                            获得于: {new Date(achievement.earnedDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 危险区域 */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">危险区域</h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">删除账户</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            永久删除你的账户和所有相关数据。此操作无法撤销。
                                        </p>
                                        <Button
                                            variant="secondary"
                                            onClick={handleDeleteAccount}
                                            className="mt-2 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                        >
                                            删除账户
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 右侧：统计信息 */}
                        <div className="space-y-6">
                            {/* 统计概览 */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">统计概览</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">总任务数</span>
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {userStats.totalTodos}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">已完成</span>
                                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                            {userStats.completedTodos}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">待完成</span>
                                        <span className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                                            {userStats.pendingTodos}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">完成率</span>
                                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                            {userStats.completionRate}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">分类数量</span>
                                        <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                            {userStats.categoriesCount}
                                        </span>
                                    </div>
                                </div>

                                {/* 完成率进度条 */}
                                <div className="mt-6">
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        <span>完成进度</span>
                                        <span>{userStats.completionRate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${userStats.completionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* 快速操作 */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快速操作</h2>
                                <div className="space-y-3">
                                    <Button
                                        variant="secondary"
                                        className="w-full justify-start"
                                        onClick={() => router.push('/todos')}
                                    >
                                        📋 管理待办事项
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full justify-start"
                                        onClick={() => router.push('/categories')}
                                    >
                                        📁 管理分类
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full justify-start"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        📊 查看仪表板
                                    </Button>
                                </div>
                            </div>

                            {/* 应用信息 */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">应用信息</h2>
                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex justify-between">
                                        <span>版本</span>
                                        <span>1.0.0</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>最后登录</span>
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>数据同步</span>
                                        <span className="text-green-600 dark:text-green-400">已同步</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </NoSSR>
            </div>
        </div>
    );
}
