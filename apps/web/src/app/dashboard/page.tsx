'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { todoApi, categoryApi, type Todo, type Category } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { NoSSR } from '@/components/ui/no-ssr';
import styles from './page.module.scss';

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
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
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
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>仪表板</h1>
                    <p className={styles.subtitle}>
                        查看你的任务统计和概览
                    </p>
                </div>

                <NoSSR fallback={<div className={styles.skeleton}></div>}>
                    {loading ? (
                        <div className={styles.loadingSpinner}>
                            <div className={styles.loadingSpinnerIcon}></div>
                        </div>
                    ) : (
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <h3 className={styles.statLabel}>总任务数</h3>
                                <p className={styles.statValue}>{totalTodos}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3 className={styles.statLabel}>已完成</h3>
                                <p className={styles.statValueGreen}>{completedTodos}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3 className={styles.statLabel}>待完成</h3>
                                <p className={styles.statValueYellow}>{pendingTodos}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3 className={styles.statLabel}>完成率</h3>
                                <p className={styles.statValueBlue}>{completionRate}%</p>
                            </div>

                            <div className={styles.statCardWide}>
                                <h3 className={styles.sectionTitle}>优先级分布</h3>
                                <div className={styles.priorityList}>
                                    <div className={styles.priorityItem}>
                                        <div className={styles.priorityHeader}>
                                            <span className={styles.priorityLabel}>紧急</span>
                                            <span className={styles.priorityCount}>{priorityCounts.URGENT}</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFillRed} style={{ width: `${(priorityCounts.URGENT / totalTodos) * 100 || 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div className={styles.priorityItem}>
                                        <div className={styles.priorityHeader}>
                                            <span className={styles.priorityLabelHigh}>高</span>
                                            <span className={styles.priorityCount}>{priorityCounts.HIGH}</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFillYellow} style={{ width: `${(priorityCounts.HIGH / totalTodos) * 100 || 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div className={styles.priorityItem}>
                                        <div className={styles.priorityHeader}>
                                            <span className={styles.priorityLabelMedium}>中</span>
                                            <span className={styles.priorityCount}>{priorityCounts.MEDIUM}</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFillBlue} style={{ width: `${(priorityCounts.MEDIUM / totalTodos) * 100 || 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div className={styles.priorityItem}>
                                        <div className={styles.priorityHeader}>
                                            <span className={styles.priorityLabelLow}>低</span>
                                            <span className={styles.priorityCount}>{priorityCounts.LOW}</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFillGray} style={{ width: `${(priorityCounts.LOW / totalTodos) * 100 || 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.statCardWide}>
                                <h3 className={styles.sectionTitle}>分类统计</h3>
                                <div className={styles.categoryList}>
                                    {categories.length > 0 ? categories.map(cat => (
                                        <div key={cat.id} className={styles.categoryItem}>
                                            <div className={styles.categoryInfo}>
                                                <span style={{ color: cat.color }}>{cat.icon}</span>
                                                <span className={styles.categoryName}>{cat.name}</span>
                                            </div>
                                            <span className={styles.categoryCount}>
                                                {todos.filter(t => t.category?.id === cat.id).length} 个任务
                                            </span>
                                        </div>
                                    )) : (
                                        <p className={styles.emptyCategory}>暂无分类</p>
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
