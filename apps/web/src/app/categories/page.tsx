'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { categoryApi, type Category } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoSSR } from '@/components/ui/no-ssr';

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
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryApi.getAll();
            setCategories(data);
        } catch (err: any) {
            setError(err.message || '加载分类失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadCategories();
        }
    }, [isAuthenticated]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('名称不能为空');
            return;
        }

        try {
            const data = {
                name,
                description: description || undefined,
                color,
                icon,
            };

            if (editingCategory) {
                setUpdating(true);
                await categoryApi.update(editingCategory.id, data);
            } else {
                setCreating(true);
                await categoryApi.create(data);
            }

            setEditingCategory(null);
            setName('');
            setDescription('');
            setColor('#3B82F6');
            setIcon('📁');
            await loadCategories();
        } catch (err: any) {
            setError(err.message || '操作失败');
        } finally {
            setCreating(false);
            setUpdating(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setName(category.name);
        setDescription(category.description || '');
        setColor(category.color);
        setIcon(category.icon);
    };

    const handleDelete = async (id: string) => {
        if (confirm('确定要删除这个分类吗？')) {
            try {
                await categoryApi.delete(id);
                await loadCategories();
            } catch (err: any) {
                setError(err.message || '删除失败');
            }
        }
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">分类管理</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        创建和管理待办事项的分类
                    </p>
                </div>

                <NoSSR fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {editingCategory ? '编辑分类' : '创建新分类'}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="名称"
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
                                            placeholder="输入描述（可选）"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            颜色
                                        </label>
                                        <div className="grid grid-cols-8 gap-2">
                                            {DEFAULT_COLORS.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setColor(c)}
                                                    className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            图标
                                        </label>
                                        <div className="grid grid-cols-8 gap-2">
                                            {DEFAULT_ICONS.map((i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setIcon(i)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded ${icon === i ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'}`}
                                                >
                                                    {i}
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
                                        <Button type="submit" loading={creating || updating} className="flex-1">
                                            {editingCategory ? '更新' : '创建'}
                                        </Button>
                                        {editingCategory && (
                                            <Button type="button" variant="secondary" onClick={() => {
                                                setEditingCategory(null);
                                                setName('');
                                                setDescription('');
                                                setColor('#3B82F6');
                                                setIcon('📁');
                                            }}>
                                                取消
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div>
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        分类列表 ({categories.length})
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {loading ? (
                                        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            加载中...
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            还没有分类，创建第一个吧！
                                        </div>
                                    ) : (
                                        categories.map((category) => (
                                            <div key={category.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <span
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
                                                            style={{ backgroundColor: category.color }}
                                                        >
                                                            {category.icon}
                                                        </span>
                                                        <div>
                                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {category.name}
                                                            </h3>
                                                            {category.description && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {category.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(category)}
                                                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                        >
                                                            编辑
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(category.id)}
                                                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
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
