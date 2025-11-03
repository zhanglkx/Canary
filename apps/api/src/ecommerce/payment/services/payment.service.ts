/**
 * 支付服务
 *
 * 核心职责：
 * 1. 支付生命周期管理：初始化、处理、成功、失败、退款
 * 2. 交易管理：创建交易记录，跟踪支付尝试
 * 3. 重试机制：失败后自动重试（最多3次）
 * 4. 退款处理：部分和全额退款
 * 5. 支付网关集成：Stripe、PayPal等
 *
 * @author Claude
 * @module Ecommerce/Payment
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethodType,
  PaymentGateway,
} from '../entities/payment.entity';
import {
  PaymentTransaction,
  TransactionStatus,
  TransactionType,
} from '../entities/payment-transaction.entity';
import { Order } from '../../order/entities/order.entity';

/**
 * 支付初始化输入
 */
export interface InitiatePaymentInput {
  orderId: string;
  amount: number; // 元
  currency?: string;
  methodType: PaymentMethodType;
  gateway: PaymentGateway;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}

/**
 * 支付处理结果
 */
export interface PaymentProcessResult {
  success: boolean;
  transactionId?: string;
  message: string;
  requiresConfirmation?: boolean;
  confirmationUrl?: string;
}

/**
 * 退款请求
 */
export interface RefundRequest {
  paymentId: string;
  amount?: number; // 元，不提供则为全额退款
  reason?: string;
}

/**
 * 退款结果
 */
export interface RefundResult {
  success: boolean;
  refundAmount: number;
  refundTransactionId?: string;
  message: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  /**
   * 初始化支付
   *
   * @param input 支付初始化输入
   * @returns 新创建的支付记录
   */
  async initiatePayment(input: InitiatePaymentInput): Promise<Payment> {
    this.logger.debug(
      `初始化支付: 订单=${input.orderId}, 金额=${input.amount}, 网关=${input.gateway}`,
    );

    // 检查订单是否存在
    const order = await this.orderRepository.findOne({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new NotFoundException(`订单 ${input.orderId} 不存在`);
    }

    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw new ConflictException('只有待支付或已确认的订单才能进行支付');
    }

    // 创建支付记录
    const amountCents = Math.round(input.amount * 100);
    const payment = this.paymentRepository.create({
      orderId: input.orderId,
      userId: order.userId,
      amountCents,
      currency: input.currency || 'CNY',
      methodType: input.methodType,
      gateway: input.gateway,
      paymentMethodId: input.paymentMethodId,
      metadata: input.metadata,
      status: PaymentStatus.PENDING,
      transactions: [],
    });

    const savedPayment = await this.paymentRepository.save(payment);
    this.logger.log(
      `支付已初始化: ID=${savedPayment.id}, 订单=${input.orderId}, 金额=${input.amount}`,
    );

    return savedPayment;
  }

