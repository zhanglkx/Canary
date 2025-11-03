/**
 * 库存服务
 *
 * 核心职责：
 * 1. 库存查询：检查可用库存、库存详情
 * 2. 库存操作：预留、确认、取消预留、扣减
 * 3. 并发控制：乐观锁重试 + 分布式锁
 * 4. 库存同步：与ProductSku保持同步
 *
 * 并发策略：
 * - 95% 正常场景：乐观锁 (ProductSku.version) + 自动重试
 * - 5% 高并发场景：分布式锁 (InventoryLock) + TTL防死锁
 *
 * 库存状态机：
 * ┌─────────────┐
 * │ currentStock│ (可用 = currentStock - reservedStock)
 * └──────┬──────┘
 *        │ reserve(qty)
 *        ↓
 * ┌────────────────┐
 * │ reservedStock  │ (用户下单但未支付)
 * └──────┬───────┬─┘
 *        │       │
 *        │       └─ cancelReserve(qty)
 *        │           ↓
 *        │       (返回available)
 *        │
 *        └─ confirmReserve(qty)
 *           ↓
 *        (正式扣减库存)
 *
 * @author Claude
 * @module Ecommerce/Inventory
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { InventoryLock } from '../entities/inventory-lock.entity';
import { ProductSku } from '../../product/entities/product-sku.entity';

/**
 * 库存操作类型
 */
export enum InventoryLockType {
  RESERVE = 'RESERVE',
  DEDUCT = 'DEDUCT',
  RESTOCK = 'RESTOCK',
  CHECK = 'CHECK',
}

/**
 * 库存操作结果
 */
export interface InventoryOperationResult {
  success: boolean;
  inventory: Inventory;
  message?: string;
  retriesUsed?: number;
}

/**
 * 库存统计
 */
export interface InventoryStats {
  skuId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockAlert: boolean;
  warningThreshold: number;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  /**
   * 乐观锁重试配置
   */
  private readonly OPTIMISTIC_LOCK_MAX_RETRIES = 3;
  private readonly OPTIMISTIC_LOCK_BACKOFF_MS = 100;

