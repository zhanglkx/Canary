/**
 * 统计和仪表板模块 GraphQL 操作
 *
 * 这个文件定义了所有与统计数据相关的 GraphQL 查询。
 *
 * 用途：
 * 1. 为 Dashboard 页面提供统计数据
 * 2. 显示用户的生产力指标
 * 3. 提供数据可视化的基础数据
 * 4. 帮助用户了解他们的任务管理情况
 *
 * 统计类型：
 * 1. Todo 统计：总数、完成数、未完成数等
 * 2. 分类统计：每个分类的任务数量
 * 3. 优先级分布：各优先级任务的数量
 * 4. 逾期任务：超过截止日期的任务
 *
 * 对应后端：
 * - StatsResolver (apps/api/src/stats/stats.resolver.ts)
 * - StatsService (apps/api/src/stats/stats.service.ts)
 */

import { gql } from '@apollo/client';

/**
 * 获取 Todo 统计数据
 *
 * GraphQL 查询概览：
 * - 参数：无
 * - 返回：统计数据对象
 *
 * 返回的统计指标：
 * - total: 所有 Todo 的总数
 * - completed: 已完成的 Todo 数量
 * - pending: 未完成的 Todo 数量
 * - completionPercentage: 完成率百分比（0-100）
 * - urgentCount: 紧急优先级的 Todo 数
 * - highCount: 高优先级的 Todo 数
 * - mediumCount: 中优先级的 Todo 数
 * - lowCount: 低优先级的 Todo 数
 * - overdueCount: 逾期的 Todo 数
 *
 * 业务意义：
 * - 帮助用户了解任务完成情况
 * - 显示紧急任务的数量
 * - 识别逾期任务需要立即处理
 * - 计算工作效率
 *
 * 使用场景：
 * 1. Dashboard 页面的统计卡片
 * 2. 进度条显示完成率
 * 3. 饼图显示优先级分布
 * 4. 提醒显示逾期任务
 *
 * 使用示例：
 * ```
 * const { data } = useQuery(GET_TODO_STATS);
 *
 * if (data?.todoStats) {
 *   const { total, completed, completionPercentage, overdueCount } = data.todoStats;
 *
 *   // 显示统计信息
 *   console.log(`总任务数: ${total}`);
 *   console.log(`已完成: ${completed}`);
 *   console.log(`完成率: ${completionPercentage}%`);
 *   console.log(`逾期任务: ${overdueCount}`);
 * }
 * ```
 *
 * 缓存策略：
 * - 这个查询的数据不经常变化
 * - 可以设置较长的缓存有效期
 * - 但用户执行任何操作（创建/完成任务）后应该刷新
 *
 * 对应后端：
 * @Query(() => TodoStats)
 * @UseGuards(GqlAuthGuard)
 * async todoStats(@CurrentUser() user: User): Promise<TodoStats>
 */
export const GET_TODO_STATS = gql`
  query GetTodoStats {
    /**
     * todoStats: 返回当前用户的 Todo 统计数据
     * 后端会自动计算所有的统计指标
     */
    todoStats {
      total
      completed
      pending
      completionPercentage
      urgentCount
      highCount
      mediumCount
      lowCount
      overdueCount
    }
  }
`;

/**
 * 获取分类统计数据
 *
 * GraphQL 查询概览：
 * - 参数：无
 * - 返回：分类统计数据数组
 *
 * 返回的数据结构（数组）：
 * [
 *   {
 *     categoryName: "工作",
 *     totalTodos: 12,
 *     completedTodos: 5,
 *     completionRate: 41.67
 *   },
 *   ...
 * ]
 *
 * 业务意义：
 * - 显示每个分类的任务数量
 * - 识别哪个分类有最多的未完成任务
 * - 计算每个分类的完成率
 * - 帮助用户平衡不同分类的工作量
 *
 * 使用场景：
 * 1. Dashboard 页面的分类统计表格
 * 2. 分类选择器显示任务数量
 * 3. 分类页面显示统计概览
 * 4. 数据报表生成
 *
 * 使用示例：
 * ```
 * const { data } = useQuery(GET_CATEGORY_STATS);
 *
 * if (data?.categoryStats) {
 *   data.categoryStats.map(cat => (
 *     <CategoryRow
 *       name={cat.categoryName}
 *       total={cat.totalTodos}
 *       completed={cat.completedTodos}
 *       rate={cat.completionRate}
 *     />
 *   ))
 * }
 * ```
 *
 * 对应后端：
 * @Query(() => [CategoryStats])
 * @UseGuards(GqlAuthGuard)
 * async categoryStats(@CurrentUser() user: User): Promise<CategoryStats[]>
 */
