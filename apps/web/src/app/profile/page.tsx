'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoSSR } from '@/components/ui/no-ssr';

export default function ProfilePage() {
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            setLoading(true);
            if (user?.id) {
                await userApi.update(user.id, { username, email });
                setSuccess('个人资料更新成功！');
                setIsEditing(false);
            }
        } catch (err: any) {
            setError(err.message || '更新失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm('确定要删除账户吗？此操作无法撤销。')) {
            if (confirm('请再次确认：您真的要删除账户吗？')) {
                alert('账户删除功能需要后端支持');
            }
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
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
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">个人资料</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        管理你的账户信息
                    </p>
                </div>

                <NoSSR fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>}>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">账户信息</h2>
                        
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
                                    <Button type="submit" loading={loading}>保存</Button>
                                    <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                                        取消
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">用户名</p>
                                    <p className="text-lg text-gray-900 dark:text-white">{user?.username}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">邮箱</p>
                                    <p className="text-lg text-gray-900 dark:text-white">{user?.email}</p>
                                </div>
                                <Button onClick={() => setIsEditing(true)}>编辑资料</Button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">账户操作</h2>
                        <div className="space-y-4">
                            <Button variant="secondary" onClick={handleLogout} className="w-full">
                                退出登录
                            </Button>
                            <Button variant="danger" onClick={handleDeleteAccount} className="w-full">
                                删除账户
                            </Button>
                        </div>
                    </div>
                </NoSSR>
            </div>
        </div>
    );
}
