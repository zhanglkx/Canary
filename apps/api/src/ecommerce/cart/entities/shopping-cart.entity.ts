/**
 * 购物车实体
 *
 * 用户的购物车，包含多个商品项目
 * 支持自动计算总价、税费、优惠等
 *
 * 购物车状态：
 * - ACTIVE: 激活中，用户可以继续购物
 * - ABANDONED: 已废弃（某个时间内未使用）
 * - CONVERTED: 已转换为订单
 *
 * @author Claude
 * @module Ecommerce/ShoppingCart
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, Int, Float, registerEnumType } from '@nestjs/graphql';
import { HideField } from '@nestjs/graphql';
import { User } from '../../../user/user.entity';
import { CartItem } from './cart-item.entity';

/**
 * 购物车状态枚举
 */
export enum CartStatus {
  ACTIVE = 'ACTIVE',
  ABANDONED = 'ABANDONED',
  CONVERTED = 'CONVERTED',
}

// Register enum for GraphQL
registerEnumType(CartStatus, { name: 'CartStatus' });

/**
 * 购物车实体
 */
@Entity('shopping_carts')
@ObjectType()
@Index('IDX_cart_user_status', ['userId', 'status'])
@Index('IDX_cart_status', ['status'])
@Index('IDX_cart_updated', ['updatedAt'])
export class ShoppingCart {
  /**
   * 购物车ID
   */
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id: string;

  /**
   * 所属用户ID
   */
  @Column({ type: 'uuid' })
  @HideField()
  userId: string;

  /**
   * 所属用户
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', lazy: false })
  @HideField()
  user: User;

  /**
   * 购物车中的商品项目
   */
  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: ['insert', 'update', 'remove'],
    eager: true,
  })
  @Field(() => [CartItem])
  items: CartItem[];

  /**
   * 购物车状态
   *
   * - ACTIVE: 激活中
   * - ABANDONED: 已废弃
   * - CONVERTED: 已转换为订单
   */
  @Column({ type: 'enum', enum: CartStatus, default: CartStatus.ACTIVE })
  @Field(() => CartStatus)
  status: CartStatus;

  /**
   * 备注（优惠券、特殊说明等）
   */
  @Column({ type: 'text', nullable: true })
  @Field({ nullable: true })
  notes?: string;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  @Field()
  createdAt: Date;

  /**
   * 最后更新时间
   */
  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  /**
   * ==================== 计算字段 ====================
   */

  /**
   * 商品总数（数量总和）
   */
  @Field(() => Int)
  get totalItems(): number {
    if (!this.items || this.items.length === 0) {
      return 0;
    }
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * SKU总数（不同的SKU数量）
   */
  @Field(() => Int)
  get totalSKUs(): number {
    if (!this.items) {
      return 0;
    }
    return this.items.length;
  }

  /**
   * 商品小计（商品总价，不含税费和优惠）
   */
  @Field(() => Float)
  get subtotal(): number {
    if (!this.items || this.items.length === 0) {
      return 0;
    }
    return this.items.reduce((total, item) => {
      return total + item.itemTotal;
    }, 0);
  }

  /**
   * 税费（根据小计计算）
   *
   * 税率通常为固定百分比，这里假设为8%
   * 实际应用中应从配置或数据库获取
   */
  @Field(() => Float)
  get taxAmount(): number {
    const TAX_RATE = 0.08; // 8%
    return this.subtotal * TAX_RATE;
  }

  /**
   * 总价（包含税费）
   */
  @Field(() => Float)
  get total(): number {
    return this.subtotal + this.taxAmount;
  }

  /**
   * 是否为空购物车
   */
  @Field()
  get isEmpty(): boolean {
    return !this.items || this.items.length === 0;
  }

  /**
   * 是否已废弃（24小时未更新）
   */
  @Field()
  get isAbandoned(): boolean {
    if (this.status === CartStatus.ABANDONED) {
      return true;
    }
    const now = new Date();
    const lastUpdate = new Date(this.updatedAt);
    const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24;
  }

  /**
   * ==================== 业务方法 ====================
   */

  /**
   * 添加商品到购物车
   *
   * @param item 要添加的购物车项目
   * @throws Error 如果购物车已转换为订单
   */
  addItem(item: CartItem): void {
    if (this.status === CartStatus.CONVERTED) {
      throw new Error('已转换为订单的购物车无法修改');
    }

    // 检查是否已存在相同SKU的商品
    const existingItem = this.items?.find((i) => i.skuId === item.skuId);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      if (!this.items) {
        this.items = [];
      }
      this.items.push(item);
    }

    this.status = CartStatus.ACTIVE;
  }

  /**
   * 移除商品
   *
   * @param skuId 要移除的SKU ID
   */
  removeItem(skuId: string): void {
    if (!this.items) {
      return;
    }
    this.items = this.items.filter((item) => item.skuId !== skuId);
  }

  /**
   * 更新商品数量
   *
   * @param skuId SKU ID
   * @param quantity 新的数量
   * @throws Error 如果数量无效
   */
  updateItemQuantity(skuId: string, quantity: number): void {
    if (quantity <= 0) {
      throw new Error('商品数量必须大于0');
    }

    const item = this.items?.find((i) => i.skuId === skuId);
    if (!item) {
      throw new Error(`SKU ${skuId} 不存在于购物车`);
    }

    item.quantity = quantity;
    this.status = CartStatus.ACTIVE;
  }

  /**
   * 清空购物车
   */
  clear(): void {
    this.items = [];
  }

  /**
   * 标记为已废弃
   */
  markAsAbandoned(): void {
    this.status = CartStatus.ABANDONED;
  }

  /**
   * 标记为已转换
   */
  markAsConverted(): void {
    this.status = CartStatus.CONVERTED;
  }
}