export const GET_CATEGORY_STATS = gql`
  query GetCategoryStats {
    /**
     * categoryStats: 返回所有分类的统计数据
     * 显示每个分类中的任务统计
     */
    categoryStats {
      categoryName
      totalTodos
      completedTodos
      completionRate
    }
  }
`;

/**
 * 获取仪表板数据（综合统计）
 *
 * GraphQL 查询概览：
 * - 参数：无
 * - 返回：完整的仪表板数据
 *
 * Dashboard 包含的信息：
 * 1. todoStats: 上述的 Todo 统计
 * 2. categoryStats: 上述的分类统计
 * 3. recentTodosCount: 最近创建的 Todo 数量
 * 4. completedTodayCount: 今天完成的 Todo 数量（可选）
 * 5. upcomingDeadlines: 即将到期的 Todo 列表（可选）
 * 6. recentActivity: 最近的活动日志（可选）
 *
 * 与单独查询的区别：
 * - 单个查询需要多次 API 调用
 * - Dashboard 查询在一次请求中获取所有数据
 * - 提高了网络效率
 * - 减少了数据库查询次数
 *
 * 业务意义：
 * - 提供用户的完整工作概览
 * - 显示重要的提醒信息
 * - 帮助用户快速了解工作状态
 *
 * 使用场景：
 * 1. Dashboard 页面加载初始数据
 * 2. 用户登录后的欢迎页面
 * 3. 首页的统计摘要
 *
 * 性能考虑：
 * - Dashboard 查询比较复杂，可能返回大量数据
 * - 建议在用户导航到 Dashboard 时才执行
 * - 可以添加分页或限制返回的项数
 * - 适当的缓存可以提高性能
 *
 * 使用示例：
 * ```
 * const { data, loading } = useQuery(GET_DASHBOARD);
 *
 * if (loading) return <Loading />;
 *
 * const {
 *   todoStats,
 *   categoryStats,
 *   recentTodosCount,
 *   upcomingDeadlines
 * } = data?.dashboard;
 *
 * return (
 *   <Dashboard
 *     stats={todoStats}
 *     categories={categoryStats}
 *     recentCount={recentTodosCount}
 *     upcomingTodos={upcomingDeadlines}
 *   />
 * );
 * ```
 *
 * 对应后端：
 * @Query(() => Dashboard)
 * @UseGuards(GqlAuthGuard)
 * async dashboard(@CurrentUser() user: User): Promise<Dashboard>
 */
export const GET_DASHBOARD = gql`
  query GetDashboard {
    /**
     * dashboard: 获取完整的仪表板数据
     * 包含所有必要的统计信息用于显示 Dashboard 页面
     */
    dashboard {
      todoStats {
        total
        completed
        pending
        completionPercentage
        urgentCount
        highCount
        mediumCount
        lowCount
        overdueCount
      }
      categoryStats {
        categoryName
        totalTodos
        completedTodos
        completionRate
      }
      recentTodosCount
      completedTodayCount
      upcomingDeadlines {
        id
        title
        priority
        dueDate
        category {
          name
        }
      }
    }
  }
`;

/**
 * 获取用户的活动统计（可选扩展功能）
 *
 * 这个查询用于显示用户的活动趋势：
 * - 每天完成的任务数
 * - 每周的生产力指标
 * - 最活跃的时间
 * - 常用的标签
 *
 * 使用场景：
 * 1. 用户活动报告
 * 2. 生产力分析
 * 3. 行为统计
 *
 * 这是一个学习模块的高级功能示例。
 */
export const GET_ACTIVITY_STATS = gql`
  query GetActivityStats($days: Int = 30) {
    /**
     * activityStats: 获取用户的活动统计
     * days: 查询最近多少天的数据（默认 30 天）
     */
    activityStats(days: $days) {
      date
      todosCompleted
      todosCreated
      tasksWithComments
    }
  }
`;
