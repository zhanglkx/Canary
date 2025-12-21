/**
 * 支付交易实体
 *
 * 记录单个支付尝试的详细信息，包括：
 * - 支付网关请求和响应
 * - 交易状态和结果
 * - 错误信息
 * - 重试跟踪
 *
 * @author Claude
 * @module Ecommerce/Payment
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
import { Payment } from './payment.entity';

/**
 * 交易状态
 */
export enum TransactionStatus {
  INITIATED = 'INITIATED',           // 已初始化
  IN_PROGRESS = 'IN_PROGRESS',       // 进行中
  COMPLETED = 'COMPLETED',           // 已完成
  FAILED = 'FAILED',                 // 已失败
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',  // 等待确认
  CANCELLED = 'CANCELLED',           // 已取消
}

/**
 * 交易类型
 */
export enum TransactionType {
  CHARGE = 'CHARGE',                 // 扣款
  REFUND = 'REFUND',                 // 退款
  AUTHORIZE = 'AUTHORIZE',           // 预授权
  CAPTURE = 'CAPTURE',               // 确认扣款
}

// Register enums for GraphQL

/**
 * 支付交易实体
 *
 * 每次支付尝试都会创建一条交易记录
 * 支持重试：支付失败后可以创建新的交易记录再次尝试
 */
@Entity('payment_transactions')
@Index('IDX_transaction_payment', ['paymentId'])
@Index('IDX_transaction_status', ['status'])
@Index('IDX_transaction_type', ['type'])
@Index('IDX_transaction_created', ['createdAt'])
export class PaymentTransaction {
  /**
   * 交易ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 所属支付ID
   */
  @Column({ type: 'uuid' })
  paymentId: string;

  /**
   * 所属支付
   */
  @ManyToOne(() => Payment, (payment) => payment.transactions, {
    onDelete: 'CASCADE',
    lazy: false,
  })
  payment: Payment;

  /**
   * 交易类型
   */
  @Column({ type: 'enum', enum: TransactionType, default: TransactionType.CHARGE })
  type: TransactionType;

  /**
   * 交易状态
   */
  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.INITIATED })
  status: TransactionStatus;

  /**
   * 金额（人民币分）
   */
  @Column({ type: 'int' })
  amountCents: number;

  /**
   * 金额（元）
   */
  get amount(): number {
    return this.amountCents / 100;
  }

  /**
   * 支付网关参考ID
   * 用于查询和跟踪网关端的交易
   */
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  gatewayTransactionId?: string;

  /**
   * 支付意图ID（用于某些网关）
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  intentId?: string;

  /**
   * 请求数据（发送到网关的数据）
   */
  @Column({ type: 'jsonb', nullable: true })
  requestData?: {
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    description?: string;
    metadata?: Record<string, any>;
    [key: string]: any;
  };

  /**
   * 响应数据（从网关返回的数据）
   */
  @Column({ type: 'jsonb', nullable: true })
  get responseData(): string | undefined {
    return this.responseDataRaw ? JSON.stringify(this.responseDataRaw) : undefined;
  }

  @Column({ type: 'jsonb', nullable: true, select: false })
  responseDataRaw?: {
    transactionId?: string;
    status?: string;
    receiptUrl?: string;
    receiptNumber?: string;
    metadata?: Record<string, any>;
    [key: string]: any;
  };

  /**
   * 错误代码
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  errorCode?: string;

  /**
   * 错误信息
   */
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  /**
   * 错误详情（JSON）
   */
  @Column({ type: 'jsonb', nullable: true })
  errorDetails?: Record<string, any>;

  /**
   * 重试次数
   */
  @Column({ type: 'int', default: 0 })
  attemptNumber: number;

  /**
   * 3D Secure 结果（如适用）
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  threeDSecureResult?: string;

  /**
   * 是否需要客户确认
   */
  @Column({ type: 'boolean', default: false })
  requiresConfirmation: boolean;

  /**
   * 确认令牌（用于需要确认的支付）
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  confirmationToken?: string;

  /**
   * 交易完成时间
   */
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  /**
   * 元数据（JSON）
   */
  @Column({ type: 'jsonb', nullable: true })
  get metadata(): string | undefined {
    return this.metadataRaw ? JSON.stringify(this.metadataRaw) : undefined;
  }

  @Column({ type: 'jsonb', nullable: true, select: false })
  metadataRaw?: Record<string, any>;

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
   * 标记为进行中
   */
  markAsInProgress(): void {
    if (this.status !== TransactionStatus.INITIATED) {
      throw new Error('只有已初始化的交易可以标记为进行中');
    }
    this.status = TransactionStatus.IN_PROGRESS;
  }

  /**
   * 标记为已完成
   *
   * @param gatewayTransactionId 网关交易ID
   * @param responseData 网关响应数据
   */
  markAsCompleted(
    gatewayTransactionId: string,
    responseData?: Record<string, any>,
  ): void {
    if (
      ![TransactionStatus.IN_PROGRESS, TransactionStatus.PENDING_CONFIRMATION].includes(
        this.status,
      )
    ) {
      throw new Error('只有进行中或等待确认的交易可以标记为已完成');
    }
    this.status = TransactionStatus.COMPLETED;
    this.gatewayTransactionId = gatewayTransactionId;
    this.responseDataRaw = responseData;
    this.completedAt = new Date();
    this.errorCode = undefined;
    this.errorMessage = undefined;
  }

  /**
   * 标记为已失败
   *
   * @param errorCode 错误代码
   * @param errorMessage 错误信息
   * @param errorDetails 错误详情
   */
  markAsFailed(
    errorCode: string,
    errorMessage: string,
    errorDetails?: Record<string, any>,
  ): void {
    if (
      ![TransactionStatus.IN_PROGRESS, TransactionStatus.PENDING_CONFIRMATION].includes(
        this.status,
      )
    ) {
      throw new Error('只有进行中或等待确认的交易可以标记为已失败');
    }
    this.status = TransactionStatus.FAILED;
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.errorDetails = errorDetails;
  }

  /**
   * 标记为等待确认（用于需要用户确认的支付方式）
   *
   * @param confirmationToken 确认令牌
   * @param requiresConfirmation 是否需要确认
   */
  markAsPendingConfirmation(
    confirmationToken: string,
    requiresConfirmation: boolean = true,
  ): void {
    if (this.status !== TransactionStatus.IN_PROGRESS) {
      throw new Error('只有进行中的交易可以标记为等待确认');
    }
    this.status = TransactionStatus.PENDING_CONFIRMATION;
    this.confirmationToken = confirmationToken;
    this.requiresConfirmation = requiresConfirmation;
  }

  /**
   * 标记为已取消
   */
  markAsCancelled(): void {
    if (
      ![TransactionStatus.INITIATED, TransactionStatus.IN_PROGRESS].includes(this.status)
    ) {
      throw new Error('只有已初始化或进行中的交易可以取消');
    }
    this.status = TransactionStatus.CANCELLED;
  }

  /**
   * 是否成功
   */
  isSuccessful(): boolean {
    return this.status === TransactionStatus.COMPLETED;
  }

  /**
   * 是否失败
   */
  isFailed(): boolean {
    return this.status === TransactionStatus.FAILED;
  }

  /**
   * 是否进行中
   */
  isProcessing(): boolean {
    return [TransactionStatus.IN_PROGRESS, TransactionStatus.PENDING_CONFIRMATION].includes(
      this.status,
    );
  }

  /**
   * 是否可以重试
   */
  canRetry(): boolean {
    return this.status === TransactionStatus.FAILED;
  }
}
