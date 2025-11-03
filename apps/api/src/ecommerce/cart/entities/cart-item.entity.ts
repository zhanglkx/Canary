/**
 * 购物车项目实体
 *
 * 代表购物车中的一个商品条目
 * 包含SKU、数量、单价、总价等信息
 *
 * @author Claude
 * @module Ecommerce/ShoppingCart
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';
import { ShoppingCart } from './shopping-cart.entity';
import { ProductSku } from '../../product/entities/product-sku.entity';
import { Product } from '../../product/entities/product.entity';

/**
 * 购物车项目实体
 *
 * 存储购物车中每个商品的详细信息
 * 冗余存储SKU名称、价格等，避免后续数据更改影响历史购物车
 */
@Entity('cart_items')
@ObjectType()
@Index('IDX_cart_item_cart', ['cartId'])
@Index('IDX_cart_item_sku', ['skuId'])
export class CartItem {
  /**
   * 项目ID
   */
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  /**
   * 所属购物车ID
   */
  @Column({ type: 'uuid' })
  @HideField()
  cartId: string;

  /**
   * 所属购物车
   */
  @ManyToOne(() => ShoppingCart, (cart) => cart.items, {
    onDelete: 'CASCADE',
    lazy: false,
  })
  @HideField()
  cart: ShoppingCart;

  /**
   * SKU ID
   */
  @Column({ type: 'uuid' })
  @Field()
  skuId: string;

  /**
   * 关联的产品SKU
   *
   * 注：可能为null，如果SKU已被删除
   * 此时应使用冗余存储的信息
   */
  @ManyToOne(() => ProductSku, { onDelete: 'SET NULL', lazy: false, nullable: true })
  @HideField()
  sku?: ProductSku;

  /**
   * 产品ID（冗余存储）
   *
   * 用于快速查询商品信息
   */
  @Column({ type: 'uuid' })
  @Field()
  productId: string;

  /**
   * 关联的产品
   */
  @ManyToOne(() => Product, { onDelete: 'SET NULL', lazy: false, nullable: true })
  @HideField()
  product?: Product;

  /**
   * 产品名称（冗余存储）
   *
   * SKU对应的产品名称快照
   * 防止商品被删除时失去名称信息
   */
  @Column({ type: 'varchar', length: 200 })
  @Field()
  productName: string;

  /**
   * SKU代码（冗余存储）
   *
   * 例如：RED-M, BLUE-L
   */
  @Column({ type: 'varchar', length: 50 })
  @Field()
  skuCode: string;

  /**
   * 单价（购物车添加时的价格快照）
   *
   * 冗余存储价格，防止后续价格调整影响已有的购物车
   * 单位：人民币分（显示时需除以100）
   */
  @Column({ type: 'int' })
  @Field(() => Float)
  get unitPrice(): number {
    return this.unitPriceCents / 100;
  }

  @Column({ type: 'int', select: false })
  @HideField()
  unitPriceCents: number;

  /**
   * 商品数量
   */
  @Column({ type: 'int', default: 1 })
  @Field(() => Int)
  quantity: number;

  /**
   * 项目总价（单价 × 数量）
   */
  @Field(() => Float)
  get itemTotal(): number {
    return this.unitPrice * this.quantity;
  }

  /**
   * 库存状态标记
   *
   * 在添加到购物车时记录库存情况
   * - AVAILABLE: 库存充足
   * - LOW_STOCK: 库存不足
   * - OUT_OF_STOCK: 缺货
   */
  @Column({
    type: 'enum',
    enum: ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'],
    default: 'AVAILABLE',
  })
  @Field()
  stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

  /**
   * 属性快照（JSON）
   *
   * 存储SKU的选中属性，例如：
   * {
   *   "color": "红色",
   *   "size": "M",
   *   "material": "棉"
   * }
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  get attributeSnapshot(): string | undefined {
    return this.attributeSnapshotData ? JSON.stringify(this.attributeSnapshotData) : undefined;
  }

  @Column({ type: 'jsonb', nullable: true, select: false })
  @HideField()
  attributeSnapshotData?: Record<string, string>;

  /**
   * 优惠券/促销代码（项目级）
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  @Field({ nullable: true })
  promoCode?: string;

  /**
   * 项目级折扣（元，可能为0）
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Float)
  get itemDiscount(): number {
    return this.itemDiscountCents / 100;
  }

  @Column({ type: 'int', default: 0, select: false })
  @HideField()
  itemDiscountCents: number;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  @Field()
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  /**
   * ==================== 业务方法 ====================
   */

  /**
   * 获取项目总价（包含折扣）
   */
  getTotalPrice(): number {
    return this.itemTotal - this.itemDiscount;
  }

  /**
   * 检查库存是否可用
   */
  isAvailable(): boolean {
    return this.stockStatus === 'AVAILABLE';
  }

  /**
   * 检查是否为低库存
   */
  isLowStock(): boolean {
    return this.stockStatus === 'LOW_STOCK';
  }

  /**
   * 检查是否缺货
   */
  isOutOfStock(): boolean {
    return this.stockStatus === 'OUT_OF_STOCK';
  }

  /**
   * 应用折扣
   *
   * @param discountAmount 折扣金额（元）
   */
  applyDiscount(discountAmount: number): void {
    if (discountAmount < 0) {
      throw new Error('折扣金额不能为负');
    }
    if (discountAmount > this.itemTotal) {
      throw new Error('折扣不能超过商品总价');
    }
    this.itemDiscountCents = Math.round(discountAmount * 100);
  }

  /**
   * 清除折扣
   */
  clearDiscount(): void {
    this.itemDiscountCents = 0;
    this.promoCode = undefined;
  }
}
