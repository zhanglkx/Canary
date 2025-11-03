/**
 * 购物车服务
 *
 * 核心职责：
 * 1. 购物车查询：获取用户购物车
 * 2. 购物车操作：添加/移除/更新商品
 * 3. 库存检查：验证商品可用性
 * 4. 价格计算：计算小计、税费、总价
 * 5. 购物车清理：标记已废弃的购物车
 *
 * @author Claude
 * @module Ecommerce/ShoppingCart
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart, CartStatus } from '../entities/shopping-cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductSku } from '../../product/entities/product-sku.entity';
import { Product } from '../../product/entities/product.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { ProductService } from '../../product/services/product.service';

/**
 * 添加到购物车的输入
 */
export interface AddToCartInput {
  skuId: string;
  quantity: number;
  productId?: string;
}

/**
 * 购物车统计信息
 */
export interface CartStats {
  totalItems: number;
  totalSKUs: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  isEmpty: boolean;
  isAbandoned: boolean;
}

@Injectable()
export class ShoppingCartService {
  private readonly logger = new Logger(ShoppingCartService.name);

  constructor(
    @InjectRepository(ShoppingCart)
    private cartRepository: Repository<ShoppingCart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductSku)
    private skuRepository: Repository<ProductSku>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private inventoryService: InventoryService,
    private productService: ProductService,
  ) {}

  /**
   * 获取或创建用户的购物车
   *
   * @param userId 用户ID
   * @returns 购物车，如果不存在则创建新购物车
   */
  async getOrCreateCart(userId: string): Promise<ShoppingCart> {
    let cart = await this.cartRepository.findOne({
      where: {
        userId,
        status: CartStatus.ACTIVE,
      },
      relations: ['items', 'items.sku', 'items.product'],
    });

    // 如果不存在活跃购物车，则创建新的
    if (!cart) {
      this.logger.debug(`为用户 ${userId} 创建新购物车`);

      cart = this.cartRepository.create({
        userId,
        items: [],
        status: CartStatus.ACTIVE,
      });

      await this.cartRepository.save(cart);
    }

    return cart;
  }

  /**
   * 获取购物车
   *
   * @param cartId 购物车ID
   * @returns 购物车信息
   */
  async getCart(cartId: string): Promise<ShoppingCart> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.sku', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`购物车 ${cartId} 不存在`);
    }

    return cart;
  }

  /**
   * 获取用户的购物车
   *
   * @param userId 用户ID
   * @returns 购物车信息
   */
  async getUserCart(userId: string): Promise<ShoppingCart> {
    return this.getOrCreateCart(userId);
  }

  /**
   * 添加商品到购物车
   *
   * @param userId 用户ID
   * @param input 添加商品输入
   * @returns 更新后的购物车
   */
  async addToCart(userId: string, input: AddToCartInput): Promise<ShoppingCart> {
    this.logger.debug(
      `添加商品到购物车: 用户=${userId}, SKU=${input.skuId}, 数量=${input.quantity}`,
    );

    // 参数校验
    if (input.quantity <= 0) {
      throw new BadRequestException('数量必须大于0');
    }

    // 获取或创建购物车
    const cart = await this.getOrCreateCart(userId);

    // 检查库存可用性
    const hasStock = await this.inventoryService.hasEnoughStock(
      input.skuId,
      input.quantity,
    );

    if (!hasStock) {
      throw new BadRequestException(
        `商品库存不足，无法添加 ${input.quantity} 件`,
      );
    }

    // 获取SKU信息
    const sku = await this.skuRepository.findOne({
      where: { id: input.skuId },
      relations: ['product'],
    });

    if (!sku) {
      throw new NotFoundException(`SKU ${input.skuId} 不存在`);
    }

    // 获取产品信息
    const product = await this.productRepository.findOne({
      where: { id: sku.productId },
    });

    if (!product) {
      throw new NotFoundException(`产品不存在`);
    }

    // 获取库存统计
    const inventoryStats = await this.inventoryService.getInventoryStats(
      input.skuId,
    );

    // 创建购物车项目
    const cartItem = this.cartItemRepository.create({
      cartId: cart.id,
      skuId: input.skuId,
      productId: product.id,
      productName: product.name,
      skuCode: sku.skuCode,
      unitPriceCents: Math.round(sku.price * 100),
      quantity: input.quantity,
      stockStatus: this.getStockStatus(inventoryStats),
      attributeSnapshot: sku.attributeValues as any,
    });

    // 检查购物车中是否已有相同SKU
    const existingItem = cart.items?.find((i) => i.skuId === input.skuId);

    if (existingItem) {
      // 更新现有项目的数量
      existingItem.quantity += input.quantity;
      await this.cartItemRepository.save(existingItem);
      this.logger.log(
        `更新购物车项目: SKU=${input.skuId}, 新数量=${existingItem.quantity}`,
      );
    } else {
      // 创建新项目
      await this.cartItemRepository.save(cartItem);
      if (!cart.items) {
        cart.items = [];
      }
      cart.items.push(cartItem);
      this.logger.log(`添加新商品到购物车: SKU=${input.skuId}`);
    }

    // 更新购物车更新时间
    await this.cartRepository.save(cart);

    return this.getCart(cart.id);
  }

  /**
   * 从购物车移除商品
   *
   * @param userId 用户ID
   * @param skuId SKU ID
   * @returns 更新后的购物车
   */
  async removeFromCart(userId: string, skuId: string): Promise<ShoppingCart> {
    this.logger.debug(`从购物车移除商品: 用户=${userId}, SKU=${skuId}`);

    const cart = await this.getUserCart(userId);

    const item = cart.items?.find((i) => i.skuId === skuId);
    if (!item) {
      throw new NotFoundException(`购物车中不存在SKU ${skuId}`);
    }

    await this.cartItemRepository.remove(item);
    this.logger.log(`从购物车移除商品: SKU=${skuId}`);

    return this.getCart(cart.id);
  }

  /**
   * 更新购物车项目数量
   *
   * @param userId 用户ID
   * @param skuId SKU ID
   * @param quantity 新的数量
   * @returns 更新后的购物车
   */
  async updateItemQuantity(
    userId: string,
    skuId: string,
    quantity: number,
  ): Promise<ShoppingCart> {
    this.logger.debug(
      `更新购物车项目数量: 用户=${userId}, SKU=${skuId}, 新数量=${quantity}`,
    );

    // 参数校验
    if (quantity <= 0) {
      throw new BadRequestException('数量必须大于0');
    }

    const cart = await this.getUserCart(userId);

    const item = cart.items?.find((i) => i.skuId === skuId);
    if (!item) {
      throw new NotFoundException(`购物车中不存在SKU ${skuId}`);
    }

    // 检查库存
    const hasStock = await this.inventoryService.hasEnoughStock(skuId, quantity);
    if (!hasStock) {
      throw new BadRequestException(
        `商品库存不足，无法更新为 ${quantity} 件`,
      );
    }

    item.quantity = quantity;
    await this.cartItemRepository.save(item);
    this.logger.log(`更新商品数量: SKU=${skuId}, 数量=${quantity}`);

    return this.getCart(cart.id);
  }

  /**
   * 清空购物车
   *
   * @param userId 用户ID
   * @returns 清空后的购物车
   */
  async clearCart(userId: string): Promise<ShoppingCart> {
    this.logger.debug(`清空购物车: 用户=${userId}`);

    const cart = await this.getUserCart(userId);

    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    cart.items = [];
    await this.cartRepository.save(cart);
    this.logger.log(`购物车已清空: 用户=${userId}`);

    return cart;
  }

  /**
   * 获取购物车统计信息
   *
   * @param cartId 购物车ID
   * @returns 统计信息
   */
  async getCartStats(cartId: string): Promise<CartStats> {
    const cart = await this.getCart(cartId);

    return {
      totalItems: cart.totalItems,
      totalSKUs: cart.totalSKUs,
      subtotal: cart.subtotal,
      taxAmount: cart.taxAmount,
      total: cart.total,
      isEmpty: cart.isEmpty,
      isAbandoned: cart.isAbandoned,
    };
  }

  /**
   * 验证购物车中所有商品的库存
   *
   * @param cartId 购物车ID
   * @returns 验证结果，包含缺货或库存不足的商品
   */
  async validateCartInventory(
    cartId: string,
  ): Promise<{ valid: boolean; unavailableItems: string[] }> {
    const cart = await this.getCart(cartId);
    const unavailableItems: string[] = [];

    for (const item of cart.items || []) {
      const hasStock = await this.inventoryService.hasEnoughStock(
        item.skuId,
        item.quantity,
      );

      if (!hasStock) {
        unavailableItems.push(item.skuId);
      }
    }

    return {
      valid: unavailableItems.length === 0,
      unavailableItems,
    };
  }

  /**
   * 更新购物车中所有商品的库存状态
   *
   * 定期调用此方法以更新库存状态
   *
   * @param cartId 购物车ID
   * @returns 更新后的购物车
   */
  async refreshInventoryStatus(cartId: string): Promise<ShoppingCart> {
    const cart = await this.getCart(cartId);

    for (const item of cart.items || []) {
      const inventoryStats = await this.inventoryService.getInventoryStats(
        item.skuId,
      );
      item.stockStatus = this.getStockStatus(inventoryStats);
    }

    await this.cartItemRepository.save(cart.items || []);
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * 标记已废弃的购物车
   *
   * 从系统中找出所有24小时未更新的购物车，标记为已废弃
   *
   * @returns 被标记的购物车数量
   */
  async markAbandonedCarts(): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.cartRepository
      .createQueryBuilder()
      .update(ShoppingCart)
      .set({ status: CartStatus.ABANDONED })
      .where('status = :status', { status: CartStatus.ACTIVE })
      .andWhere('updatedAt < :cutoffTime', { cutoffTime: twentyFourHoursAgo })
      .execute();

    const count = result.affected || 0;
    this.logger.log(`标记了 ${count} 个已废弃的购物车`);

    return count;
  }

  /**
   * 统计活跃购物车数量
   *
   * @returns 活跃购物车数量
   */
  async getActiveCartCount(): Promise<number> {
    return this.cartRepository.count({
      where: { status: CartStatus.ACTIVE },
    });
  }

  /**
   * 获取已废弃购物车统计
   *
   * @returns 已废弃购物车数量和总金额
   */
  async getAbandonedCartStats(): Promise<{
    count: number;
    totalValue: number;
  }> {
    const abandonedCarts = await this.cartRepository.find({
      where: { status: CartStatus.ABANDONED },
      relations: ['items'],
    });

    let totalValue = 0;
    for (const cart of abandonedCarts) {
      totalValue += cart.total;
    }

    return {
      count: abandonedCarts.length,
      totalValue,
    };
  }

  /**
   * ==================== 私有辅助方法 ====================
   */

  /**
   * 根据库存统计获取库存状态
   *
   * @private
   */
  private getStockStatus(inventoryStats: any): 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
    if (inventoryStats.availableStock <= 0) {
      return 'OUT_OF_STOCK';
    }
    if (inventoryStats.lowStockAlert) {
      return 'LOW_STOCK';
    }
    return 'AVAILABLE';
  }
}
