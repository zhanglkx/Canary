/**
 * 购物车种子数据服务
 *
 * 为现有用户创建购物车和购物车项目，方便前端展示和测试
 *
 * @author Claude
 * @module Common/Seeders
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart, CartStatus } from '../../ecommerce/cart/entities/shopping-cart.entity';
import { CartItem } from '../../ecommerce/cart/entities/cart-item.entity';
import { User } from '../../user/user.entity';
import { ProductSku } from '../../ecommerce/product/entities/product-sku.entity';
import { Product } from '../../ecommerce/product/entities/product.entity';

@Injectable()
export class CartSeederService {
  private readonly logger = new Logger(CartSeederService.name);

  constructor(
    @InjectRepository(ShoppingCart)
    private cartRepository: Repository<ShoppingCart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProductSku)
    private skuRepository: Repository<ProductSku>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * 创建购物车种子数据
   *
   * @param count 要创建的购物车数量（默认10个）
   * @returns 创建的购物车数量
   */
  async seed(count: number = 10): Promise<number> {
    try {
      this.logger.log(`开始创建购物车种子数据（目标：${count}个）...`);

      // 1. 获取所有用户
      const users = await this.userRepository.find({ take: count });
      if (users.length === 0) {
        this.logger.warn('没有找到用户，请先创建用户数据');
        return 0;
      }
      this.logger.log(`找到 ${users.length} 个用户`);

      // 2. 获取所有产品和SKU
      const products = await this.productRepository.find({
        relations: ['skus'],
        take: 20, // 获取前20个产品
        where: {
          status: 'active', // 只获取上架的产品
        },
      });

      if (products.length === 0) {
        this.logger.warn('没有找到产品，请先运行产品种子数据填充');
        return 0;
      }

      // 收集所有可用的SKU（有库存的）
      const availableSkus: Array<{ sku: ProductSku; product: Product }> = [];
      for (const product of products) {
        if (product.skus && product.skus.length > 0) {
          for (const sku of product.skus) {
            // 只选择有库存的SKU
            if (sku.stock > 0) {
              availableSkus.push({ sku, product });
            }
          }
        }
      }

      if (availableSkus.length === 0) {
        this.logger.warn('没有找到可用的SKU（有库存的）');
        return 0;
      }

      this.logger.log(`找到 ${availableSkus.length} 个可用SKU`);

      // 3. 为每个用户创建购物车
      let createdCount = 0;
      for (let i = 0; i < Math.min(count, users.length); i++) {
        const user = users[i];

        // 检查用户是否已有购物车
        let savedCart = await this.cartRepository.findOne({
          where: {
            userId: user.id,
            status: CartStatus.ACTIVE,
          },
          relations: ['items'],
        });

        const isNewCart = !savedCart;
        if (savedCart) {
          this.logger.debug(`用户 ${user.email} 已有购物车，将添加商品到现有购物车`);
        } else {
          // 创建新购物车
          const cart = this.cartRepository.create({
            userId: user.id,
            status: CartStatus.ACTIVE,
            items: [],
          });
          savedCart = await this.cartRepository.save(cart);
        }

        // 为购物车添加商品，确保有10个商品
        const existingItemCount = savedCart.items?.length || 0;
        const targetItemCount = 10; // 目标：10个商品
        const itemsToAdd = Math.max(1, targetItemCount - existingItemCount);
        const itemCount = Math.min(itemsToAdd, availableSkus.length);
        
        // 过滤掉已存在的SKU
        const existingSkuIds = (savedCart.items || []).map(item => item.skuId);
        const availableSkusForCart = availableSkus.filter(
          ({ sku }) => !existingSkuIds.includes(sku.id)
        );
        
        const selectedItems = this.getRandomItems(availableSkusForCart, itemCount);

        for (const { sku, product } of selectedItems) {
          // 计算价格（单位：分）
          // SKU有价格就用SKU价格，否则用产品基础价格
          const unitPriceCents = sku.price ?? product.basePrice;

          // 创建购物车项目
          const cartItem = this.cartItemRepository.create({
            cartId: savedCart.id,
            skuId: sku.id,
            productId: product.id,
            productName: product.name,
            skuCode: sku.skuCode,
            unitPriceCents: unitPriceCents, // 已经是分了
            quantity: Math.floor(Math.random() * 3) + 1, // 1-3件
            stockStatus: sku.stock > 10 ? 'AVAILABLE' : sku.stock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
            attributeSnapshotData: sku.attributeValues || {},
            itemDiscountCents: 0,
          });

          await this.cartItemRepository.save(cartItem);
        }

        if (isNewCart) {
          createdCount++;
        }
        const totalItems = (savedCart.items?.length || 0) + selectedItems.length;
        this.logger.debug(`✓ 为用户 ${user.email} ${isNewCart ? '创建' : '更新'}购物车，添加了 ${selectedItems.length} 个商品，总计 ${totalItems} 个商品`);
      }

      this.logger.log(`✓ 购物车种子数据创建完成！共创建 ${createdCount} 个购物车`);
      return createdCount;
    } catch (error) {
      this.logger.error(`购物车种子数据创建失败: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }

  /**
   * 清空所有购物车数据
   */
  async clear(): Promise<void> {
    try {
      this.logger.log('清空所有购物车数据...');
      await this.cartItemRepository.delete({});
      await this.cartRepository.delete({});
      this.logger.log('✓ 购物车数据清空完成');
    } catch (error) {
      this.logger.error(`清空购物车数据失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 重新填充（先清空再创建）
   */
  async reseed(count: number = 10): Promise<number> {
    await this.clear();
    return this.seed(count);
  }

  /**
   * 从数组中随机选择指定数量的元素
   */
  private getRandomItems<T>(array: T[], count: number): T[] {
    if (array.length === 0) return [];
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}
