/**
 * StatsResolver - 统计和分析解析器
 *
 * 这个解析器提供了各种统计数据，用于展示在仪表板上
 * 展示如何进行数据聚合和统计查询
 *
 * 学习重点：
 * - 如何写复杂的数据库查询
 * - 如何设计统计数据的 DTO
 * - 如何返回计算后的结果
 */

import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Todo } from '../todo/todo.entity';
import { Category } from '../category/category.entity';
import { User } from '../user/user.entity';
import { CategoryStats } from '../category/dto/category-stats.type';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * 待办事项统计 DTO
 *
 * 用于返回待办事项的各种统计数据
 * 例如：总数、已完成数、未完成数等
 */
@ObjectType()
export class TodoStats {
  /**
   * 总的待办事项数
   */
  @Field(() => Int)
  total: number;

  /**
   * 已完成的待办事项数
   */
  @Field(() => Int)
  completed: number;

  /**
   * 未完成的待办事项数
   */
  @Field(() => Int)
  pending: number;

  /**
   * 完成百分比 (0-100)
   * 便于前端显示进度条
   */
  @Field(() => Int)
  completionPercentage: number;

  /**
   * 不同优先级的待办事项统计
   */
  @Field(() => Int)
  urgentCount: number;

  @Field(() => Int)
  highCount: number;

  @Field(() => Int)
  mediumCount: number;

  @Field(() => Int)
  lowCount: number;

  /**
   * 逾期的待办事项数（dueDate 已过期）
   */
  @Field(() => Int)
  overdueCount: number;
}


/**
 * 仪表板数据 DTO
 *
 * 包含多种统计信息，用于首页展示
 */
@ObjectType()
export class DashboardData {
  /**
   * 待办事项统计
   */
  @Field()
  todoStats: TodoStats;

  /**
   * 分类统计列表
   */
  @Field(() => [CategoryStats])
  categoryStats: CategoryStats[];

  /**
   * 最近创建的待办事项（用于快速导览）
   */
  @Field(() => Int)
  recentTodosCount: number;
}

/**
 * 统计解析器
 */
@Resolver()
export class StatsResolver {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /**
   * Query: 获取用户的待办事项统计
   *
   * GraphQL 查询示例：
   * query {
   *   todoStats {
   *     total
   *     completed
   *     pending
   *     completionPercentage
   *     urgentCount
   *     overdueCount
   *   }
   * }
   *
   * 这个查询展示了如何：
   * 1. 进行数据库聚合查询
   * 2. 计算派生数据（如完成百分比）
   * 3. 按照条件计数（优先级、逾期状态等）
   */
  @Query(() => TodoStats)
  @UseGuards(GqlAuthGuard)
  async todoStats(@CurrentUser() user: User): Promise<TodoStats> {
    // 使用 QueryBuilder 在数据库层面计算统计数据（高效）
    const baseQuery = this.todoRepository
      .createQueryBuilder('todo')
      .where('todo.userId = :userId', { userId: user.id });

    // 计算总数
    const total = await baseQuery.getCount();

    // 计算完成数
    const completed = await baseQuery
      .clone()
      .andWhere('todo.completed = true')
      .getCount();

    const pending = total - completed;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 按优先级计数（在数据库中计数）
    const urgentCount = await baseQuery
      .clone()
      .andWhere('todo.priority = :priority', { priority: 'URGENT' })
      .getCount();

    const highCount = await baseQuery
      .clone()
      .andWhere('todo.priority = :priority', { priority: 'HIGH' })
      .getCount();

    const mediumCount = await baseQuery
      .clone()
      .andWhere('todo.priority = :priority', { priority: 'MEDIUM' })
      .getCount();

    const lowCount = await baseQuery
      .clone()
      .andWhere('todo.priority = :priority', { priority: 'LOW' })
      .getCount();

    // 计算逾期的待办事项数
    const now = new Date();
    const overdueCount = await baseQuery
      .clone()
      .andWhere('todo.completed = false')
      .andWhere('todo.dueDate IS NOT NULL')
      .andWhere('todo.dueDate < :now', { now })
      .getCount();

    return {
      total,
      completed,
      pending,
      completionPercentage,
      urgentCount,
      highCount,
      mediumCount,
      lowCount,
      overdueCount,
    };
  }

  /**
   * Query: 获取分类统计
   *
   * GraphQL 查询示例：
   * query {
   *   categoryStats {
   *     categoryName
   *     totalTodos
   *     completedTodos
   *   }
   * }
   *
   * 这个查询展示了如何：
   * 1. 关联多个表进行查询
   * 2. 按照某个字段分组统计
   */
  @Query(() => [CategoryStats])
  @UseGuards(GqlAuthGuard)
  async categoryStats(@CurrentUser() user: User): Promise<CategoryStats[]> {
    // 获取用户的所有分类
    const categories = await this.categoryRepository.find({
      where: { userId: user.id },
      relations: ['todos'],
    });

    // 为每个分类计算统计数据
    const stats = categories.map((category) => {
      const todoCount = category.todos?.length || 0;
      const completedCount = category.todos?.filter((t) => t.completed).length || 0;

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        todoCount,
        completedCount,
      };
    });

    return stats;
  }

  /**
   * Query: 获取完整的仪表板数据
   *
   * GraphQL 查询示例：
   * query {
   *   dashboard {
   *     todoStats { total completed }
   *     categoryStats { categoryName totalTodos }
   *     recentTodosCount
   *   }
   * }
   *
   * 这是一个"组合查询"，一次性返回多种统计数据
   * 前端可以用这个单一查询获取首页需要的所有信息
   * 比分别查询 todoStats + categoryStats 更高效
   */
  @Query(() => DashboardData)
  @UseGuards(GqlAuthGuard)
  async dashboard(@CurrentUser() user: User): Promise<DashboardData> {
    // 获取待办事项统计
    const todoStatsResult = await this.todoStats(user);

    // 获取分类统计
    const categoryStatsResult = await this.categoryStats(user);

    // 获取最近 7 天创建的待办事项数
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTodos = await this.todoRepository.find({
      where: { userId: user.id },
    });

    const recentTodosCount = recentTodos.filter(
      (t) => new Date(t.createdAt) > sevenDaysAgo,
    ).length;

    return {
      todoStats: todoStatsResult,
      categoryStats: categoryStatsResult,
      recentTodosCount,
    };
  }
}
