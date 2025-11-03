/**
 * 库存仓储
 *
 * 提供复杂的库存查询方法
 * 避免N+1查询，使用QueryBuilder优化
 *
 * @author Claude
 * @module Ecommerce/Inventory
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';

/**
 * 库存排序类型
 */
export enum InventorySortBy {
  STOCK = 'stock',
  RESERVED = 'reserved',
  AVAILABLE = 'available',
  LAST_CHECK = 'lastCheck',
  CREATED = 'created',
}

/**
 * 库存查询条件
 */
export interface InventoryQueryOptions {
  sortBy?: InventorySortBy;
  order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

@Injectable()
export class InventoryRepository extends Repository<Inventory> {
  constructor(private dataSource: DataSource) {
    super(
      Inventory,
      dataSource.createEntityManager(),
    );
  }

  /**
   * 查找低库存的SKU
   *
   * @returns 库存数低于警告线的记录，按库存升序排列
   */
  async findLowStockInventories(options?: InventoryQueryOptions): Promise<Inventory[]> {
    let query = this.createQueryBuilder('inventory')
      .where('inventory.currentStock <= inventory.warningThreshold')
      .andWhere('inventory.currentStock > 0');

    // 应用排序
    const sortBy = options?.sortBy || InventorySortBy.STOCK;
    const order = options?.order || 'ASC';

    switch (sortBy) {
      case InventorySortBy.RESERVED:
        query = query.orderBy('inventory.reservedStock', order);
        break;
      case InventorySortBy.AVAILABLE:
        query = query.orderBy(
          '(inventory.currentStock - inventory.reservedStock)',
          order,
        );
        break;
      case InventorySortBy.LAST_CHECK:
        query = query.orderBy('inventory.lastCheckTime', order);
        break;
      case InventorySortBy.CREATED:
        query = query.orderBy('inventory.createdAt', order);
        break;
      case InventorySortBy.STOCK:
      default:
        query = query.orderBy('inventory.currentStock', order);
        break;
    }

    // 应用分页
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return query.getMany();
  }

  /**
   * 查找缺货的SKU（库存为0）
   *
   * @returns 库存为0且有预留的记录
   */
  async findOutOfStockInventories(): Promise<Inventory[]> {
    return this.createQueryBuilder('inventory')
      .where('inventory.currentStock = 0')
      .orderBy('inventory.reservedStock', 'DESC')
      .addOrderBy('inventory.updatedAt', 'DESC')
      .getMany();
  }

  /**
   * 查找库存溢出的SKU
   *
   * 场景：发现SKU有过多库存，可能存在重复补货或数据错误
   *
   * @param maxThreshold 库存上限阈值
   * @returns 超过阈值的记录
   */
  async findOverstockInventories(maxThreshold: number = 1000): Promise<Inventory[]> {
    return this.createQueryBuilder('inventory')
      .where('inventory.currentStock > :maxThreshold', { maxThreshold })
      .orderBy('inventory.currentStock', 'DESC')
      .getMany();
  }

  /**
   * 查找有预留库存的SKU
   *
   * 用于订单统计、库存分析
   *
   * @returns 至少有1件预留库存的记录
   */
  async findInventoriesWithReserve(): Promise<Inventory[]> {
    return this.createQueryBuilder('inventory')
      .where('inventory.reservedStock > 0')
      .orderBy('inventory.reservedStock', 'DESC')
      .addOrderBy('inventory.updatedAt', 'DESC')
      .getMany();
  }

  /**
   * 查找近期有损耗的SKU
   *
   * @param days 最近N天
   * @returns 有损耗记录的SKU
   */
  async findInventoriesWithDamage(days: number = 30): Promise<Inventory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.createQueryBuilder('inventory')
      .where('inventory.damageCount > 0')
      .andWhere('inventory.updatedAt >= :startDate', { startDate })
      .orderBy('inventory.damageCount', 'DESC')
      .addOrderBy('inventory.updatedAt', 'DESC')
      .getMany();
  }

