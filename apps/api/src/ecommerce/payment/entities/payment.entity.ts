/**
 * 支付实体
 *
 * 记录订单的支付信息和交易历史
 * 支持多种支付方式和多次支付尝试
 *
 * @author Claude
 * @module Ecommerce/Payment
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { PaymentTransaction } from './payment-transaction.entity';

/**
 * 支付状态
 */
export enum PaymentStatus {
  PENDING = 'PENDING',             // 待支付
  PROCESSING = 'PROCESSING',       // 处理中
  SUCCEEDED = 'SUCCEEDED',         // 成功
  FAILED = 'FAILED',               // 失败
  CANCELLED = 'CANCELLED',         // 已取消
  REFUNDING = 'REFUNDING',         // 退款中
  REFUNDED = 'REFUNDED',           // 已退款
}

/**
 * 支付方式类型
 */
export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
}

/**
 * 支付网关
 */
export enum PaymentGateway {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  ALIPAY = 'ALIPAY',
  WECHAT_PAY = 'WECHAT_PAY',
}

// Register enums for REST API

/**
 * 支付实体
 *
 * 记录订单级别的支付信息，可能包含多个交易记录
 */
@Entity('payments')
@Index('IDX_payment_order', ['orderId'])
@Index('IDX_payment_status', ['status'])
@Index('IDX_payment_user', ['userId'])
@Index('IDX_payment_created', ['createdAt'])
export class Payment {
  /**
   * 支付ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 所属订单ID
   */
  @Column({ type: 'uuid' })
  orderId: string;

  /**
   * 所属订单
   */
  @ManyToOne(() => Order, { onDelete: 'CASCADE', lazy: false })
  order: Order;

  /**
   * 用户ID（冗余字段，便于查询）
   */
  @Column({ type: 'uuid' })
  userId: string;

  /**
   * 支付状态
   */
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  /**
   * 支付金额（人民币分）
   */
  @Column({ type: 'int' })
  amountCents: number;

  /**
   * 支付金额（元）
   */
  get amount(): number {
    return this.amountCents / 100;
  }

  /**
   * 货币代码
   */
  @Column({ type: 'varchar', length: 3, default: 'CNY' })
  currency: string;

  /**
   * 支付方式
   */
  @Column({ type: 'enum', enum: PaymentMethodType })
  methodType: PaymentMethodType;

  /**
   * 支付网关
   */
  @Column({ type: 'enum', enum: PaymentGateway })
  gateway: PaymentGateway;

  /**
   * 支付交易ID（网关返回）
   */
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  transactionId?: string;

  /**
   * 支付意图ID（Stripe会话等）
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  intentId?: string;

  /**
   * 支付方式ID（保存的卡片等）
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentMethodId?: string;

  /**
   * 支付交易记录
   */
  @OneToMany(() => PaymentTransaction, (transaction) => transaction.payment, {
    cascade: ['insert', 'remove'],
    eager: true,
  })
  transactions: PaymentTransaction[];

  /**
   * 支付成功时间
   */
  @Column({ type: 'timestamp', nullable: true })
  succeededAt?: Date;

  /**
   * 最后一次失败时间
   */
  @Column({ type: 'timestamp', nullable: true })
  failedAt?: Date;

  /**
   * 最后一次失败原因
   */
  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  /**
   * 退款金额（人民币分）
   */
  @Column({ type: 'int', default: 0 })
  refundedAmountCents: number;

  /**
   * 退款金额（元）
   */
  get refundedAmount(): number {
    return this.refundedAmountCents / 100;
  }

  /**
   * 是否已部分退款
   */
  get isPartiallyRefunded(): boolean {
    return this.refundedAmountCents > 0 && this.refundedAmountCents < this.amountCents;
  }

  /**
   * 是否已全额退款
   */
  get isFullyRefunded(): boolean {
    return this.refundedAmountCents === this.amountCents;
  }

  /**
   * 重试次数
   */
  @Column({ type: 'int', default: 0 })
  retryCount: number;

  /**
   * 最大重试次数
   */
  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  /**
   * 元数据（JSON）
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

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
   * 更新时间
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * ==================== 业务方法 ====================
   */

  /**
   * 标记为处理中
   */
  markAsProcessing(): void {
    if (this.status !== PaymentStatus.PENDING && this.status !== PaymentStatus.FAILED) {
      throw new Error('只有待支付或失败的支付可以标记为处理中');
    }
    this.status = PaymentStatus.PROCESSING;
  }

  /**
   * 标记为成功
   */
  markAsSucceeded(): void {
    if (this.status !== PaymentStatus.PROCESSING) {
      throw new Error('只有处理中的支付可以标记为成功');
    }
    this.status = PaymentStatus.SUCCEEDED;
    this.succeededAt = new Date();
  }

  /**
   * 标记为失败
   *
   * @param reason 失败原因
   */
  markAsFailed(reason: string): void {
    if (
      ![PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(this.status)
    ) {
      throw new Error('只有待支付或处理中的支付可以标记为失败');
    }
    this.status = PaymentStatus.FAILED;
    this.failedAt = new Date();
    this.failureReason = reason;
    this.retryCount++;
  }

  /**
   * 标记为取消
   */
  markAsCancelled(): void {
    if (
      ![PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.FAILED].includes(
        this.status,
      )
    ) {
      throw new Error('只有待支付、处理中或失败的支付可以取消');
    }
    this.status = PaymentStatus.CANCELLED;
  }

  /**
   * 开始退款
   */
  startRefunding(): void {
    if (this.status !== PaymentStatus.SUCCEEDED) {
      throw new Error('只有成功的支付可以退款');
    }
    this.status = PaymentStatus.REFUNDING;
  }

  /**
   * 更新退款金额
   *
   * @param amount 退款金额（元）
   */
  updateRefundAmount(amount: number): void {
    const amountCents = Math.round(amount * 100);
    if (amountCents > this.amountCents) {
      throw new Error('退款金额不能超过原支付金额');
    }
    if (amountCents < 0) {
      throw new Error('退款金额不能为负');
    }

    this.refundedAmountCents = amountCents;

    // 根据退款状态更新
    if (amountCents === this.amountCents) {
      this.status = PaymentStatus.REFUNDED;
    } else if (amountCents > 0) {
      this.status = PaymentStatus.REFUNDED;
    }
  }

  /**
   * 是否可以重试
   */
  canRetry(): boolean {
    return (
      this.status === PaymentStatus.FAILED &&
      this.retryCount < this.maxRetries
    );
  }

  /**
   * 是否成功
   */
  isSuccessful(): boolean {
    return this.status === PaymentStatus.SUCCEEDED;
  }

  /**
   * 是否可以退款
   */
  canRefund(): boolean {
    return this.status === PaymentStatus.SUCCEEDED && !this.isFullyRefunded;
  }
}
