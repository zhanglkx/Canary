/**
 * 库存GraphQL解析器
 *
 * 提供库存查询和操作的GraphQL端点
 * 支持：
 * - 库存查询（单个/批量/统计）
 * - 库存操作（预留/确认/取消/直接扣减）
 * - 库存监控（低库存/缺货/异常）
 *
 * @author Claude
 * @module Ecommerce/Inventory
 */

import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Field,
  ObjectType,
  Float,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';
import { Inventory } from '../entities/inventory.entity';
import { InventoryService } from '../services/inventory.service';
import { InventoryRepository } from '../repositories/inventory.repository';

/**
 * 库存统计DTO
 */
@ObjectType()
export class InventoryStatsDto {
  @Field()
  skuId: string;

  @Field(() => Int)
  currentStock: number;

  @Field(() => Int)
  reservedStock: number;

  @Field(() => Int)
  availableStock: number;

  @Field()
  lowStockAlert: boolean;

  @Field(() => Int)
  warningThreshold: number;
}

/**
 * 库存操作结果DTO
 */
@ObjectType()
export class InventoryOperationResultDto {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  inventory?: Inventory;

  @Field(() => Int, { nullable: true })
  retriesUsed?: number;
}

/**
 * 库存全局统计DTO
 */
@ObjectType()
export class InventorySummaryDto {
  @Field(() => Int)
  totalSkus: number;

  @Field(() => Int)
  totalStock: number;

  @Field(() => Int)
  totalReserved: number;

  @Field(() => Int)
  totalAvailable: number;

  @Field(() => Int)
  lowStockCount: number;

  @Field(() => Int)
  outOfStockCount: number;

  @Field(() => Float)
  avgStockPerSku: number;

  @Field(() => Int)
  totalInbound: number;

  @Field(() => Int)
  totalOutbound: number;

  @Field(() => Int)
  totalDamage: number;
}

/**
 * 按分类统计的库存DTO
 */
@ObjectType()
export class InventoryByCategoryDto {
  @Field()
  categoryId: string;

  @Field()
  categoryName: string;

  @Field(() => Int)
  skuCount: number;

  @Field(() => Int)
  totalStock: number;

  @Field(() => Int)
  totalReserved: number;

  @Field(() => Int)
  lowStockCount: number;
}

/**
 * 库存解析器
 */
@Resolver(() => Inventory)
export class InventoryResolver {
  constructor(
    private inventoryService: InventoryService,
    private inventoryRepository: InventoryRepository,
  ) {}

  /**
   * ==================== 查询操作 ====================
   */

  /**
   * @Query inventoryDetail
   * 获取单个SKU的库存详情
   *
   * @example
   * ```graphql
   * query {
   *   inventoryDetail(skuId: "sku-123") {
   *     id
   *     skuId
   *     currentStock
   *     reservedStock
   *     availableStock
   *     warningThreshold
   *     isLowStock
   *   }
   * }
   * ```
   */
  @Query(() => Inventory)
  async inventoryDetail(
    @Args('skuId') skuId: string,
  ): Promise<Inventory> {
    return this.inventoryService.getInventory(skuId);
  }

  /**
   * @Query inventoryStats
   * 获取库存统计信息
   *
   * @example
   * ```graphql
   * query {
   *   inventoryStats(skuId: "sku-123") {
   *     skuId
   *     currentStock
   *     reservedStock
   *     availableStock
   *     lowStockAlert
   *   }
   * }
   * ```
   */
  @Query(() => InventoryStatsDto)
  async inventoryStats(
    @Args('skuId') skuId: string,
  ): Promise<InventoryStatsDto> {
    return this.inventoryService.getInventoryStats(skuId);
  }

