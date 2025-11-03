/**
 * 订单项目实体
 *
 * 代表订单中的一个商品条目
 * 存储从购物车项目快照过来的信息
 *
 * @author Claude
 * @module Ecommerce/Order
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
import { Order } from './order.entity';
import { ProductSku } from '../../product/entities/product-sku.entity';
import { Product } from '../../product/entities/product.entity';

/**
 * 订单项目实体
 *
 * 从CartItem转化而来，保留快照信息
 */
@Entity('order_items')
@ObjectType()
@Index('IDX_order_item_order', ['orderId'])
@Index('IDX_order_item_sku', ['skuId'])
export class OrderItem {
  /**
   * 项目ID
   */
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  /**
   * 所属订单ID
   */
  @Column({ type: 'uuid' })
  @HideField()
  orderId: string;

  /**
   * 所属订单
   */
  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
    lazy: false,
  })
  @HideField()
  order: Order;

  /**
   * SKU ID
   */
  @Column({ type: 'uuid' })
  @Field()
  skuId: string;

  /**
   * 关联的产品SKU
   * 可能为null，如果SKU已被删除
   */
  @ManyToOne(() => ProductSku, { onDelete: 'SET NULL', lazy: false, nullable: true })
  @HideField()
  sku?: ProductSku;

  /**
   * 产品ID（快照）
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
   * 产品名称（快照）
   */
  @Column({ type: 'varchar', length: 200 })
  @Field()
  productName: string;

  /**
   * SKU代码（快照）
   */
  @Column({ type: 'varchar', length: 50 })
  @Field()
  skuCode: string;

  /**
   * 单价（人民币分，快照）
   * 显示时需除以100
   */
  @Column({ type: 'int' })
  @HideField()
  unitPriceCents: number;

  /**
   * 单价（元）
   */
  @Field(() => Float)
  get unitPrice(): number {
    return this.unitPriceCents / 100;
  }

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
   * 项目级折扣（人民币分）
   */
  @Column({ type: 'int', default: 0 })
  @HideField()
  itemDiscountCents: number;

  /**
   * 项目级折扣（元）
   */
  @Field(() => Float)
  get itemDiscount(): number {
    return this.itemDiscountCents / 100;
  }

  /**
   * 获取项目最终价格（包含折扣）
   */
  @Field(() => Float)
  get finalPrice(): number {
    return this.itemTotal - this.itemDiscount;
  }

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
  }
}
