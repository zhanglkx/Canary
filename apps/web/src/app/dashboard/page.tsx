'use client';

/**
 * 仪表板页面 (Dashboard Page)
 *
 * @description
 * 这是应用程序的主仪表板页面，为已认证用户显示待办事项的统计信息和概览。
 *
 * 核心功能：
 * 1. 显示待办事项的统计数据（总数、已完成、待完成、完成率）
 * 2. 显示优先级分布图表
 * 3. 显示分类统计信息
 * 4. 显示即将到期的任务（7天内）
 * 5. 显示过期的任务
 * 6. 保护受保护的路由 - 未认证用户重定向到登录页
 *
 * 技术要点：
 * - 使用 'use client' 标记为客户端组件（Next.js App Router）
 * - 使用 useAuth hook 访问全局认证状态
 * - 使用 useRouter 进行页面导航
 * - 使用 Apollo Client 的 useQuery 获取 GraphQL 数据
 * - 使用 useEffect 处理受保护路由的重定向逻辑
 * - 使用 NoSSR 组件包装避免服务端渲染不匹配问题
 *
 * 数据流：
 * 1. 组件挂载时检查认证状态（使用 isLoading 标志避免 hydration 问题）
 * 2. 如果未认证，显示加载状态并重定向到登录页
 * 3. 如果已认证，执行 GraphQL 查询获取待办事项、分类和统计数据
 * 4. 在本地计算统计数据（总数、完成率、优先级分布等）
 * 5. 将数据渲染为卡片、图表和列表
 */

import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GET_TODOS, GET_CATEGORIES, GET_CATEGORY_STATS } from '@/lib/graphql/queries';
import { useAuth } from '@/lib/auth-context';
import { NoSSR } from '@/components/ui/no-ssr';

/**
 * 待办事项数据结构接口
 *
 * 定义从 GraphQL API 返回的 Todo 对象的结构。
 * 这些字段与后端 Todo Entity 和 GraphQL ObjectType 对应。
 *
 * @property id - 待办事项的唯一标识符（UUID）
 * @property title - 待办事项的标题
 * @property description - 待办事项的详细描述（可选）
 * @property completed - 是否已完成（布尔值）
 * @property priority - 优先级（LOW, MEDIUM, HIGH, URGENT）
 * @property dueDate - 截止日期（ISO 8601 日期格式，可选）
 * @property createdAt - 创建时间（ISO 8601 格式）
 * @property category - 所属分类对象（可选）
 */
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

/**
 * 分类数据结构接口
 *
 * 定义从 GraphQL API 返回的 Category 对象的结构。
 *
 * @property id - 分类的唯一标识符
 * @property name - 分类名称
 * @property color - 分类的十六进制颜色值（用于 UI 展示）
 * @property icon - 分类的图标表情符号或代码
 */
interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
}

/**
 * 分类统计数据结构接口
 *
 * 定义分类统计信息的数据结构，包含分类信息和相关的待办事项统计。
 *
 * @property id - 分类的唯一标识符
 * @property name - 分类名称
 * @property color - 分类颜色
 * @property icon - 分类图标
 * @property todoCount - 该分类下的总待办事项数
 * @property completedCount - 该分类下已完成的待办事项数
 */
interface CategoryStat {
    id: string;
    name: string;
    color: string;
    icon: string;
    todoCount: number;
    completedCount: number;
}

/**
 * 优先级对应的 Tailwind CSS 样式映射
 *
 * 为每个优先级定义响应式的背景色和文本颜色。
 * 使用 Tailwind CSS 的深色模式支持（dark: 前缀）。
 *
 * 说明：
 * - LOW: 灰色（最低优先级）
 * - MEDIUM: 蓝色（中等优先级）
 * - HIGH: 黄色（高优先级）
 * - URGENT: 红色（最高优先级）
 *
 * 这些样式用于在优先级徽章中展示优先级
 */
const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    HIGH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

/**
 * 优先级对应的中文标签映射
 *
 * 用于在 UI 中显示中文优先级标签而不是英文代码。
 */
