/**
 * 购物车仓储库
 *
 * 提供购物车的数据访问和自定义查询功能
 *
 * 核心职责：
 * 1. 购物车查询：按用户查询、按状态查询、分页查询
 * 2. 分析查询：高价值购物车、已废弃购物车、转换率分析
 * 3. 批量操作：支持DataLoader批量查询
 * 4. 统计查询：购物车总数、平均价值、收入分析
 *
 * @author Claude
 * @module Ecommerce/ShoppingCart
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ShoppingCart, CartStatus } from '../entities/shopping-cart.entity';

/**
 * 购物车排序选项
 */
export enum ShoppingCartSortBy {
  CREATED = 'created',
  UPDATED = 'updated',
  TOTAL_VALUE = 'totalValue',
  ITEM_COUNT = 'itemCount',
}

/**
 * 购物车统计结果
 */
export interface CartStatistics {
  totalCarts: number;
  activeCarts: number;
  abandonedCarts: number;
  convertedCarts: number;
  totalValue: number;
  averageValue: number;
  abandonmentRate: number;
}

/**
 * 高价值购物车查询结果
 */
export interface HighValueCart {
  cartId: string;
  userId: string;
  totalValue: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: CartStatus;
}

/**
 * 购物车转换分析
 */
export interface CartConversionAnalysis {
  totalActiveCarts: number;
  convertedCarts: number;
  abandonedCarts: number;
  conversionRate: number;
  abandonmentRate: number;
  averageTimeToConversion: number; // Minutes
}

/**
 * 购物车分页结果
 */
export interface CartPaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

@Injectable()
export class ShoppingCartRepository extends Repository<ShoppingCart> {
  private readonly logger = new Logger(ShoppingCartRepository.name);

  constructor(
    @InjectRepository(ShoppingCart)
    private cartRepository: Repository<ShoppingCart>,
    private dataSource: DataSource,
  ) {
    super(
      ShoppingCart.prototype.constructor,
      dataSource.createEntityManager(),
    );
  }

  /**
   * 按用户ID查找购物车
   *
   * @param userId 用户ID
   * @param status 可选的购物车状态筛选
   * @returns 购物车列表
   */
  async findByUserId(
    userId: string,
    status?: CartStatus,
  ): Promise<ShoppingCart[]> {
    const query = this.cartRepository
      .createQueryBuilder('cart')
      .where('cart.userId = :userId', { userId })
      .leftJoinAndSelect('cart.items', 'items')
      .orderBy('cart.createdAt', 'DESC');

    if (status) {
      query.andWhere('cart.status = :status', { status });
    }

    return query.getMany();
  }

