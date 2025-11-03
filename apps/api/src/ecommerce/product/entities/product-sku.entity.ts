/**
 * 产品SKU实体
 *
 * SKU = Stock Keeping Unit（库存保持单位）
 * 代表产品的具体变体（如：红色M码 vs 蓝色L码）
 * 这是库存管理的最小单位
 *
 * 示例：
 * 产品"T恤"有3个SKU：
 * - SKU001: 红色M码 - 价格¥99 - 库存100
 * - SKU002: 红色L码 - 价格¥99 - 库存50
 * - SKU003: 蓝色M码 - 价格¥99 - 库存75
 *
 * @author Claude
 * @module Ecommerce/Product
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  VersionColumn,
} from 'typeorm';
import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';
import { Product } from './product.entity';

/**
 * 产品SKU实体
 *
 * 关键设计特性：
 * - VersionColumn: 用于乐观锁，实现库存并发控制
 * - 属性值JSON存储：灵活存储属性组合
 * - 库存字段：核心业务数据，需要精确管理
 */
@Entity('product_skus')
@ObjectType()
@Index('IDX_sku_product_code', ['productId', 'skuCode'])
@Index('IDX_sku_code', ['skuCode'])
@Index('IDX_sku_stock', ['stock'])
export class ProductSku {
  /**
   * SKU ID
   */
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  /**
   * 所属产品ID
   */
  @Column({ type: 'uuid' })
  @HideField()
  productId: string;

  /**
   * 所属产品
   */
  @ManyToOne(() => Product, (product) => product.skus, {
    onDelete: 'CASCADE',
    lazy: false,
  })
  @HideField()
  product: Product;

  /**
   * SKU编码（如：SKU-001, SPU-001-RED-M）
   * 唯一标识一个具体的产品变体
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  @Field()
  skuCode: string;

  /**
   * SKU名称（由属性值拼接而成）
   * 例如："T恤-红色-M码"
   */
  @Column({ type: 'varchar', length: 200 })
  @Field()
  skuName: string;

  /**
   * 属性值JSON
   * 存储该SKU的属性组合
   * 例如：{"颜色": "红色", "尺寸": "M", "材质": "纯棉"}
   *
   * @HideField 不在GraphQL中暴露（供内部使用）
   */
  @Column({ type: 'jsonb', default: {} })
  @HideField()
  attributeValues: Record<string, string>;

  /**
   * SKU价格（人民币，单位：分）
   * 如果为空，使用产品基础价格
   */
  @Column({ type: 'int', nullable: true })
  @Field(() => Float, { nullable: true })
  price?: number;

  /**
   * 库存数量
   * 这是最关键的字段，需要在并发场景下精确管理
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  stock: number;

  /**
   * 已预留库存（当用户下单但未支付时）
   * 库存中的一部分被预留
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  reservedStock: number;

  /**
   * 实际可用库存 = stock - reservedStock
   * 这是一个计算字段，不存储到数据库
   */
  @Field(() => Int)
  get availableStock(): number {
    return this.stock - this.reservedStock;
  }

  /**
   * 乐观锁版本号
   * 用于并发控制：当多个请求同时修改库存时，只有版本号匹配的请求才能成功
   * TypeORM自动管理此字段
   */
  @VersionColumn()
  @HideField()
  version: number;

  /**
   * SKU图片URL（如果这个SKU有特定的图片，可以覆盖产品主图）
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  @Field({ nullable: true })
  imageUrl?: string;

  /**
   * 重量（克）
   */
  @Column({ type: 'int', nullable: true })
  @Field(() => Int, { nullable: true })
  weight?: number;

  /**
   * 销售数量（用于热度排序）
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  salesCount: number;

  /**
   * 是否启用
   */
  @Column({ type: 'boolean', default: true })
  @Field()
  isActive: boolean;

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
   * 业务方法：检查库存是否充足
   *
   * @param quantity 需要的数量
   * @returns true 如果库存充足
   */
  hasEnoughStock(quantity: number): boolean {
    return this.availableStock >= quantity;
  }

  /**
   * 业务方法：预留库存
   * 当用户下单时调用，标记库存为已预留
   *
   * @param quantity 预留数量
   * @throws Error 如果库存不足
   */
  reserveStock(quantity: number): void {
    if (this.availableStock < quantity) {
      throw new Error(`库存不足。需要${quantity}件，只有${this.availableStock}件可用`);
    }
    this.reservedStock += quantity;
  }

  /**
   * 业务方法：取消预留（当订单取消时调用）
   *
   * @param quantity 取消预留数量
   */
  cancelReservation(quantity: number): void {
    this.reservedStock = Math.max(0, this.reservedStock - quantity);
  }

  /**
   * 业务方法：确认库存扣减（当订单支付时调用）
   * 将已预留的库存转为已出库
   *
   * @param quantity 确认扣减数量
   */
  confirmStockDeduction(quantity: number): void {
    this.reservedStock = Math.max(0, this.reservedStock - quantity);
    this.stock -= quantity;
  }
}