  /**
   * 分布式锁配置
   */
  private readonly DISTRIBUTED_LOCK_TTL_MS = 5 * 60 * 1000; // 5分钟
  private readonly DISTRIBUTED_LOCK_TIMEOUT_MS = 10 * 1000; // 10秒等待

  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryLock)
    private lockRepository: Repository<InventoryLock>,
    @InjectRepository(ProductSku)
    private skuRepository: Repository<ProductSku>,
    private dataSource: DataSource,
  ) {}

  /**
   * 获取库存信息
   *
   * @param skuId SKU ID
   * @returns 库存信息，找不到时抛异常
   */
  async getInventory(skuId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { skuId },
    });

    if (!inventory) {
      throw new NotFoundException(`找不到SKU ${skuId} 的库存信息`);
    }

    return inventory;
  }

  /**
   * 获取库存统计
   *
   * @param skuId SKU ID
   * @returns 库存统计数据
   */
  async getInventoryStats(skuId: string): Promise<InventoryStats> {
    const inventory = await this.getInventory(skuId);

    return {
      skuId: inventory.skuId,
      currentStock: inventory.currentStock,
      reservedStock: inventory.reservedStock,
      availableStock: inventory.availableStock,
      lowStockAlert: inventory.isLowStock,
      warningThreshold: inventory.warningThreshold,
    };
  }

  /**
   * 检查库存是否充足
   *
   * @param skuId SKU ID
   * @param quantity 需要的数量
   * @returns 是否充足
   */
  async hasEnoughStock(skuId: string, quantity: number): Promise<boolean> {
    const inventory = await this.getInventory(skuId);
    return inventory.hasEnoughStock(quantity);
  }

  /**
   * 预留库存
   *
   * 场景：用户下单时调用，标记库存为已预留
   * 效果：availableStock = currentStock - (reservedStock + quantity)
   *
   * @param skuId SKU ID
   * @param quantity 预留数量
   * @param orderId 订单ID（用于追踪）
   * @returns 操作结果
   */
  async reserveStock(
    skuId: string,
    quantity: number,
    orderId: string,
  ): Promise<InventoryOperationResult> {
    this.logger.debug(
      `预留库存: SKU=${skuId}, 数量=${quantity}, 订单=${orderId}`,
    );

    // 参数校验
    this.validateQuantity(quantity);

    // 首先尝试使用分布式锁（高并发场景）
    try {
      return await this.reserveStockWithDistributedLock(
        skuId,
        quantity,
        orderId,
      );
    } catch (error) {
      // 分布式锁超时或获取失败时，降级到乐观锁
      this.logger.warn(
        `分布式锁失败，降级到乐观锁: ${error.message}`,
      );
      return this.reserveStockWithOptimisticLock(skuId, quantity, orderId);
    }
  }

  /**
   * 使用乐观锁预留库存（95%场景）
   *
   * 实现：重试机制 + 版本号验证
   * 原理：乐观假设并发不高，冲突时自动重试
   *
   * @private
   */
  private async reserveStockWithOptimisticLock(
    skuId: string,
    quantity: number,
    orderId: string,
  ): Promise<InventoryOperationResult> {
    let lastError: Error | undefined;
    let retriesUsed = 0;

    for (let attempt = 0; attempt <= this.OPTIMISTIC_LOCK_MAX_RETRIES; attempt++) {
      try {
        retriesUsed = attempt;

        // 获取最新的库存记录
        const inventory = await this.inventoryRepository.findOne({
          where: { skuId },
        });

        if (!inventory) {
          throw new NotFoundException(`SKU ${skuId} 的库存记录不存在`);
        }

        // 校验库存充足性
        if (inventory.availableStock < quantity) {
          throw new BadRequestException(
            `库存不足。可用${inventory.availableStock}件，需要${quantity}件`,
          );
        }

        // 执行预留操作（会自动增加版本号）
        inventory.reserve(quantity);

        // 保存（如果版本冲突会抛出异常）
        const result = await this.inventoryRepository.save(inventory);

        // 同步更新ProductSku
        await this.syncSkuInventory(skuId, result);

        this.logger.log(
          `预留成功 [乐观锁]: SKU=${skuId}, 数量=${quantity}, 尝试次数=${attempt}`,
        );

        return {
          success: true,
          inventory: result,
          retriesUsed,
        };
      } catch (error) {
        lastError = error;

        // 版本冲突时重试
        if (
          error.code === 'ER_ROW_IS_REFERENCED_2' ||
          error.message?.includes('version')
        ) {
          const waitMs = this.OPTIMISTIC_LOCK_BACKOFF_MS * (attempt + 1);
          this.logger.debug(
            `版本冲突，等待${waitMs}ms后重试 [尝试${attempt + 1}/${
              this.OPTIMISTIC_LOCK_MAX_RETRIES + 1
            }]`,
          );
          await this.sleep(waitMs);
          continue;
        }

        // 其他错误直接抛出
        throw error;
      }
    }

    // 重试全部失败
    this.logger.error(
      `预留失败 [乐观锁]: SKU=${skuId}, 重试${retriesUsed}次后仍失败`,
    );
    throw new InternalServerErrorException(
      `库存预留失败，请重试。(${lastError?.message})`,
    );
  }

  /**
   * 使用分布式锁预留库存（5%高并发场景）
   *
   * 实现：数据库唯一约束 + TTL自动释放
   * 优点：避免死锁，自动失效机制
   * 缺点：不适合长期持有锁
   *
   * @private
   */
  private async reserveStockWithDistributedLock(
    skuId: string,
    quantity: number,
    orderId: string,
  ): Promise<InventoryOperationResult> {
    const lockType = InventoryLockType.RESERVE;
    const lockId = `${skuId}:${lockType}`;
    let lock: InventoryLock | null = null;

    try {
      // 1. 尝试获取分布式锁
      lock = await this.acquireLock(skuId, lockType, orderId);

      // 2. 在持有锁的时间内执行业务操作
      const inventory = await this.inventoryRepository.findOne({
        where: { skuId },
      });

      if (!inventory) {
        throw new NotFoundException(`SKU ${skuId} 的库存记录不存在`);
      }

      if (inventory.availableStock < quantity) {
        throw new BadRequestException(
          `库存不足。可用${inventory.availableStock}件，需要${quantity}件`,
        );
      }

      inventory.reserve(quantity);
      const result = await this.inventoryRepository.save(inventory);
      await this.syncSkuInventory(skuId, result);

      this.logger.log(
        `预留成功 [分布式锁]: SKU=${skuId}, 数量=${quantity}`,
      );

      return {
        success: true,
        inventory: result,
      };
    } catch (error) {
      // 分布式锁获取超时
      if (error.message?.includes('timeout')) {
        throw new InternalServerErrorException(
          '库存操作繁忙，请稍后重试',
        );
      }
      throw error;
    } finally {
      // 3. 释放分布式锁
      if (lock) {
        await this.releaseLock(lock.id).catch((err) =>
          this.logger.error(`释放锁失败: ${err.message}`),
        );
      }
    }
  }

  /**
   * 确认预留库存
   *
   * 场景：订单支付成功时调用，将预留库存正式扣减
   * 效果：
   *   - reservedStock 减少
   *   - currentStock 减少
   *   - outboundTotal 增加
   *
   * @param skuId SKU ID
   * @param quantity 确认数量
   * @param orderId 订单ID
   * @returns 操作结果
   */
  async confirmReserve(
    skuId: string,
    quantity: number,
    orderId: string,
  ): Promise<InventoryOperationResult> {
    this.logger.debug(
      `确认预留: SKU=${skuId}, 数量=${quantity}, 订单=${orderId}`,
    );

    this.validateQuantity(quantity);

    return this.executeWithOptimisticLock(skuId, quantity, orderId, (inventory) => {
      inventory.confirmReserve(quantity);
    });
  }

  /**
   * 取消预留库存
   *
   * 场景：订单取消或用户放弃购物时调用，释放已预留库存
   * 效果：reservedStock 减少
   *
   * @param skuId SKU ID
   * @param quantity 取消预留数量
   * @param orderId 订单ID
   * @returns 操作结果
   */
  async cancelReserve(
    skuId: string,
    quantity: number,
    orderId: string,
  ): Promise<InventoryOperationResult> {
    this.logger.debug(
      `取消预留: SKU=${skuId}, 数量=${quantity}, 订单=${orderId}`,
    );

    this.validateQuantity(quantity);

    return this.executeWithOptimisticLock(skuId, quantity, orderId, (inventory) => {
      inventory.cancelReserve(quantity);
    });
  }

  /**
   * 直接扣减库存
   *
   * 场景：
   * 1. 销售出库
   * 2. 库存损耗记录
   * 3. 库存调整
   *
   * @param skuId SKU ID
   * @param quantity 扣减数量
   * @param reason 原因备注
   * @returns 操作结果
   */
  async decreaseStock(
    skuId: string,
    quantity: number,
    reason: string = '直接扣减',
  ): Promise<InventoryOperationResult> {
    this.logger.debug(
      `直接扣减库存: SKU=${skuId}, 数量=${quantity}, 原因=${reason}`,
    );

    this.validateQuantity(quantity);

    return this.executeWithOptimisticLock(skuId, quantity, reason, (inventory) => {
      inventory.decreaseStock(quantity);
      inventory.remarks = reason;
    });
  }

  /**
   * 增加库存
   *
   * 场景：
   * 1. 补货入库
   * 2. 订单退货
   * 3. 库存调整
   *
   * @param skuId SKU ID
   * @param quantity 增加数量
   * @param reason 原因备注
   * @returns 操作结果
   */
  async increaseStock(
    skuId: string,
    quantity: number,
    reason: string = '补货入库',
  ): Promise<InventoryOperationResult> {
    this.logger.debug(
      `增加库存: SKU=${skuId}, 数量=${quantity}, 原因=${reason}`,
    );

    this.validateQuantity(quantity);

    return this.executeWithOptimisticLock(skuId, quantity, reason, (inventory) => {
      inventory.increaseStock(quantity);
      inventory.remarks = reason;
    });
  }

  /**
   * 使用乐观锁执行库存操作
   *
   * 通用模板方法，处理重试逻辑
   *
   * @private
   */
  private async executeWithOptimisticLock(
    skuId: string,
    quantity: number,
    context: string,
    operation: (inventory: Inventory) => void,
  ): Promise<InventoryOperationResult> {
    let lastError: Error | undefined;
    let retriesUsed = 0;

    for (let attempt = 0; attempt <= this.OPTIMISTIC_LOCK_MAX_RETRIES; attempt++) {
      try {
        retriesUsed = attempt;

        const inventory = await this.inventoryRepository.findOne({
          where: { skuId },
        });

        if (!inventory) {
          throw new NotFoundException(`SKU ${skuId} 的库存记录不存在`);
        }

        // 执行业务操作
        operation(inventory);

        // 保存
        const result = await this.inventoryRepository.save(inventory);

        // 同步SKU
        await this.syncSkuInventory(skuId, result);

        this.logger.log(
          `库存操作成功: SKU=${skuId}, 数量=${quantity}, 尝试次数=${attempt}`,
        );

        return {
          success: true,
          inventory: result,
          retriesUsed,
        };
      } catch (error) {
        lastError = error;

        // 版本冲突重试
        if (
          error.code === 'ER_ROW_IS_REFERENCED_2' ||
          error.message?.includes('version')
        ) {
          const waitMs = this.OPTIMISTIC_LOCK_BACKOFF_MS * (attempt + 1);
          this.logger.debug(
            `版本冲突，${waitMs}ms后重试 [${attempt + 1}/${
              this.OPTIMISTIC_LOCK_MAX_RETRIES + 1
            }]`,
          );
          await this.sleep(waitMs);
          continue;
        }

        // 其他错误直接抛出
        throw error;
      }
    }

    throw new InternalServerErrorException(
      `库存操作失败，重试${retriesUsed}次仍未成功: ${lastError?.message}`,
    );
  }

  /**
   * 初始化库存
   *
   * 产品创建时调用
   *
   * @param skuId SKU ID
   * @param initialStock 初始库存数量
   * @returns 创建的库存记录
   */
  async initializeInventory(
    skuId: string,
    initialStock: number = 0,
  ): Promise<Inventory> {
    const existing = await this.inventoryRepository.findOne({
      where: { skuId },
    });

    if (existing) {
      this.logger.warn(`SKU ${skuId} 的库存已存在，跳过初始化`);
      return existing;
    }

    const inventory = this.inventoryRepository.create({
      skuId,
      currentStock: initialStock,
      reservedStock: 0,
      warningThreshold: 10,
    });

    const result = await this.inventoryRepository.save(inventory);
    this.logger.log(
      `初始化库存: SKU=${skuId}, 初始数量=${initialStock}`,
    );

    return result;
  }

  /**
   * 批量获取库存统计
   *
   * 用于DataLoader避免N+1查询
   *
   * @param skuIds SKU ID列表
   * @returns 库存统计Map
   */
  async getInventoryStatsBySkus(skuIds: string[]): Promise<Map<string, InventoryStats>> {
    const inventories = await this.inventoryRepository.find({
      where: skuIds.map((id) => ({ skuId: id })),
    });

    const result = new Map<string, InventoryStats>();

    for (const inventory of inventories) {
      result.set(inventory.skuId, {
        skuId: inventory.skuId,
        currentStock: inventory.currentStock,
        reservedStock: inventory.reservedStock,
        availableStock: inventory.availableStock,
        lowStockAlert: inventory.isLowStock,
        warningThreshold: inventory.warningThreshold,
      });
    }

    return result;
  }

  /**
   * 获取低库存的SKU
   *
   * @returns 低库存SKU列表
   */
  async getLowStockSkus(): Promise<Inventory[]> {
    return this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.currentStock <= inventory.warningThreshold')
      .orderBy('inventory.currentStock', 'ASC')
      .getMany();
  }

  /**
   * ==================== 分布式锁操作 ====================
   */

  /**
   * 获取分布式锁
   *
   * 实现：尝试INSERT，成功表示获得锁
   * TTL：5分钟自动失效
   *
   * @private
   */
  private async acquireLock(
    skuId: string,
    lockType: InventoryLockType,
    operationId: string,
  ): Promise<InventoryLock> {
    const expiryTime = new Date(
      Date.now() + this.DISTRIBUTED_LOCK_TTL_MS,
    );

    try {
      // 尝试清理过期锁
      await this.lockRepository.delete({
        skuId,
        lockType,
        expiryTime: { $lt: new Date() } as any,
      });
    } catch (error) {
      // 清理失败不影响获锁
      this.logger.debug(`清理过期锁失败: ${error.message}`);
    }

    const startTime = Date.now();
    const timeout = startTime + this.DISTRIBUTED_LOCK_TIMEOUT_MS;

    while (Date.now() < timeout) {
      try {
        // 尝试创建新锁
        const lock = this.lockRepository.create({
          skuId,
          lockType,
          operationId,
          expiryTime,
          isActive: true,
        });

        const result = await this.lockRepository.save(lock);
        this.logger.debug(`获取分布式锁成功: ${skuId}:${lockType}`);
        return result;
      } catch (error) {
        // 唯一性约束冲突，说明已有其他请求持有锁
        if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
          // 检查现有锁是否过期
          const existingLock = await this.lockRepository.findOne({
            where: {
              skuId,
              lockType,
            },
          });

          if (existingLock && existingLock.isExpired()) {
            // 锁已过期，主动释放
            await this.lockRepository.remove(existingLock);
            continue;
          }

          // 等待后重试
          await this.sleep(50);
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      `获取分布式锁超时: ${skuId}:${lockType}`,
    );
  }

  /**
   * 释放分布式锁
   *
   * @private
   */
  private async releaseLock(lockId: string): Promise<void> {
    try {
      const lock = await this.lockRepository.findOne({
        where: { id: lockId },
      });

      if (lock) {
        lock.isActive = false;
        await this.lockRepository.save(lock);
        this.logger.debug(`释放分布式锁: ${lockId}`);
      }
    } catch (error) {
      this.logger.error(`释放锁失败: ${error.message}`);
    }
  }

  /**
   * ==================== 私有辅助方法 ====================
   */

  /**
   * 参数校验：数量必须为正整数
   *
   * @private
   */
  private validateQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('数量必须为正整数');
    }
  }

  /**
   * 同步库存到ProductSku
   *
   * 保证Inventory和ProductSku数据一致性
   *
   * @private
   */
  private async syncSkuInventory(
    skuId: string,
    inventory: Inventory,
  ): Promise<void> {
    try {
      await this.skuRepository.update(
        { id: skuId },
        {
          stock: inventory.currentStock,
          reservedStock: inventory.reservedStock,
        },
      );
    } catch (error) {
      this.logger.error(
        `同步库存到ProductSku失败: SKU=${skuId}, ${error.message}`,
      );
      // 不抛出异常，允许库存操作继续
    }
  }

  /**
   * 睡眠函数（用于重试延迟）
   *
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