  /**
   * 按用户ID查找活跃购物车（分页）
   *
   * @param userId 用户ID
   * @param page 页码（从1开始）
   * @param pageSize 每页数量
   * @returns 分页结果
   */
  async findActiveCartsByUserPaginated(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<CartPaginationResult<ShoppingCart>> {
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.cartRepository
      .createQueryBuilder('cart')
      .where('cart.userId = :userId', { userId })
      .andWhere('cart.status = :status', { status: CartStatus.ACTIVE })
      .leftJoinAndSelect('cart.items', 'items')
      .orderBy('cart.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 查找所有活跃购物车
   *
   * @returns 活跃购物车列表
   */
  async findActiveCarts(): Promise<ShoppingCart[]> {
    return this.cartRepository
      .createQueryBuilder('cart')
      .where('cart.status = :status', { status: CartStatus.ACTIVE })
      .leftJoinAndSelect('cart.items', 'items')
      .orderBy('cart.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 查找所有已废弃购物车
   *
   * @param limit 限制数量
   * @returns 已废弃购物车列表
   */
  async findAbandonedCarts(limit?: number): Promise<ShoppingCart[]> {
    const query = this.cartRepository
      .createQueryBuilder('cart')
      .where('cart.status = :status', { status: CartStatus.ABANDONED })
      .leftJoinAndSelect('cart.items', 'items')
      .orderBy('cart.updatedAt', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    return query.getMany();
  }

  /**
   * 查找所有已转换的购物车（已下单）
   *
   * @param limit 限制数量
   * @returns 已转换购物车列表
   */
  async findConvertedCarts(limit?: number): Promise<ShoppingCart[]> {
    const query = this.cartRepository
      .createQueryBuilder('cart')
      .where('cart.status = :status', { status: CartStatus.CONVERTED })
      .leftJoinAndSelect('cart.items', 'items')
      .orderBy('cart.updatedAt', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    return query.getMany();
  }

  /**
   * 查找高价值购物车
   *
   * @param minValue 最低价值（元）
   * @param limit 限制数量
   * @returns 高价值购物车列表
   */
  async findHighValueCarts(
    minValue: number,
    limit: number = 20,
  ): Promise<HighValueCart[]> {
    const carts = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .where('cart.status = :status', { status: CartStatus.ACTIVE })
      .orderBy('cart.updatedAt', 'DESC')
      .getMany();

    // Calculate total values in memory and filter
    const highValueCarts = carts
      .map((cart) => ({
        cartId: cart.id,
        userId: cart.userId,
        totalValue: cart.total,
        itemCount: cart.items?.length || 0,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        status: cart.status,
      }))
      .filter((cart) => cart.totalValue >= minValue)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit);

    return highValueCarts;
  }

  /**
   * 查找低价值购物车（可作为促销目标）
   *
   * @param maxValue 最高价值（元）
   * @param limit 限制数量
   * @returns 低价值购物车列表
   */
  async findLowValueCarts(
    maxValue: number,
    limit: number = 20,
  ): Promise<HighValueCart[]> {
    const carts = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .where('cart.status = :status', { status: CartStatus.ACTIVE })
      .orderBy('cart.updatedAt', 'DESC')
      .getMany();

    // Calculate total values and filter
    const lowValueCarts = carts
      .map((cart) => ({
        cartId: cart.id,
        userId: cart.userId,
        totalValue: cart.total,
        itemCount: cart.items?.length || 0,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        status: cart.status,
      }))
      .filter((cart) => cart.totalValue <= maxValue)
      .sort((a, b) => a.totalValue - b.totalValue)
      .slice(0, limit);

    return lowValueCarts;
  }

  /**
   * 查找购物车总价值
   *
   * 用于计算特定时期内所有购物车的总价值
   *
   * @returns 总价值（元）
   */
  async getCartsTotalValue(): Promise<number> {
    const carts = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .getMany();

    return carts.reduce((total, cart) => total + cart.total, 0);
  }

  /**
   * 按状态统计购物车数量
   *
   * @param status 购物车状态
   * @returns 数量
   */
  async countByStatus(status: CartStatus): Promise<number> {
    return this.cartRepository.count({
      where: { status },
    });
  }

  /**
   * 按用户统计活跃购物车数量
   *
   * @param userId 用户ID
   * @returns 活跃购物车数量
   */
  async countActiveCartsByUser(userId: string): Promise<number> {
    return this.cartRepository.count({
      where: {
        userId,
        status: CartStatus.ACTIVE,
      },
    });
  }

  /**
   * 获取购物车总体统计
   *
   * @returns 统计信息
   */
  async getCartStatistics(): Promise<CartStatistics> {
    const [activeCarts, abandonedCarts, convertedCarts] = await Promise.all([
      this.countByStatus(CartStatus.ACTIVE),
      this.countByStatus(CartStatus.ABANDONED),
      this.countByStatus(CartStatus.CONVERTED),
    ]);

    const totalCarts = activeCarts + abandonedCarts + convertedCarts;
    const totalValue = await this.getCartsTotalValue();
    const averageValue = totalCarts > 0 ? totalValue / totalCarts : 0;

    const abandonmentRate =
      totalCarts > 0 ? (abandonedCarts / totalCarts) * 100 : 0;

    return {
      totalCarts,
      activeCarts,
      abandonedCarts,
      convertedCarts,
      totalValue,
      averageValue,
      abandonmentRate,
    };
  }

  /**
   * 获取购物车转换分析
   *
   * @returns 转换分析信息
   */
  async getCartConversionAnalysis(): Promise<CartConversionAnalysis> {
    const activeCarts = await this.findActiveCarts();
    const convertedCarts = await this.cartRepository.count({
      where: { status: CartStatus.CONVERTED },
    });
    const abandonedCarts = await this.cartRepository.count({
      where: { status: CartStatus.ABANDONED },
    });

    const totalActiveCarts = activeCarts.length;

    // Calculate average time to conversion (for converted carts)
    const convertedCartsData = await this.findConvertedCarts(1000);
    let totalTimeToConversion = 0;
    convertedCartsData.forEach((cart) => {
      if (cart.createdAt) {
        const timeToConversion =
          (cart.updatedAt.getTime() - cart.createdAt.getTime()) / (1000 * 60); // Minutes
        totalTimeToConversion += timeToConversion;
      }
    });

    const averageTimeToConversion =
      convertedCarts > 0 ? totalTimeToConversion / convertedCarts : 0;

    const totalCarts = totalActiveCarts + abandonedCarts + convertedCarts;
    const conversionRate = totalCarts > 0 ? (convertedCarts / totalCarts) * 100 : 0;
    const abandonmentRate = totalCarts > 0 ? (abandonedCarts / totalCarts) * 100 : 0;

    return {
      totalActiveCarts,
      convertedCarts,
      abandonedCarts,
      conversionRate,
      abandonmentRate,
      averageTimeToConversion,
    };
  }

  /**
   * 按SKU查找包含该SKU的购物车
   *
   * @param skuId SKU ID
   * @returns 包含该SKU的购物车列表
   */
  async findCartsBySku(skuId: string): Promise<ShoppingCart[]> {
    return this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .where('items.skuId = :skuId', { skuId })
      .andWhere('cart.status = :status', { status: CartStatus.ACTIVE })
      .getMany();
  }

  /**
   * 按用户和日期范围查找购物车
   *
   * @param userId 用户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 购物车列表
   */
  async findCartsByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ShoppingCart[]> {
    return this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .where('cart.userId = :userId', { userId })
      .andWhere('cart.createdAt >= :startDate', { startDate })
      .andWhere('cart.createdAt <= :endDate', { endDate })
      .orderBy('cart.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 查找指定时间之后未更新的购物车（用于标记为已废弃）
   *
   * @param minutes 多少分钟没有更新
   * @returns 购物车列表
   */
  async findStaleActiveCarts(minutes: number = 1440): Promise<ShoppingCart[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    return this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .where('cart.status = :status', { status: CartStatus.ACTIVE })
      .andWhere('cart.updatedAt < :cutoffTime', { cutoffTime })
      .orderBy('cart.updatedAt', 'DESC')
      .getMany();
  }

  /**
   * 按多个SKU ID批量查询购物车（支持DataLoader模式）
   *
   * @param userIds 用户ID列表
   * @returns 购物车列表（按用户ID分组）
   */
  async findByUserIdsBatch(
    userIds: string[],
  ): Promise<Map<string, ShoppingCart[]>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const carts = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .where('cart.userId IN (:...userIds)', { userIds })
      .andWhere('cart.status = :status', { status: CartStatus.ACTIVE })
      .getMany();

    // Group by userId
    const result = new Map<string, ShoppingCart[]>();
    carts.forEach((cart) => {
      if (!result.has(cart.userId)) {
        result.set(cart.userId, []);
      }
      result.get(cart.userId)!.push(cart);
    });

    return result;
  }

  /**
   * 获取购物车项目分布统计
   *
   * 统计购物车中商品数量的分布情况
   *
   * @returns 分布信息
   */
  async getCartItemDistribution(): Promise<
    { itemCount: number; cartCount: number }[]
  > {
    const carts = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .where('cart.status = :status', { status: CartStatus.ACTIVE })
      .getMany();

    const distribution = new Map<number, number>();

    carts.forEach((cart) => {
      const itemCount = cart.items?.length || 0;
      distribution.set(itemCount, (distribution.get(itemCount) || 0) + 1);
    });

    return Array.from(distribution.entries())
      .map(([itemCount, cartCount]) => ({
        itemCount,
        cartCount,
      }))
      .sort((a, b) => a.itemCount - b.itemCount);
  }

  /**
   * 查找需要关注的购物车（高价值但长时间未更新的）
   *
   * @param minValue 最低价值（元）
   * @param minutesInactive 多少分钟没有更新
   * @returns 购物车列表
   */
  async findAtRiskCarts(
    minValue: number,
    minutesInactive: number = 1440,
  ): Promise<HighValueCart[]> {
    const cutoffTime = new Date(Date.now() - minutesInactive * 60 * 1000);

    const carts = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items')
      .where('cart.status = :status', { status: CartStatus.ACTIVE })
      .andWhere('cart.updatedAt < :cutoffTime', { cutoffTime })
      .getMany();

    return carts
      .filter((cart) => cart.total >= minValue)
      .map((cart) => ({
        cartId: cart.id,
        userId: cart.userId,
        totalValue: cart.total,
        itemCount: cart.items?.length || 0,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        status: cart.status,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }
}
