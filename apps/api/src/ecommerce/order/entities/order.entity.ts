/**
 * 订单实体
 *
 * 用户下单后生成的订单记录
 * 包含订单状态、商品列表、价格、配送等信息
 *
 * 订单状态：
 * - PENDING: 待支付
 * - CONFIRMED: 已支付（待发货）
 * - SHIPPED: 已发货
 * - DELIVERED: 已送达
 * - CANCELLED: 已取消
 *
 * @author Claude
 * @module Ecommerce/Order
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
import { User } from '../../../user/user.entity';
import { OrderItem } from './order-item.entity';

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  PENDING = 'PENDING',           // 待支付
  CONFIRMED = 'CONFIRMED',       // 已支付（待发货）
  SHIPPED = 'SHIPPED',           // 已发货
  DELIVERED = 'DELIVERED',       // 已送达
  CANCELLED = 'CANCELLED',       // 已取消
}

/**
 * 订单支付方式
 */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

// Register enums for GraphQL

/**
 * 订单实体
 */
@Entity('orders')
@Index('IDX_order_user_status', ['userId', 'status'])
@Index('IDX_order_status', ['status'])
@Index('IDX_order_created', ['createdAt'])
@Index('IDX_order_user_created', ['userId', 'createdAt'])
export class Order {
  /**
   * 订单ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 订单号（用户可见的订单号）
   * 格式：ORD-20251103-000001
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  /**
   * 所属用户ID
   */
  @Column({ type: 'uuid' })
  userId: string;

  /**
   * 所属用户
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', lazy: false })
  user: User;

  /**
   * 订单状态
   */
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  /**
   * 订单中的商品项目
   */
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: ['insert', 'update', 'remove'],
    eager: true,
  })
  items: OrderItem[];

  /**
   * 商品小计（不含税费、配送费）
   * 单位：人民币分
   */
  @Column({ type: 'int' })
  subtotalCents: number;

  /**
   * 税费（人民币分）
   */
  @Column({ type: 'int', default: 0 })
  taxCents: number;

  /**
   * 配送费（人民币分）
   */
  @Column({ type: 'int', default: 0 })
  shippingCents: number;

  /**
   * 优惠金额（人民币分）
   */
  @Column({ type: 'int', default: 0 })
  discountCents: number;

  /**
   * 总价（元）
   * Computed: (subtotal + tax + shipping - discount) / 100
   */
  get totalAmount(): number {
    const total =
      this.subtotalCents +
      this.taxCents +
      this.shippingCents -
      this.discountCents;
    return Math.max(0, total) / 100;
  }

  /**
   * 商品小计（元）
   */
  get subtotal(): number {
    return this.subtotalCents / 100;
  }

  /**
   * 税费（元）
   */
  get tax(): number {
    return this.taxCents / 100;
  }

  /**
   * 配送费（元）
   */
  get shipping(): number {
    return this.shippingCents / 100;
  }

  /**
   * 优惠金额（元）
   */
  get discount(): number {
    return this.discountCents / 100;
  }

  /**
   * 支付方式
   */
  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod;

  /**
   * 支付时间
   */
  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  /**
   * 发货时间
   */
  @Column({ type: 'timestamp', nullable: true })
  shippedAt?: Date;

  /**
   * 送达时间
   */
  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  /**
   * 取消时间
   */
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  /**
   * 配送地址
   */
  @Column({ type: 'text', nullable: true })
  shippingAddress?: string;

  /**
   * 收货人姓名
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  recipientName?: string;

  /**
   * 收货人电话
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone?: string;

  /**
   * 备注
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 最后更新时间
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * ==================== 业务方法 ====================
   */

  /**
   * 确认订单支付
   *
   * @param paymentMethod 支付方式
   */
  confirmPayment(paymentMethod: PaymentMethod): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('只有待支付订单才能确认支付');
    }

    this.status = OrderStatus.CONFIRMED;
    this.paymentMethod = paymentMethod;
    this.paidAt = new Date();
  }

  /**
   * 发货
   */
  markAsShipped(): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new Error('只有已确认订单才能标记为已发货');
    }

    this.status = OrderStatus.SHIPPED;
    this.shippedAt = new Date();
  }

  /**
   * 送达
   */
  markAsDelivered(): void {
    if (this.status !== OrderStatus.SHIPPED) {
      throw new Error('只有已发货订单才能标记为已送达');
    }

    this.status = OrderStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  /**
   * 取消订单
   *
   * @throws Error 如果订单已发货或已送达
   */
  cancel(): void {
    if (this.status === OrderStatus.SHIPPED || this.status === OrderStatus.DELIVERED) {
      throw new Error('已发货或已送达的订单无法取消');
    }

    this.status = OrderStatus.CANCELLED;
    this.cancelledAt = new Date();
  }

  /**
   * 检查是否可以取消
   */
  canBeCancelled(): boolean {
    return (
      this.status === OrderStatus.PENDING || this.status === OrderStatus.CONFIRMED
    );
  }

  /**
   * 检查是否已支付
   */
  isPaid(): boolean {
    return this.status !== OrderStatus.PENDING && this.paidAt !== null;
  }

  /**
   * 检查是否已发货
   */
  isShipped(): boolean {
    return (
      this.status === OrderStatus.SHIPPED || this.status === OrderStatus.DELIVERED
    );
  }

  /**
   * 检查是否已送达
   */
  isDelivered(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  /**
   * 获取订单天数（从创建到现在）
   */
  getDaysOld(): number {
    const now = new Date();
    const days = (now.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(days);
  }

  /**
   * 获取商品总数
   */
  getTotalItems(): number {
    if (!this.items) {
      return 0;
    }
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * 获取不同商品数量
   */
  getUniqueSKUCount(): number {
    if (!this.items) {
      return 0;
    }
    return this.items.length;
  }
}