const priorityLabels = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    URGENT: '紧急',
};

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    /**
     * 受保护路由的重定向逻辑
     *
     * 这个 useEffect 处理两种情况：
     * 1. isLoading = true: 正在从 localStorage 初始化认证状态，显示加载界面
     * 2. isLoading = false 且 isAuthenticated = false: 初始化完成但用户未认证，重定向到登录页
     *
     * 为什么需要 isLoading 标志？
     * - 在第一次渲染时，localStorage 数据还没有读取到 React state
     * - 如果不检查 isLoading，就会立即重定向，即使用户有有效的 token
     * - isLoading 标志确保我们先等待数据加载完成，再进行认证检查
     *
     * 流程:
     * 1. 页面首次加载，isLoading = true，显示加载状态
     * 2. useEffect 运行，AuthProvider 从 localStorage 读取数据
     * 3. isLoading 变为 false
     * 4. 重新运行这个 useEffect，检查 isAuthenticated
     * 5. 如果已认证，显示仪表板；如果未认证，重定向到登录页
     */
    useEffect(() => {
        // 如果仍在加载，不做任何事情（显示加载状态）
        if (isLoading) {
            return;
        }

        // 加载完成后，检查是否已认证
        if (!isAuthenticated) {
            // 用户未认证，重定向到登录页
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    const { data: todosData, loading: todosLoading } = useQuery(GET_TODOS, {
        skip: !isAuthenticated,
    });

    const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_CATEGORIES, {
        skip: !isAuthenticated,
    });

    const { data: categoryStatsData, loading: categoryStatsLoading } = useQuery(GET_CATEGORY_STATS, {
        skip: !isAuthenticated,
    });

    /**
     * 在两种情况下显示加载状态：
     * 1. 正在初始化认证信息 (isLoading = true)
     * 2. 初始化完成但用户未认证 (isAuthenticated = false)
     *
     * 这个加载状态是必要的，因为：
     * - 初始化过程是异步的，需要等待 localStorage 读取完成
     * - 用户未认证时会被重定向，需要显示友好的过渡界面
     */
    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        {isLoading ? '正在加载认证信息...' : '正在跳转到登录页面...'}
                    </p>
                </div>
            </div>
        );
    }

    /**
     * 提取 GraphQL 查询结果
     *
     * useQuery hooks 返回包含 data、loading、error 的对象。
     * 我们使用可选链和空值合并操作符来安全地获取数据，避免 undefined 错误。
     *
     * 数据来源（从后端 GraphQL API）：
     * 1. todosData.todos - 当前用户的所有待办事项
     * 2. categoriesData.categories - 当前用户的所有分类
     * 3. categoryStatsData.categoryStats - 分类统计信息（由后端 stats resolver 计算）
     */
    const todos: Todo[] = todosData?.todos || [];
    const categories: Category[] = categoriesData?.categories || [];
    const categoryStats: CategoryStat[] = categoryStatsData?.categoryStats || [];

    /**
     * 计算待办事项的统计数据
     *
     * 这些是在前端通过 JavaScript 计算的，展示了客户端数据处理的能力。
     * 如果需要更复杂的统计，可以从后端 Stats Module 获取预计算的数据。
     */

    // 计算总的待办事项数
    const totalTodos = todos.length;

    // 计算已完成的待办事项数
    // 使用 filter 方法获取 completed === true 的待办项，然后取长度
    const completedTodos = todos.filter(todo => todo.completed).length;

    // 计算待完成的待办事项数
    // 这是总数减去已完成数
    const pendingTodos = totalTodos - completedTodos;

    // 计算完成率百分比
    // 如果总数为 0，返回 0 避免除以零错误
    // 否则计算：(已完成数 / 总数) * 100，使用 Math.round 四舍五入
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    /**
     * 按优先级分组统计
     *
     * 这个操作使用 reduce 方法遍历所有待办项，计算每个优先级的任务数。
     * 结果是一个对象，键是优先级（LOW, MEDIUM, HIGH, URGENT），值是该优先级的任务数。
     *
     * 业务用途：在仪表板上展示优先级分布图，帮助用户了解任务的优先级构成。
     *
     * 算法说明：
     * - 累加器 acc 是一个对象，初始值为 {}
     * - 对于每个 todo，增加对应优先级的计数
     * - 使用 || 0 处理首次出现的优先级（初值为 0）
     */
    const todosByPriority = todos.reduce((acc, todo) => {
        acc[todo.priority] = (acc[todo.priority] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    /**
     * 筛选出即将到期的任务（7天内）
     *
     * 业务规则：
     * - 只显示未完成的任务（completed === false）
     * - 只显示有截止日期的任务（dueDate 存在）
     * - 只显示在 0 到 7 天内到期的任务
     *
     * 时间计算说明：
     * - 获取任务的截止日期和当前时间
     * - 计算差值：(截止日期 - 当前时间) / (1000 * 60 * 60 * 24) = 天数
     * - Math.ceil 用于向上取整，确保 1 小时以上的剩余时间被计为 1 天
     *
     * 排序方式：按截止日期升序排列，最即将到期的任务排在前面
     */
    const upcomingTodos = todos.filter(todo => {
        // 排除已完成或无截止日期的任务
        if (!todo.dueDate || todo.completed) return false;

        // 转换为 Date 对象以便进行时间计算
        const dueDate = new Date(todo.dueDate);
        const now = new Date();

        // 计算剩余天数（毫秒转天数）
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 返回 true 表示该任务符合"即将到期"的条件
        return diffDays <= 7 && diffDays >= 0;
    }).sort((a, b) => {
        // 按截止日期升序排列（时间越早越靠前）
        return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
    });

    /**
     * 筛选出过期的任务
     *
     * 业务规则：
     * - 只显示未完成的任务（completed === false）
     * - 只显示有截止日期的任务（dueDate 存在）
     * - 只显示已经超过截止日期的任务（截止日期 < 当前时间）
     *
     * 用途：在仪表板上显示需要立即处理的逾期任务，提醒用户及时完成。
     */
    const overdueTodos = todos.filter(todo => {
        // 排除已完成或无截止日期的任务
        if (!todo.dueDate || todo.completed) return false;

        // 转换为 Date 对象
        const dueDate = new Date(todo.dueDate);
        const now = new Date();

        // 返回 true 表示该任务已过期
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