  /**
   * @Query lowStockInventories
   * 查询低库存的SKU列表
   *
   * @example
   * ```graphql
   * query {
   *   lowStockInventories(limit: 10, offset: 0) {
   *     id
   *     skuId
   *     currentStock
   *     warningThreshold
   *   }
   * }
   * ```
   */
  @Query(() => [Inventory])
  async lowStockInventories(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Inventory[]> {
    return this.inventoryRepository.findLowStockInventories({
      limit,
      offset,
    });
  }

  /**
   * @Query outOfStockInventories
   * 查询缺货的SKU列表（库存为0）
   *
   * @example
   * ```graphql
   * query {
   *   outOfStockInventories {
   *     id
   *     skuId
   *     reservedStock
   *   }
   * }
   * ```
   */
  @Query(() => [Inventory])
  async outOfStockInventories(): Promise<Inventory[]> {
    return this.inventoryRepository.findOutOfStockInventories();
  }

  /**
   * @Query inventoriesWithReserve
   * 查询有预留库存的SKU（用于订单统计）
   *
   * @example
   * ```graphql
   * query {
   *   inventoriesWithReserve {
   *     id
   *     skuId
   *     currentStock
   *     reservedStock
   *   }
   * }
   * ```
   */
  @Query(() => [Inventory])
  async inventoriesWithReserve(): Promise<Inventory[]> {
    return this.inventoryRepository.findInventoriesWithReserve();
  }

  /**
   * @Query fastMovingInventories
   * 查询周转率高的SKU（热销品）
   *
   * @example
   * ```graphql
   * query {
   *   fastMovingInventories(limit: 20) {
   *     id
   *     skuId
   *     outboundTotal
   *   }
   * }
   * ```
   */
  @Query(() => [Inventory])
  async fastMovingInventories(
    @Args('limit', { type: () => Int, nullable: true }) limit: number = 10,
  ): Promise<Inventory[]> {
    return this.inventoryRepository.findFastMovingInventories(limit);
  }

  /**
   * @Query slowMovingInventories
   * 查询周转率低的SKU（滞销品）
   *
   * @example
   * ```graphql
   * query {
   *   slowMovingInventories(limit: 10) {
   *     id
   *     skuId
   *     outboundTotal
   *   }
   * }
   * ```
   */
  @Query(() => [Inventory])
  async slowMovingInventories(
    @Args('limit', { type: () => Int, nullable: true }) limit: number = 10,
  ): Promise<Inventory[]> {
    return this.inventoryRepository.findSlowMovingInventories(limit);
  }

  /**
   * @Query inventoriesNeedingCheck
   * 查询需要盘点的SKU
   *
   * 规则：30天未检查或预留数异常
   *
   * @example
   * ```graphql
   * query {
   *   inventoriesNeedingCheck {
   *     id
   *     skuId
   *     lastCheckTime
   *   }
   * }
   * ```
   */
  @Query(() => [Inventory])
  async inventoriesNeedingCheck(): Promise<Inventory[]> {
    return this.inventoryRepository.findInventoriesNeedingCheck();
  }

  /**
   * @Query anomalousInventories
   * 查询库存异常记录
   *
   * 异常条件：
   * - 预留 > 实际库存
   * - 总出库 > 总入库
   * - 损耗数 > 总出库
   *
   * @example
   * ```graphql
   * query {
   *   anomalousInventories {
   *     id
   *     skuId
   *     currentStock
   *     reservedStock
   *   }
   * }
   * ```
   */
  @Query(() => [Inventory])
  async anomalousInventories(): Promise<Inventory[]> {
    return this.inventoryRepository.findAnomalousInventories();
  }

  /**
   * @Query inventorySummary
   * 获取库存系统全局统计
   *
   * @example
   * ```graphql
   * query {
   *   inventorySummary {
   *     totalSkus
   *     totalStock
   *     totalReserved
   *     lowStockCount
   *   }
   * }
   * ```
   */
  @Query(() => InventorySummaryDto)
  async inventorySummary(): Promise<InventorySummaryDto> {
    return this.inventoryRepository.getInventoryStats();
  }

  /**
   * @Query inventoryByCategory
   * 按分类统计库存
   *
   * @example
   * ```graphql
   * query {
   *   inventoryByCategory {
   *     categoryId
   *     categoryName
   *     skuCount
   *     totalStock
   *   }
   * }
   * ```
   */
  @Query(() => [InventoryByCategoryDto])
  async inventoryByCategory(): Promise<InventoryByCategoryDto[]> {
    return this.inventoryRepository.getInventoryByCategory() as Promise<
      InventoryByCategoryDto[]
    >;
  }

  /**
   * ==================== 操作（变更）====================
   */

  /**
   * @Mutation reserveStock
   * 预留库存
   *
   * 场景：用户下单时调用
   * 效果：预留库存，减少可用库存
   *
   * @example
   * ```graphql
   * mutation {
   *   reserveStock(
   *     skuId: "sku-123"
   *     quantity: 2
   *     orderId: "order-456"
   *   ) {
   *     success
   *     message
   *     inventory {
   *       currentStock
   *       reservedStock
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => InventoryOperationResultDto)
  async reserveStock(
    @Args('skuId') skuId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @Args('orderId') orderId: string,
  ): Promise<InventoryOperationResultDto> {
    try {
      const result = await this.inventoryService.reserveStock(
        skuId,
        quantity,
        orderId,
      );

      return {
        success: result.success,
        message: `成功预留${quantity}件库存`,
        inventory: result.inventory,
        retriesUsed: result.retriesUsed,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * @Mutation confirmReserve
   * 确认预留库存
   *
   * 场景：订单支付成功时调用
   * 效果：将预留库存正式扣减
   *
   * @example
   * ```graphql
   * mutation {
   *   confirmReserve(
   *     skuId: "sku-123"
   *     quantity: 2
   *     orderId: "order-456"
   *   ) {
   *     success
   *     message
   *     inventory {
   *       currentStock
   *       reservedStock
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => InventoryOperationResultDto)
  async confirmReserve(
    @Args('skuId') skuId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @Args('orderId') orderId: string,
  ): Promise<InventoryOperationResultDto> {
    try {
      const result = await this.inventoryService.confirmReserve(
        skuId,
        quantity,
        orderId,
      );

      return {
        success: result.success,
        message: `成功确认预留${quantity}件库存`,
        inventory: result.inventory,
        retriesUsed: result.retriesUsed,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * @Mutation cancelReserve
   * 取消预留库存
   *
   * 场景：订单取消时调用
   * 效果：释放已预留的库存
   *
   * @example
   * ```graphql
   * mutation {
   *   cancelReserve(
   *     skuId: "sku-123"
   *     quantity: 2
   *     orderId: "order-456"
   *   ) {
   *     success
   *     message
   *   }
   * }
   * ```
   */
  @Mutation(() => InventoryOperationResultDto)
  async cancelReserve(
    @Args('skuId') skuId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @Args('orderId') orderId: string,
  ): Promise<InventoryOperationResultDto> {
    try {
      const result = await this.inventoryService.cancelReserve(
        skuId,
        quantity,
        orderId,
      );

      return {
        success: result.success,
        message: `成功取消预留${quantity}件库存`,
        inventory: result.inventory,
        retriesUsed: result.retriesUsed,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * @Mutation decreaseStock
   * 直接扣减库存
   *
   * 场景：
   * - 销售出库（已通过订单）
   * - 损耗记录
   * - 库存调整
   *
   * 权限：仅管理员
   *
   * @example
   * ```graphql
   * mutation {
   *   decreaseStock(
   *     skuId: "sku-123"
   *     quantity: 5
   *     reason: "销售出库"
   *   ) {
   *     success
   *     message
   *   }
   * }
   * ```
   */
  @Mutation(() => InventoryOperationResultDto)
  @UseGuards(GqlAuthGuard)
  async decreaseStock(
    @Args('skuId') skuId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @Args('reason', { nullable: true }) reason?: string,
    @CurrentUser() user?: User,
  ): Promise<InventoryOperationResultDto> {
    try {
      const result = await this.inventoryService.decreaseStock(
        skuId,
        quantity,
        reason,
      );

      return {
        success: result.success,
        message: `成功扣减${quantity}件库存`,
        inventory: result.inventory,
        retriesUsed: result.retriesUsed,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * @Mutation increaseStock
   * 增加库存
   *
   * 场景：
   * - 补货入库
   * - 退货归库
   * - 库存调整
   *
   * 权限：仅管理员
   *
   * @example
   * ```graphql
   * mutation {
   *   increaseStock(
   *     skuId: "sku-123"
   *     quantity: 100
   *     reason: "补货入库"
   *   ) {
   *     success
   *     message
   *     inventory {
   *       currentStock
   *       inboundTotal
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => InventoryOperationResultDto)
  @UseGuards(GqlAuthGuard)
  async increaseStock(
    @Args('skuId') skuId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @Args('reason', { nullable: true }) reason?: string,
    @CurrentUser() user?: User,
  ): Promise<InventoryOperationResultDto> {
    try {
      const result = await this.inventoryService.increaseStock(
        skuId,
        quantity,
        reason,
      );

      return {
        success: result.success,
        message: `成功增加${quantity}件库存`,
        inventory: result.inventory,
        retriesUsed: result.retriesUsed,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
