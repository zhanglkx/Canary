'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_CATEGORIES } from '@/lib/graphql/queries';
import { CREATE_CATEGORY, UPDATE_CATEGORY, REMOVE_CATEGORY } from '@/lib/graphql/mutations';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoSSR } from '@/components/ui/no-ssr';

interface Category {
    id: string;
    name: string;
    description?: string;
    color: string;
    icon: string;
    createdAt: string;
    updatedAt: string;
}

const DEFAULT_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

const DEFAULT_ICONS = [
    '📁', '📋', '💼', '🎯', '📚', '🏠', '💡', '🎨',
    '🚀', '⭐', '🔥', '💎', '🎵', '🍕', '🌟', '🎪'
];

export default function CategoriesPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [icon, setIcon] = useState('📁');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [error, setError] = useState('');

    const { data, loading, refetch } = useQuery(GET_CATEGORIES, {
        skip: !isAuthenticated,
    });

    const [createCategory, { loading: creating }] = useMutation(CREATE_CATEGORY, {
        onCompleted: () => {
            setName('');
            setDescription('');
            setColor('#3B82F6');
            setIcon('📁');
            refetch();
        },
        onError: (error) => {
            setError(error.message);
        },
    });

    const [updateCategory, { loading: updating }] = useMutation(UPDATE_CATEGORY, {
        onCompleted: () => {
            setEditingCategory(null);
            setName('');
            setDescription('');
            setColor('#3B82F6');
            setIcon('📁');
            refetch();
        },
        onError: (error) => {
            setError(error.message);
        },
    });

    const [removeCategory] = useMutation(REMOVE_CATEGORY, {
        onCompleted: () => {
            refetch();
        },
        onError: (error) => {
            setError(error.message);
        },
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('分类名称不能为空');
            return;
        }

        try {
            if (editingCategory) {
                await updateCategory({
                    variables: {
                        id: editingCategory.id,
                        name,
                        description: description || null,
                        color,
                        icon,
                    },
                });
            } else {
                await createCategory({
                    variables: {
                        name,
                        description: description || null,
                        color,
                        icon,
                    },
                });
            }
        } catch (err) {
            // Error handled by onError callback
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setName(category.name);
        setDescription(category.description || '');
        setColor(category.color);
        setIcon(category.icon);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setName('');
        setDescription('');
        setColor('#3B82F6');
        setIcon('📁');
    };

    const handleDelete = async (id: string) => {
        if (confirm('确定要删除这个分类吗？删除后无法恢复。')) {
            try {
                await removeCategory({
                    variables: { id },
                });
            } catch (err) {
                // Error handled by onError callback
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">分类管理</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        创建和管理你的待办事项分类
                    </p>
                </div>

                <NoSSR fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>}>
                    {/* 创建/编辑表单 */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {editingCategory ? '编辑分类' : '创建新分类'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="分类名称"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="输入分类名称"
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    描述
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="输入分类描述（可选）"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            {/* 颜色选择 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    颜色
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {DEFAULT_COLORS.map((colorOption) => (
                                        <button
                                            key={colorOption}
                                            type="button"
                                            onClick={() => setColor(colorOption)}
                                            className={`w-8 h-8 rounded-full border-2 ${color === colorOption ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                                                }`}
                                            style={{ backgroundColor: colorOption }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* 图标选择 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    图标
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {DEFAULT_ICONS.map((iconOption) => (
                                        <button
                                            key={iconOption}
                                            type="button"
                                            onClick={() => setIcon(iconOption)}
                                            className={`w-10 h-10 text-xl border rounded-lg ${icon === iconOption
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                                : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                        >
                                            {iconOption}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                                    <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button type="submit" loading={creating || updating}>
                                    {editingCategory ? '更新分类' : '创建分类'}
                                </Button>
                                {editingCategory && (
                                    <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                                        取消
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* 分类列表 */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">我的分类</h2>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    加载中...
                                </div>
                            ) : data?.categories?.length === 0 ? (
                                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    还没有分类，创建第一个分类吧！
                                </div>
                            ) : (
                                data?.categories?.map((category: Category) => (
                                    <div key={category.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
                                                    style={{ backgroundColor: category.color }}
                                                >
                                                    {category.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {category.name}
                                                    </h3>
                                                    {category.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {category.description}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                                        创建于: {new Date(category.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    编辑
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
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
                </NoSSR>
            </div>
        </div>
    );
}
