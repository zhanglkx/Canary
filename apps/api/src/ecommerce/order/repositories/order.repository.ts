/**
 * 订单仓储库
 *
 * 提供高级查询和数据操作方法，包括：
 * - 用户订单查询
 * - 状态过滤和排序
 * - 分析和报表查询
 * - 批量操作
 *
 * @author Claude
 * @module Ecommerce/Order
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan, MoreThan } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';

/**
 * 订单查询选项
 */
export interface OrderQueryOptions {
  skip?: number;
  take?: number;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 订单统计结果
 */
export interface OrderStatResult {
  status: OrderStatus;
  count: number;
  totalAmount: number;
  averageAmount: number;
}

/**
 * 日收入结果
 */
export interface DailyRevenueResult {
  date: string;
  ordersCount: number;
  totalAmount: number;
}

/**
 * 用户订单分析
 */
export interface UserOrderAnalysis {
  userId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  mostFrequentStatus: OrderStatus;
}

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private repository: Repository<Order>,
  ) {}

  /**
   * 按ID获取订单
   *
   * @param id 订单ID
   * @returns 订单
   */
  async findById(id: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['items', 'items.sku', 'items.product', 'user'],
    });
  }

  /**
   * 按订单号获取订单
   *
   * @param orderNumber 订单号
   * @returns 订单
   */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { orderNumber },
      relations: ['items', 'user'],
    });
  }

  /**
   * 获取用户订单
   *
   * @param userId 用户ID
   * @param options 查询选项
   * @returns [订单列表, 总数]
   */
  async findUserOrders(
    userId: string,
    options: OrderQueryOptions = {},
  ): Promise<[Order[], number]> {
    const query = this.repository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .leftJoinAndSelect('order.items', 'items');

    if (options.status) {
      query.andWhere('order.status = :status', { status: options.status });
    }

    if (options.startDate && options.endDate) {
      query.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    }

    const skip = options.skip || 0;
    const take = options.take || 10;

    return query
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  /**
   * 获取指定状态的订单
   *
   * @param status 订单状态
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns [订单列表, 总数]
   */
  async findByStatus(
    status: OrderStatus,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Order[], number]> {
    return this.repository.findAndCount({
      where: { status },
      relations: ['items', 'user'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  /**
   * 获取需要处理的订单（待支付超过24小时）
   *
   * @returns 订单列表
   */
  async findPendingOrdersOverdue(): Promise<Order[]> {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .andWhere('order.createdAt < :cutoffTime', { cutoffTime })
      .orderBy('order.createdAt', 'ASC')
      .getMany();
  }

  /**
   * 获取待发货订单
   *
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns [订单列表, 总数]
   */
  async findPendingShipments(
    skip: number = 0,
    take: number = 20,
  ): Promise<[Order[], number]> {
    return this.repository.findAndCount({
      where: { status: OrderStatus.CONFIRMED },
      relations: ['items', 'user'],
      order: { createdAt: 'ASC' },
      skip,
      take,
    });
  }

  /**
   * 获取订单状态统计
   *
   * @returns 统计结果数组
   */
  async getStatusStatistics(): Promise<OrderStatResult[]> {
    const result = await this.repository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(order.subtotalCents + order.taxCents + order.shippingCents - order.discountCents) / 100', 'totalAmount')
      .addSelect('AVG(order.subtotalCents + order.taxCents + order.shippingCents - order.discountCents) / 100', 'averageAmount')
      .groupBy('order.status')
      .getRawMany();

    return result.map((row) => ({
      status: row.status,
      count: parseInt(row.count, 10),
      totalAmount: parseFloat(row.totalAmount) || 0,
      averageAmount: parseFloat(row.averageAmount) || 0,
    }));
  }

  /**
   * 获取日收入统计
   *
   * @param days 天数
   * @returns 日收入数组
   */
  async getDailyRevenueStatistics(days: number = 7): Promise<DailyRevenueResult[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await this.repository
      .createQueryBuilder('order')
      .select("DATE_FORMAT(order.createdAt, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'ordersCount')
      .addSelect('SUM(order.subtotalCents + order.taxCents + order.shippingCents - order.discountCents) / 100', 'totalAmount')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.status != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .groupBy('date')
      .orderBy('date', 'DESC')
      .getRawMany();

    return result.map((row) => ({
      date: row.date,
      ordersCount: parseInt(row.ordersCount, 10),
      totalAmount: parseFloat(row.totalAmount) || 0,
    }));
  }

  /**
   * 获取用户订单分析
   *
   * @param userId 用户ID
   * @returns 分析结果
   */
  async getUserOrderAnalysis(userId: string): Promise<UserOrderAnalysis | null> {
    const orders = await this.repository.find({
      where: { userId },
      relations: ['items'],
    });

    if (orders.length === 0) {
      return null;
    }

    const totalSpent = orders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const statusCounts: Record<OrderStatus, number> = {} as any;
    for (const status of Object.values(OrderStatus)) {
      statusCounts[status] = orders.filter((o) => o.status === status).length;
    }

    const mostFrequentStatus = (
      Object.entries(statusCounts) as [OrderStatus, number][]
    ).reduce(([prevStatus, prevCount], [status, count]) =>
      count > prevCount ? [status, count] : [prevStatus, prevCount],
    )[0];

    return {
      userId,
      totalOrders: orders.length,
      totalSpent,
      averageOrderValue: totalSpent / orders.length,
      lastOrderDate: orders.length > 0 ? orders[0].createdAt : null,
      mostFrequentStatus,
    };
  }

  /**
   * 获取高价值客户
   *
   * @param limit 限制数量
   * @returns 用户ID和总消费数组
   */
  async getTopCustomersBySpent(limit: number = 10): Promise<
    Array<{ userId: string; totalSpent: number }>
  > {
    const result = await this.repository
      .createQueryBuilder('order')
      .select('order.userId', 'userId')
      .addSelect('SUM(order.subtotalCents + order.taxCents + order.shippingCents - order.discountCents) / 100', 'totalSpent')
      .where('order.status != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .groupBy('order.userId')
      .orderBy('totalSpent', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((row) => ({
      userId: row.userId,
      totalSpent: parseFloat(row.totalSpent) || 0,
    }));
  }

  /**
   * 获取活跃订单计数
   *
   * @returns 活跃订单数量
   */
  async getActiveOrdersCount(): Promise<number> {
    return this.repository.count({
      where: {
        status: In([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED]),
      },
    });
  }

  /**
   * 获取取消率
   *
   * @returns 取消率百分比
   */
  async getCancellationRate(): Promise<number> {
    const total = await this.repository.count();
    if (total === 0) return 0;

    const cancelled = await this.repository.count({
      where: { status: OrderStatus.CANCELLED },
    });

    return (cancelled / total) * 100;
  }

  /**
   * 获取期间内的订单分析
   *
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 分析数据
   */
  async getOrdersAnalysisByDateRange(startDate: Date, endDate: Date): Promise<{
    totalOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('order')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getManyAndCount();

    const orders = result[0];

    const totalRevenue = orders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      totalOrders: result[1],
      confirmedOrders: orders.filter((o) => o.status === OrderStatus.CONFIRMED)
        .length,
      shippedOrders: orders.filter((o) => o.status === OrderStatus.SHIPPED)
        .length,
      deliveredOrders: orders.filter((o) => o.status === OrderStatus.DELIVERED)
        .length,
      cancelledOrders: orders.filter((o) => o.status === OrderStatus.CANCELLED)
        .length,
      totalRevenue,
    };
  }

  /**
   * 获取未发货超过指定天数的订单
   *
   * @param days 天数
   * @returns 订单列表
   */
  async findUnshippedOrdersOlderThan(days: number): Promise<Order[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.status = :confirmedStatus', {
        confirmedStatus: OrderStatus.CONFIRMED,
      })
      .andWhere('order.paidAt < :cutoffDate', { cutoffDate })
      .orderBy('order.paidAt', 'ASC')
      .getMany();
  }

  /**
   * 批量更新订单状态
   *
   * @param orderIds 订单ID数组
   * @param status 新状态
   * @returns 更新的数量
   */
  async updateOrdersStatus(orderIds: string[], status: OrderStatus): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Order)
      .set({ status })
      .where('id IN (:...orderIds)', { orderIds })
      .execute();

    return result.affected || 0;
  }

  /**
   * 搜索订单
   *
   * @param keyword 关键词（订单号、收货人名字等）
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns [订单列表, 总数]
   */
  async searchOrders(
    keyword: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Order[], number]> {
    return this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.orderNumber LIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .orWhere('order.recipientName LIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }
}