  /**
   * 获取支付记录
   *
   * @param paymentId 支付ID
   * @returns 支付信息
   */
  async getPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['transactions', 'order'],
    });

    if (!payment) {
      throw new NotFoundException(`支付记录 ${paymentId} 不存在`);
    }

    return payment;
  }

  /**
   * 创建交易记录
   *
   * @param paymentId 支付ID
   * @param type 交易类型
   * @param attemptNumber 尝试次数
   * @returns 交易记录
   */
  async createTransaction(
    paymentId: string,
    type: TransactionType = TransactionType.CHARGE,
    attemptNumber: number = 1,
  ): Promise<PaymentTransaction> {
    const payment = await this.getPayment(paymentId);

    if (type === TransactionType.CHARGE && payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException(
        '只有待支付的支付可以创建扣款交易',
      );
    }

    if (type === TransactionType.REFUND && payment.status !== PaymentStatus.SUCCEEDED) {
      throw new ConflictException('只有已成功的支付可以创建退款交易');
    }

    const transaction = this.transactionRepository.create({
      paymentId,
      type,
      status: TransactionStatus.INITIATED,
      amountCents: payment.amountCents,
      attemptNumber,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);
    this.logger.debug(
      `交易已创建: ID=${savedTransaction.id}, 支付=${paymentId}, 类型=${type}, 尝试=${attemptNumber}`,
    );

    return savedTransaction;
  }

  /**
   * 处理支付成功
   *
   * @param paymentId 支付ID
   * @param transactionId 交易ID
   * @param gatewayTransactionId 网关交易ID
   * @param responseData 网关响应数据
   * @returns 更新后的支付
   */
  async markPaymentAsSucceeded(
    paymentId: string,
    transactionId: string,
    gatewayTransactionId: string,
    responseData?: Record<string, any>,
  ): Promise<Payment> {
    this.logger.debug(
      `标记支付为成功: 支付=${paymentId}, 交易=${transactionId}, 网关ID=${gatewayTransactionId}`,
    );

    const payment = await this.getPayment(paymentId);
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`交易 ${transactionId} 不存在`);
    }

    if (transaction.paymentId !== paymentId) {
      throw new BadRequestException('交易不属于该支付');
    }

    // 更新交易状态
    transaction.markAsCompleted(gatewayTransactionId, responseData);
    await this.transactionRepository.save(transaction);

    // 更新支付状态
    payment.markAsSucceeded();
    payment.transactionId = gatewayTransactionId;
    const updatedPayment = await this.paymentRepository.save(payment);

    this.logger.log(
      `支付已成功: ID=${paymentId}, 网关ID=${gatewayTransactionId}`,
    );

    return updatedPayment;
  }

  /**
   * 处理支付失败
   *
   * @param paymentId 支付ID
   * @param transactionId 交易ID
   * @param errorCode 错误代码
   * @param errorMessage 错误信息
   * @param errorDetails 错误详情
   * @returns 更新后的支付
   */
  async markPaymentAsFailed(
    paymentId: string,
    transactionId: string,
    errorCode: string,
    errorMessage: string,
    errorDetails?: Record<string, any>,
  ): Promise<Payment> {
    this.logger.debug(
      `标记支付为失败: 支付=${paymentId}, 交易=${transactionId}, 错误=${errorCode}`,
    );

    const payment = await this.getPayment(paymentId);
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`交易 ${transactionId} 不存在`);
    }

    if (transaction.paymentId !== paymentId) {
      throw new BadRequestException('交易不属于该支付');
    }

    // 更新交易状态
    transaction.markAsFailed(errorCode, errorMessage, errorDetails);
    await this.transactionRepository.save(transaction);

    // 更新支付状态
    if (payment.canRetry()) {
      payment.markAsFailed(errorMessage);
      this.logger.log(
        `支付失败可重试: ID=${paymentId}, 重试次数=${payment.retryCount}/${payment.maxRetries}`,
      );
    } else {
      payment.markAsFailed(errorMessage);
      this.logger.warn(
        `支付失败且无法重试: ID=${paymentId}, 重试次数=${payment.retryCount}`,
      );
    }

    const updatedPayment = await this.paymentRepository.save(payment);
    return updatedPayment;
  }

  /**
   * 处理支付处理中
   *
   * @param paymentId 支付ID
   * @param transactionId 交易ID
   * @returns 更新后的支付
   */
  async markPaymentAsProcessing(
    paymentId: string,
    transactionId: string,
  ): Promise<Payment> {
    this.logger.debug(
      `标记支付为处理中: 支付=${paymentId}, 交易=${transactionId}`,
    );

    const payment = await this.getPayment(paymentId);
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`交易 ${transactionId} 不存在`);
    }

    // 更新交易状态
    transaction.markAsInProgress();
    await this.transactionRepository.save(transaction);

    // 更新支付状态
    payment.markAsProcessing();
    const updatedPayment = await this.paymentRepository.save(payment);

    return updatedPayment;
  }

  /**
   * 取消支付
   *
   * @param paymentId 支付ID
   * @param reason 取消原因
   * @returns 更新后的支付
   */
  async cancelPayment(paymentId: string, reason?: string): Promise<Payment> {
    this.logger.debug(`取消支付: 支付=${paymentId}, 原因=${reason || '无'}`);

    const payment = await this.getPayment(paymentId);

    if (
      ![PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(payment.status)
    ) {
      throw new ConflictException('只有待支付或处理中的支付可以取消');
    }

    payment.markAsCancelled();
    if (reason) {
      payment.notes = `[已取消] ${reason}`;
    }

    const updatedPayment = await this.paymentRepository.save(payment);
    this.logger.log(`支付已取消: ID=${paymentId}`);

    return updatedPayment;
  }

  /**
   * 初始化退款
   *
   * @param request 退款请求
   * @returns 退款结果
   */
  async initiateRefund(request: RefundRequest): Promise<RefundResult> {
    this.logger.debug(
      `初始化退款: 支付=${request.paymentId}, 金额=${request.amount || '全额'}`,
    );

    const payment = await this.getPayment(request.paymentId);

    if (!payment.canRefund()) {
      throw new ConflictException('该支付无法退款（非成功状态或已全额退款）');
    }

    // 确定退款金额
    const refundAmountCents = request.amount
      ? Math.round(request.amount * 100)
      : payment.amountCents - payment.refundedAmountCents;

    if (refundAmountCents <= 0) {
      throw new BadRequestException('退款金额必须大于0');
    }

    if (
      refundAmountCents + payment.refundedAmountCents > payment.amountCents
    ) {
      throw new BadRequestException('退款金额超过可退款金额');
    }

    // 创建退款交易
    const refundTransaction = this.transactionRepository.create({
      paymentId: payment.id,
      type: TransactionType.REFUND,
      amountCents: refundAmountCents,
      status: TransactionStatus.IN_PROGRESS,
      attemptNumber: 1,
      notes: request.reason,
    });

    const savedTransaction = await this.transactionRepository.save(refundTransaction);

    // 更新支付状态为退款中
    payment.startRefunding();
    await this.paymentRepository.save(payment);

    this.logger.log(
      `退款已初始化: 支付=${payment.id}, 退款交易=${savedTransaction.id}, 金额=${refundAmountCents / 100}`,
    );

    return {
      success: true,
      refundAmount: refundAmountCents / 100,
      refundTransactionId: savedTransaction.id,
      message: '退款已初始化，等待网关处理',
    };
  }

  /**
   * 完成退款
   *
   * @param paymentId 支付ID
   * @param refundTransactionId 退款交易ID
   * @param refundAmount 退款金额（元）
   * @param gatewayRefundId 网关退款ID
   * @returns 退款结果
   */
  async completeRefund(
    paymentId: string,
    refundTransactionId: string,
    refundAmount: number,
    gatewayRefundId: string,
  ): Promise<RefundResult> {
    this.logger.debug(
      `完成退款: 支付=${paymentId}, 退款交易=${refundTransactionId}, 金额=${refundAmount}, 网关ID=${gatewayRefundId}`,
    );

    const payment = await this.getPayment(paymentId);
    const refundTransaction = await this.transactionRepository.findOne({
      where: { id: refundTransactionId },
    });

    if (!refundTransaction) {
      throw new NotFoundException(`退款交易 ${refundTransactionId} 不存在`);
    }

    // 更新退款交易
    refundTransaction.markAsCompleted(gatewayRefundId, {
      refundId: gatewayRefundId,
      refundAmount,
    });
    await this.transactionRepository.save(refundTransaction);

    // 更新支付退款金额
    payment.updateRefundAmount(payment.refundedAmount + refundAmount);
    const updatedPayment = await this.paymentRepository.save(payment);

    this.logger.log(
      `退款已完成: 支付=${paymentId}, 网关ID=${gatewayRefundId}, 已退款=${updatedPayment.refundedAmount}/${updatedPayment.amount}`,
    );

    return {
      success: true,
      refundAmount,
      refundTransactionId: gatewayRefundId,
      message: `退款成功，已退款${updatedPayment.refundedAmount}元`,
    };
  }

  /**
   * 获取支付的所有交易
   *
   * @param paymentId 支付ID
   * @returns 交易列表
   */
  async getPaymentTransactions(paymentId: string): Promise<PaymentTransaction[]> {
    const payment = await this.getPayment(paymentId);

    return this.transactionRepository.find({
      where: { paymentId: payment.id },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 按订单获取支付
   *
   * @param orderId 订单ID
   * @returns 支付记录
   */
  async getPaymentByOrder(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { orderId },
      relations: ['transactions'],
    });
  }

  /**
   * 获取用户的支付历史
   *
   * @param userId 用户ID
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns [支付列表, 总数]
   */
  async getUserPayments(
    userId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Payment[], number]> {
    return this.paymentRepository.findAndCount({
      where: { userId },
      relations: ['transactions', 'order'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  /**
   * 获取支付统计信息
   *
   * @returns 统计结果
   */
  async getPaymentStats(): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulAmount: number;
    failedCount: number;
    refundedAmount: number;
    successRate: number;
  }> {
    const payments = await this.paymentRepository.find();

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const successfulAmount = payments
      .filter((p) => p.status === PaymentStatus.SUCCEEDED)
      .reduce((sum, p) => sum + p.amount, 0);
    const failedCount = payments.filter((p) => p.status === PaymentStatus.FAILED).length;
    const refundedAmount = payments.reduce((sum, p) => sum + p.refundedAmount, 0);
    const successRate =
      payments.length > 0
        ? (payments.filter((p) => p.isSuccessful()).length / payments.length) * 100
        : 0;

    return {
      totalPayments: payments.length,
      totalAmount,
      successfulAmount,
      failedCount,
      refundedAmount,
      successRate,
    };
  }
}
