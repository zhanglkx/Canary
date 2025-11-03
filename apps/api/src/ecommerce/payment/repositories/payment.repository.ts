/**
 * 支付仓储库
 *
 * 提供高级查询和数据操作方法，包括：
 * - 支付查询和过滤
 * - 交易查询和分析
 * - 支付统计和报表
 * - 退款分析
 *
 * @author Claude
 * @module Ecommerce/Payment
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan, MoreThan } from 'typeorm';
import { Payment, PaymentStatus, PaymentGateway } from '../entities/payment.entity';
import { PaymentTransaction, TransactionStatus, TransactionType } from '../entities/payment-transaction.entity';

/**
 * 支付查询选项
 */
export interface PaymentQueryOptions {
  skip?: number;
  take?: number;
  status?: PaymentStatus;
  gateway?: PaymentGateway;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 支付统计结果
 */
export interface PaymentStatResult {
  status: PaymentStatus;
  count: number;
  totalAmount: number;
  averageAmount: number;
}

/**
 * 日收入结果
 */
export interface DailyPaymentResult {
  date: string;
  paymentsCount: number;
  totalAmount: number;
  successCount: number;
  failureCount: number;
}

/**
 * 支付网关统计
 */
export interface GatewayStatResult {
  gateway: PaymentGateway;
  totalCount: number;
  successCount: number;
  failureCount: number;
  totalAmount: number;
  successRate: number;
}

/**
 * 退款统计
 */
export interface RefundStatResult {
  totalRefunds: number;
  totalRefundedAmount: number;
  averageRefundAmount: number;
  partialRefundCount: number;
  fullRefundCount: number;
}

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private repository: Repository<Payment>,
    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,
  ) {}

  /**
   * 保存支付记录
   *
   * @param payment 支付对象
   * @returns 保存后的支付记录
   */
  async save(payment: Payment): Promise<Payment> {
    return this.repository.save(payment);
  }

  /**
   * 按ID获取支付
   *
   * @param id 支付ID
   * @returns 支付记录
   */
  async findById(id: string): Promise<Payment | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['transactions', 'order'],
    });
  }

  /**
   * 按订单获取支付
   *
   * @param orderId 订单ID
   * @returns 支付记录
   */
  async findByOrder(orderId: string): Promise<Payment | null> {
    return this.repository.findOne({
      where: { orderId },
      relations: ['transactions'],
    });
  }

  /**
   * 按网关交易ID获取支付
   *
   * @param transactionId 网关交易ID
   * @returns 支付记录
   */
  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.repository.findOne({
      where: { transactionId },
      relations: ['transactions'],
    });
  }

  /**
   * 获取用户的支付
   *
   * @param userId 用户ID
   * @param options 查询选项
   * @returns [支付列表, 总数]
   */
  async findUserPayments(
    userId: string,
    options: PaymentQueryOptions = {},
  ): Promise<[Payment[], number]> {
    const query = this.repository
      .createQueryBuilder('payment')
      .where('payment.userId = :userId', { userId })
      .leftJoinAndSelect('payment.transactions', 'transactions')
      .leftJoinAndSelect('payment.order', 'order');

    if (options.status) {
      query.andWhere('payment.status = :status', { status: options.status });
    }

    if (options.gateway) {
      query.andWhere('payment.gateway = :gateway', { gateway: options.gateway });
    }

    if (options.startDate && options.endDate) {
      query.andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    }

    const skip = options.skip || 0;
    const take = options.take || 10;

    return query
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  /**
   * 获取指定状态的支付
   *
   * @param status 支付状态
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns [支付列表, 总数]
   */
  async findByStatus(
    status: PaymentStatus,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Payment[], number]> {
    return this.repository.findAndCount({
      where: { status },
      relations: ['transactions', 'order'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  /**
   * 获取待处理的支付（超过指定时间）
   *
   * @param minutes 分钟数
   * @returns 支付列表
   */
  async findPendingPaymentsOlderThan(minutes: number): Promise<Payment[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    return this.repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.transactions', 'transactions')
      .leftJoinAndSelect('payment.order', 'order')
      .where('payment.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('payment.createdAt < :cutoffTime', { cutoffTime })
      .orderBy('payment.createdAt', 'ASC')
      .getMany();
  }

  /**
   * 获取处理中的支付（超过指定时间）
   *
   * @param minutes 分钟数
   * @returns 支付列表
   */
  async findProcessingPaymentsOlderThan(minutes: number): Promise<Payment[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    return this.repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.transactions', 'transactions')
      .where('payment.status = :status', { status: PaymentStatus.PROCESSING })
      .andWhere('payment.createdAt < :cutoffTime', { cutoffTime })
      .orderBy('payment.createdAt', 'ASC')
      .getMany();
  }

  /**
   * 获取可以重试的支付
   *
   * @param limit 限制数量
   * @returns 支付列表
   */
  async findRetryablePayments(limit: number = 20): Promise<Payment[]> {
    return this.repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.transactions', 'transactions')
      .where('payment.status = :status', { status: PaymentStatus.FAILED })
      .andWhere('payment.retryCount < payment.maxRetries')
      .orderBy('payment.updatedAt', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * 获取支付状态统计
   *
   * @returns 统计结果数组
   */
  async getStatusStatistics(): Promise<PaymentStatResult[]> {
    const result = await this.repository
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amountCents) / 100', 'totalAmount')
      .addSelect('AVG(payment.amountCents) / 100', 'averageAmount')
      .groupBy('payment.status')
      .getRawMany();

    return result.map((row) => ({
      status: row.status,
      count: parseInt(row.count, 10),
      totalAmount: parseFloat(row.totalAmount) || 0,
      averageAmount: parseFloat(row.averageAmount) || 0,
    }));
  }

  /**
   * 获取日支付统计
   *
   * @param days 天数
   * @returns 日支付数组
   */
  async getDailyPaymentStatistics(days: number = 7): Promise<DailyPaymentResult[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await this.repository
      .createQueryBuilder('payment')
      .select("DATE_FORMAT(payment.createdAt, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'paymentsCount')
      .addSelect('SUM(payment.amountCents) / 100', 'totalAmount')
      .addSelect(
        "SUM(CASE WHEN payment.status = 'SUCCEEDED' THEN 1 ELSE 0 END)",
        'successCount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.status = 'FAILED' THEN 1 ELSE 0 END)",
        'failureCount',
      )
      .where('payment.createdAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'DESC')
      .getRawMany();

    return result.map((row) => ({
      date: row.date,
      paymentsCount: parseInt(row.paymentsCount, 10),
      totalAmount: parseFloat(row.totalAmount) || 0,
      successCount: parseInt(row.successCount, 10),
      failureCount: parseInt(row.failureCount, 10),
    }));
  }

  /**
   * 获取支付网关统计
   *
   * @returns 网关统计数组
   */
  async getGatewayStatistics(): Promise<GatewayStatResult[]> {
    const result = await this.repository
      .createQueryBuilder('payment')
      .select('payment.gateway', 'gateway')
      .addSelect('COUNT(*)', 'totalCount')
      .addSelect(
        "SUM(CASE WHEN payment.status = 'SUCCEEDED' THEN 1 ELSE 0 END)",
        'successCount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.status = 'FAILED' THEN 1 ELSE 0 END)",
        'failureCount',
      )
      .addSelect('SUM(payment.amountCents) / 100', 'totalAmount')
      .groupBy('payment.gateway')
      .getRawMany();

    return result.map((row) => {
      const totalCount = parseInt(row.totalCount, 10);
      const successCount = parseInt(row.successCount, 10);
      const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

      return {
        gateway: row.gateway,
        totalCount,
        successCount,
        failureCount: parseInt(row.failureCount, 10),
        totalAmount: parseFloat(row.totalAmount) || 0,
        successRate,
      };
    });
  }

  /**
   * 获取退款统计
   *
   * @returns 退款统计
   */
  async getRefundStatistics(): Promise<RefundStatResult> {
    const result = await this.repository
      .createQueryBuilder('payment')
      .select('COUNT(*)', 'totalRefunds')
      .addSelect('SUM(payment.refundedAmountCents) / 100', 'totalRefundedAmount')
      .addSelect('AVG(payment.refundedAmountCents) / 100', 'averageRefundAmount')
      .addSelect(
        "SUM(CASE WHEN payment.refundedAmountCents > 0 AND payment.refundedAmountCents < payment.amountCents THEN 1 ELSE 0 END)",
        'partialRefundCount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.refundedAmountCents = payment.amountCents THEN 1 ELSE 0 END)",
        'fullRefundCount',
      )
      .where('payment.refundedAmountCents > 0')
      .getRawMany();

    const row = result[0] || {};
    return {
      totalRefunds: parseInt(row.totalRefunds, 10) || 0,
      totalRefundedAmount: parseFloat(row.totalRefundedAmount) || 0,
      averageRefundAmount: parseFloat(row.averageRefundAmount) || 0,
      partialRefundCount: parseInt(row.partialRefundCount, 10) || 0,
      fullRefundCount: parseInt(row.fullRefundCount, 10) || 0,
    };
  }

  /**
   * 按日期范围获取支付分析
   *
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 分析数据
   */
  async getPaymentAnalysisByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    cancelledPayments: number;
    totalAmount: number;
    averageAmount: number;
    successRate: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('payment')
      .where('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getManyAndCount();

    const payments = result[0];
    const totalCount = result[1];

    const successfulPayments = payments.filter(
      (p) => p.status === PaymentStatus.SUCCEEDED,
    ).length;
    const failedPayments = payments.filter((p) => p.status === PaymentStatus.FAILED)
      .length;
    const cancelledPayments = payments.filter(
      (p) => p.status === PaymentStatus.CANCELLED,
    ).length;

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    const successRate = totalCount > 0 ? (successfulPayments / totalCount) * 100 : 0;

    return {
      totalPayments: totalCount,
      successfulPayments,
      failedPayments,
      cancelledPayments,
      totalAmount,
      averageAmount,
      successRate,
    };
  }

  /**
   * 搜索支付
   *
   * @param keyword 关键词（订单号、交易ID等）
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns [支付列表, 总数]
   */
  async searchPayments(
    keyword: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Payment[], number]> {
    return this.repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.transactions', 'transactions')
      .where('payment.transactionId LIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .orWhere('order.orderNumber LIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  /**
   * 获取支付交易
   *
   * @param transactionId 交易ID
   * @returns 交易记录
   */
  async findTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    return this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['payment'],
    });
  }

  /**
   * 获取支付的所有交易
   *
   * @param paymentId 支付ID
   * @returns 交易列表
   */
  async findPaymentTransactions(paymentId: string): Promise<PaymentTransaction[]> {
    return this.transactionRepository.find({
      where: { paymentId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取失败的交易
   *
   * @param limit 限制数量
   * @returns 交易列表
   */
  async findFailedTransactions(limit: number = 20): Promise<PaymentTransaction[]> {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.status = :status', { status: TransactionStatus.FAILED })
      .orderBy('transaction.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * 获取待处理的交易
   *
   * @param limit 限制数量
   * @returns 交易列表
   */
  async findPendingTransactions(limit: number = 20): Promise<PaymentTransaction[]> {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.status IN (:...statuses)', {
        statuses: [TransactionStatus.IN_PROGRESS, TransactionStatus.PENDING_CONFIRMATION],
      })
      .orderBy('transaction.createdAt', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * 获取退款交易
   *
   * @param paymentId 支付ID
   * @returns 退款交易列表
   */
  async findRefundTransactions(paymentId: string): Promise<PaymentTransaction[]> {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.paymentId = :paymentId', { paymentId })
      .andWhere('transaction.type = :type', { type: TransactionType.REFUND })
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 批量更新支付状态
   *
   * @param paymentIds 支付ID数组
   * @param status 新状态
   * @returns 更新的数量
   */
  async updatePaymentsStatus(
    paymentIds: string[],
    status: PaymentStatus,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Payment)
      .set({ status })
      .where('id IN (:...paymentIds)', { paymentIds })
      .execute();

    return result.affected || 0;
  }
}
