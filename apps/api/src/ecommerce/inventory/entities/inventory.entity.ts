/**
 * 库存实体
 *
 * 存储产品SKU的库存信息
 * 这是对ProductSku库存字段的补充记录
 * 用于更细粒度的库存追踪和历史记录
 *
 * 库存生命周期：
 * 1. 初始化：产品创建时同时创建库存记录
 * 2. 预留：用户下单时预留库存（reservedStock增加）
 * 3. 扣减：订单支付时正式扣减库存（stock减少，reservedStock减少）
 * 4. 归还：订单取消时归还库存（reservedStock减少）
 *
 * 并发控制：
 * - 使用@VersionColumn实现乐观锁
 * - 修改时会检查版本号，版本不一致则更新失败需要重试
 *
 * @author Claude
 * @module Ecommerce/Inventory
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
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';
import { ProductSku } from '../../product/entities/product-sku.entity';

/**
 * 库存实体
 *
 * 与ProductSku的关系：
 * - ProductSku是产品的库存单位
 * - Inventory是对ProductSku库存的详细记录和审计
 * - 一个ProductSku对应一个Inventory记录
 */
@Entity('inventories')
@ObjectType()
@Index('IDX_inventory_sku', ['skuId'])
@Index('IDX_inventory_stock_level', ['currentStock'])
export class Inventory {
  /**
   * 库存ID
   */
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  /**
   * SKU ID
   */
  @Column({ type: 'uuid' })
  @HideField()
  skuId: string;

  /**
   * 关联的产品SKU
   */
  @ManyToOne(() => ProductSku, { onDelete: 'CASCADE', lazy: false })
  @HideField()
  sku: ProductSku;

  /**
   * 当前库存数量
   *
   * 与ProductSku.stock一致
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  currentStock: number;

  /**
   * 已预留库存数量
   *
   * 与ProductSku.reservedStock一致
   * 用户下单但未支付时的库存
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  reservedStock: number;

  /**
   * 可用库存数量（计算字段）
   *
   * availableStock = currentStock - reservedStock
   */
  @Field(() => Int)
  get availableStock(): number {
    return this.currentStock - this.reservedStock;
  }

  /**
   * 入库总数
   *
   * 用于库存统计和审计
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  inboundTotal: number;

  /**
   * 出库总数
   *
   * 用于库存统计和审计
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  outboundTotal: number;

  /**
   * 损耗/破损数量
   *
   * 库存盘点中发现的损耗
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  damageCount: number;

  /**
   * 最后一次库存检查时间
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field({ nullable: true })
  lastCheckTime?: Date;

  /**
   * 库存警告阈值
   *
   * 当库存低于此值时，系统会发出警告
   */
  @Column({ type: 'int', default: 10 })
  @Field(() => Int)
  warningThreshold: number;

  /**
   * 库存是否低于警告线
   *
   * 计算字段，用于快速查询
   */
  @Field()
  get isLowStock(): boolean {
    return this.currentStock <= this.warningThreshold;
  }

  /**
   * 乐观锁版本号
   *
   * 用于并发控制
   * 每次修改库存时版本号自动增加
   */
  @VersionColumn()
  @HideField()
  version: number;

  /**
   * 备注
   */
  @Column({ type: 'text', nullable: true })
  @Field({ nullable: true })
  remarks?: string;

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
   * @param quantity 所需数量
   * @returns true 如果可用库存充足
   */
  hasEnoughStock(quantity: number): boolean {
    return this.availableStock >= quantity;
  }

  /**
   * 业务方法：增加库存
   *
   * 用于补货、退货等场景
   *
   * @param quantity 增加数量
   * @throws Error 如果数量为负
   */
  increaseStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('增加数量不能为负');
    }
    this.currentStock += quantity;
    this.inboundTotal += quantity;
  }

  /**
   * 业务方法：减少库存
   *
   * 用于销售、损耗等场景
   *
   * @param quantity 减少数量
   * @throws Error 如果库存不足
   */
  decreaseStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('减少数量不能为负');
    }
    if (this.currentStock < quantity) {
      throw new Error(`库存不足。需要${quantity}件，只有${this.currentStock}件`);
    }
    this.currentStock -= quantity;
    this.outboundTotal += quantity;
  }

  /**
   * 业务方法：预留库存
   *
   * 用户下单时调用
   * 标记库存为已预留，但不立即扣减
   *
   * @param quantity 预留数量
   * @throws Error 如果可用库存不足
   */
  reserve(quantity: number): void {
    if (quantity < 0) {
      throw new Error('预留数量不能为负');
    }
    if (this.availableStock < quantity) {
      throw new Error(`库存不足以预留。需要${quantity}件，可用${this.availableStock}件`);
    }
    this.reservedStock += quantity;
  }

  /**
   * 业务方法：取消预留
   *
   * 订单取消时调用
   * 释放已预留的库存
   *
   * @param quantity 取消预留数量
   */
  cancelReserve(quantity: number): void {
    if (quantity < 0) {
      throw new Error('取消数量不能为负');
    }
    this.reservedStock = Math.max(0, this.reservedStock - quantity);
  }

  /**
   * 业务方法：确认预留
   *
   * 订单支付时调用
   * 将预留库存转为已出库库存
   *
   * @param quantity 确认数量
   */
  confirmReserve(quantity: number): void {
    if (quantity < 0) {
      throw new Error('确认数量不能为负');
    }
    if (this.reservedStock < quantity) {
      throw new Error(`预留库存不足。需要确认${quantity}件，已预留${this.reservedStock}件`);
    }
    this.reservedStock -= quantity;
    this.currentStock -= quantity;
    this.outboundTotal += quantity;
  }
}