  /**
   * 查找库存周转率高的SKU
   *
   * 周转率 = 出库总数 / 入库总数
   *
   * @returns 出库数最多的SKU列表
   */
  async findFastMovingInventories(limit: number = 10): Promise<Inventory[]> {
    return this.createQueryBuilder('inventory')
      .where('inventory.outboundTotal > 0')
      .orderBy('inventory.outboundTotal', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * 查找库存周转率低的SKU（滞销品）
   *
   * @returns 出库数最少的SKU列表
   */
  async findSlowMovingInventories(limit: number = 10): Promise<Inventory[]> {
    return this.createQueryBuilder('inventory')
      .where('inventory.outboundTotal < :threshold', { threshold: 5 })
      .orderBy('inventory.outboundTotal', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * 查找需要库存检查的SKU
   *
   * 场景：定期库存盘点
   * 规则：
   * - 30天内未检查的，或
   * - 预留库存与实际不符的可疑记录
   *
   * @returns 需要检查的库存记录
   */
  async findInventoriesNeedingCheck(): Promise<Inventory[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.createQueryBuilder('inventory')
      .where(
        `inventory.lastCheckTime IS NULL
         OR inventory.lastCheckTime < :checkDate
         OR (inventory.reservedStock < 0)`,
        { checkDate: thirtyDaysAgo },
      )
      .orderBy('inventory.lastCheckTime', 'ASC')
      .addOrderBy('inventory.createdAt', 'ASC')
      .getMany();
  }

  /**
   * 获取库存统计信息
   *
   * @returns 统计数据对象
   */
  async getInventoryStats(): Promise<{
    totalSkus: number;
    totalStock: number;
    totalReserved: number;
    totalAvailable: number;
    lowStockCount: number;
    outOfStockCount: number;
    avgStockPerSku: number;
    totalInbound: number;
    totalOutbound: number;
    totalDamage: number;
  }> {
    const result = await this.createQueryBuilder('inventory')
      .select('COUNT(inventory.id)', 'totalSkus')
      .addSelect('SUM(inventory.currentStock)', 'totalStock')
      .addSelect('SUM(inventory.reservedStock)', 'totalReserved')
      .addSelect(
        'SUM(inventory.currentStock - inventory.reservedStock)',
        'totalAvailable',
      )
      .addSelect(
        `COUNT(CASE WHEN inventory.currentStock <= inventory.warningThreshold
                    AND inventory.currentStock > 0 THEN 1 END)`,
        'lowStockCount',
      )
      .addSelect(
        'COUNT(CASE WHEN inventory.currentStock = 0 THEN 1 END)',
        'outOfStockCount',
      )
      .addSelect('SUM(inventory.inboundTotal)', 'totalInbound')
      .addSelect('SUM(inventory.outboundTotal)', 'totalOutbound')
      .addSelect('SUM(inventory.damageCount)', 'totalDamage')
      .getRawOne();

    return {
      totalSkus: parseInt(result.totalSkus) || 0,
      totalStock: parseInt(result.totalStock) || 0,
      totalReserved: parseInt(result.totalReserved) || 0,
      totalAvailable: parseInt(result.totalAvailable) || 0,
      lowStockCount: parseInt(result.lowStockCount) || 0,
      outOfStockCount: parseInt(result.outOfStockCount) || 0,
      avgStockPerSku:
        (parseInt(result.totalStock) || 0) / (parseInt(result.totalSkus) || 1),
      totalInbound: parseInt(result.totalInbound) || 0,
      totalOutbound: parseInt(result.totalOutbound) || 0,
      totalDamage: parseInt(result.totalDamage) || 0,
    };
  }

  /**
   * 按SKU ID列表批量查询
   *
   * 用于DataLoader，避免N+1查询
   *
   * @param skuIds SKU ID数组
   * @returns 库存Map，key为skuId
   */
  async findBySkuIds(skuIds: string[]): Promise<Map<string, Inventory>> {
    if (skuIds.length === 0) {
      return new Map();
    }

    const inventories = await this.createQueryBuilder('inventory')
      .where('inventory.skuId IN (:...skuIds)', { skuIds })
      .getMany();

    const map = new Map<string, Inventory>();
    for (const inventory of inventories) {
      map.set(inventory.skuId, inventory);
    }

    return map;
  }

  /**
   * 按类别统计库存
   *
   * @returns { categoryId: 库存统计 }
   */
  async getInventoryByCategory(): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      skuCount: number;
      totalStock: number;
      totalReserved: number;
      lowStockCount: number;
    }>
  > {
    return this.createQueryBuilder('inventory')
      .leftJoinAndSelect(
        'inventory.sku',
        'sku',
        'sku.id = inventory.skuId',
      )
      .leftJoinAndSelect(
        'sku.product',
        'product',
        'product.id = sku.productId',
      )
      .leftJoinAndSelect(
        'product.category',
        'category',
        'category.id = product.categoryId',
      )
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('COUNT(inventory.id)', 'skuCount')
      .addSelect('SUM(inventory.currentStock)', 'totalStock')
      .addSelect('SUM(inventory.reservedStock)', 'totalReserved')
      .addSelect(
        `COUNT(CASE WHEN inventory.currentStock <= inventory.warningThreshold
                    AND inventory.currentStock > 0 THEN 1 END)`,
        'lowStockCount',
      )
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('totalStock', 'DESC')
      .getRawMany();
  }

  /**
   * 按品牌统计库存
   *
   * @returns { brandId: 库存统计 }
   */
  async getInventoryByBrand(): Promise<
    Array<{
      brandId: string;
      brandName: string;
      skuCount: number;
      totalStock: number;
      totalReserved: number;
    }>
  > {
    return this.createQueryBuilder('inventory')
      .leftJoinAndSelect(
        'inventory.sku',
        'sku',
        'sku.id = inventory.skuId',
      )
      .leftJoinAndSelect(
        'sku.product',
        'product',
        'product.id = sku.productId',
      )
      .select('product.brandId', 'brandId')
      .addSelect('product.brand', 'brandName')
      .addSelect('COUNT(inventory.id)', 'skuCount')
      .addSelect('SUM(inventory.currentStock)', 'totalStock')
      .addSelect('SUM(inventory.reservedStock)', 'totalReserved')
      .groupBy('product.brandId')
      .addGroupBy('product.brand')
      .orderBy('totalStock', 'DESC')
      .getRawMany();
  }

  /**
   * 查找库存异常记录
   *
   * 异常条件：
   * 1. 预留库存 > 实际库存
   * 2. 总出库 > 总入库
   * 3. 损耗数 > 总出库
   *
   * @returns 异常库存列表
   */
  async findAnomalousInventories(): Promise<Inventory[]> {
    return this.createQueryBuilder('inventory')
      .where('inventory.reservedStock > inventory.currentStock')
      .orWhere('inventory.outboundTotal > inventory.inboundTotal')
      .orWhere('inventory.damageCount > inventory.outboundTotal')
      .orderBy('inventory.updatedAt', 'DESC')
      .getMany();
  }

  /**
   * 更新库存检查时间
   *
   * @param skuIds SKU ID列表
   * @param checkTime 检查时间
   */
  async updateCheckTime(skuIds: string[], checkTime: Date = new Date()): Promise<void> {
    await this.createQueryBuilder()
      .update(Inventory)
      .set({ lastCheckTime: checkTime })
      .where('skuId IN (:...skuIds)', { skuIds })
      .execute();
  }

  /**
   * 批量更新警告阈值
   *
   * @param updates 更新配置数组
   */
  async batchUpdateWarningThreshold(
    updates: Array<{ skuId: string; threshold: number }>,
  ): Promise<void> {
    for (const update of updates) {
      await this.createQueryBuilder()
        .update(Inventory)
        .set({ warningThreshold: update.threshold })
        .where('skuId = :skuId', { skuId: update.skuId })
        .execute();
    }
  }
}
