/**
 * 支付解析器
 *
 * 提供支付相关的GraphQL查询和变更：
 * - 支付查询（我的支付、支付详情、支付统计）
 * - 支付操作（初始化、确认、取消）
 * - 退款操作（初始化、完成）
 * - 数据分析（支付分析、网关统计）
 *
 * @author Claude
 * @module Ecommerce/Payment
 */

import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { PaymentMethodType, PaymentGateway } from '../entities/payment.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { PaymentService } from '../services/payment.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { GqlAuthGuard } from '../../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../user/user.entity';
import { Logger, BadRequestException } from '@nestjs/common';
import { InputType, Field, ObjectType, Float } from '@nestjs/graphql';

/**
 * 支付初始化输入
 */
@InputType()
export class InitiatePaymentInput {
  @Field()
  orderId: string;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  currency?: string;

  @Field(() => PaymentMethodType)
  methodType: PaymentMethodType;

  @Field(() => PaymentGateway)
  gateway: PaymentGateway;

  @Field({ nullable: true })
  paymentMethodId?: string;
}

/**
 * 退款请求输入
 */
@InputType()
export class RefundRequestInput {
  @Field()
  paymentId: string;

  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field({ nullable: true })
  reason?: string;
}

/**
 * 支付统计输出
 */
@ObjectType()
export class PaymentStatsOutput {
  @Field(() => Int)
  totalPayments: number;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Float)
  successfulAmount: number;

  @Field(() => Int)
  failedCount: number;

  @Field(() => Float)
  refundedAmount: number;

  @Field()
  successRate: number;
}

/**
 * 支付列表输出
 */
@ObjectType()
export class PaymentsPageOutput {
  @Field(() => [Payment])
  payments: Payment[];

  @Field(() => Int)
  total: number;
}

/**
 * 退款结果输出
 */
@ObjectType()
export class RefundResultOutput {
  @Field()
  success: boolean;

  @Field(() => Float)
  refundAmount: number;

  @Field({ nullable: true })
  refundTransactionId?: string;

  @Field()
  message: string;
}

/**
 * 支付分析输出
 */
@ObjectType()
export class PaymentAnalysisOutput {
  @Field(() => Int)
  totalPayments: number;

  @Field(() => Int)
  successfulPayments: number;

  @Field(() => Int)
  failedPayments: number;

  @Field(() => Int)
  cancelledPayments: number;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Float)
  averageAmount: number;

  @Field()
  successRate: number;
}

/**
 * 支付解析器
 */
@Resolver(() => Payment)
export class PaymentResolver {
  private readonly logger = new Logger(PaymentResolver.name);

  constructor(
    private paymentService: PaymentService,
    private paymentRepository: PaymentRepository,
  ) {}

  /**
   * ==================== 查询 ====================
   */

  /**
   * 获取支付详情
   *
   * @param paymentId 支付ID
   * @param user 当前用户
   * @returns 支付信息
   */
  @Query(() => Payment, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async payment(
    @Args('id') paymentId: string,
    @CurrentUser() user: User,
  ): Promise<Payment | null> {
    this.logger.debug(`查询支付: ID=${paymentId}, 用户=${user.id}`);

    const payment = await this.paymentRepository.findById(paymentId);

    // 验证用户权限
    if (payment && payment.userId !== user.id) {
      throw new BadRequestException('无权访问该支付记录');
    }

    return payment;
  }

  /**
   * 获取我的支付列表
   *
   * @param user 当前用户
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns 支付分页结果
   */
  @Query(() => PaymentsPageOutput)
  @UseGuards(GqlAuthGuard)
  async myPayments(
    @CurrentUser() user: User,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<PaymentsPageOutput> {
    this.logger.debug(`查询我的支付: 用户=${user.id}`);

    const [payments, total] = await this.paymentRepository.findUserPayments(
      user.id,
      {
        skip: skip || 0,
        take: take || 10,
      },
    );

    return {
      payments,
      total,
    };
  }

  /**
   * 获取指定状态的支付
   *
   * @param user 当前用户
   * @param status 支付状态
   * @returns 支付列表
   */
  @Query(() => [Payment])
  @UseGuards(GqlAuthGuard)
  async myPaymentsByStatus(
    @CurrentUser() user: User,
    @Args('status', { type: () => PaymentStatus }) status: PaymentStatus,
  ): Promise<Payment[]> {
    this.logger.debug(`查询支付（按状态）: 用户=${user.id}, 状态=${status}`);

    const [payments] = await this.paymentRepository.findUserPayments(user.id, {
      status,
    });

    return payments;
  }

  /**
   * 获取支付交易列表
   *
   * @param paymentId 支付ID
   * @param user 当前用户
   * @returns 交易列表
   */
  @Query(() => [PaymentTransaction])
  @UseGuards(GqlAuthGuard)
  async paymentTransactions(
    @Args('paymentId') paymentId: string,
    @CurrentUser() user: User,
  ): Promise<PaymentTransaction[]> {
    this.logger.debug(`查询支付交易: 支付=${paymentId}, 用户=${user.id}`);

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment || payment.userId !== user.id) {
      throw new BadRequestException('无权访问该支付记录');
    }

    return this.paymentRepository.findPaymentTransactions(paymentId);
  }

  /**
   * 获取我的支付统计
   *
   * @param user 当前用户
   * @returns 支付统计
   */
  @Query(() => PaymentStatsOutput)
  @UseGuards(GqlAuthGuard)
  async myPaymentStats(@CurrentUser() user: User): Promise<PaymentStatsOutput> {
    this.logger.debug(`查询我的支付统计: 用户=${user.id}`);

    const [payments] = await this.paymentRepository.findUserPayments(user.id, {
      take: 999999,
    });

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

  /**
   * 搜索支付
   *
   * @param user 当前用户
   * @param keyword 搜索关键词
   * @param skip 跳过数量
   * @param take 获取数量
   * @returns 支付分页结果
   */
  @Query(() => PaymentsPageOutput)
  @UseGuards(GqlAuthGuard)
  async searchMyPayments(
    @CurrentUser() user: User,
    @Args('keyword') keyword: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<PaymentsPageOutput> {
    this.logger.debug(`搜索我的支付: 用户=${user.id}, 关键词=${keyword}`);

    const [payments, total] = await this.paymentRepository.searchPayments(
      keyword,
      skip || 0,
      take || 10,
    );

    // 过滤：只返回属于当前用户的支付
    const userPayments = payments.filter((p) => p.userId === user.id);

    return {
      payments: userPayments,
      total: userPayments.length,
    };
  }

  /**
   * 获取支付分析（日期范围）
   *
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 分析结果
   */
  @Query(() => PaymentAnalysisOutput)
  async paymentAnalysisByDateRange(
    @Args('startDate', { type: () => String }) startDate: string,
    @Args('endDate', { type: () => String }) endDate: string,
  ): Promise<PaymentAnalysisOutput> {
    this.logger.debug(`查询支付分析: 开始=${startDate}, 结束=${endDate}`);

    const analysis = await this.paymentRepository.getPaymentAnalysisByDateRange(
      new Date(startDate),
      new Date(endDate),
    );

    return {
      totalPayments: analysis.totalPayments,
      successfulPayments: analysis.successfulPayments,
      failedPayments: analysis.failedPayments,
      cancelledPayments: analysis.cancelledPayments,
      totalAmount: analysis.totalAmount,
      averageAmount: analysis.averageAmount,
      successRate: analysis.successRate,
    };
  }

  /**
   * ==================== 变更 ====================
   */

  /**
   * 初始化支付
   *
   * @param user 当前用户
   * @param input 支付初始化输入
   * @returns 新创建的支付
   */
  @Mutation(() => Payment)
  @UseGuards(GqlAuthGuard)
  async initiatePayment(
    @CurrentUser() user: User,
    @Args('input') input: InitiatePaymentInput,
  ): Promise<Payment> {
    this.logger.debug(
      `初始化支付: 用户=${user.id}, 订单=${input.orderId}, 金额=${input.amount}`,
    );

    return this.paymentService.initiatePayment({
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      methodType: input.methodType,
      gateway: input.gateway,
      paymentMethodId: input.paymentMethodId,
    });
  }

  /**
   * 标记支付为处理中
   *
   * @param paymentId 支付ID
   * @param transactionId 交易ID
   * @returns 更新后的支付
   */
  @Mutation(() => Payment)
  async markPaymentAsProcessing(
    @Args('paymentId') paymentId: string,
    @Args('transactionId') transactionId: string,
  ): Promise<Payment> {
    this.logger.debug(
      `标记支付为处理中: 支付=${paymentId}, 交易=${transactionId}`,
    );

    return this.paymentService.markPaymentAsProcessing(paymentId, transactionId);
  }

  /**
   * 标记支付为成功
   *
   * @param paymentId 支付ID
   * @param transactionId 交易ID
   * @param gatewayTransactionId 网关交易ID
   * @returns 更新后的支付
   */
  @Mutation(() => Payment)
  async markPaymentAsSucceeded(
    @Args('paymentId') paymentId: string,
    @Args('transactionId') transactionId: string,
    @Args('gatewayTransactionId') gatewayTransactionId: string,
  ): Promise<Payment> {
    this.logger.debug(
      `标记支付为成功: 支付=${paymentId}, 交易=${transactionId}, 网关ID=${gatewayTransactionId}`,
    );

    return this.paymentService.markPaymentAsSucceeded(
      paymentId,
      transactionId,
      gatewayTransactionId,
    );
  }

  /**
   * 标记支付为失败
   *
   * @param paymentId 支付ID
   * @param transactionId 交易ID
   * @param errorCode 错误代码
   * @param errorMessage 错误信息
   * @returns 更新后的支付
   */
  @Mutation(() => Payment)
  async markPaymentAsFailed(
    @Args('paymentId') paymentId: string,
    @Args('transactionId') transactionId: string,
    @Args('errorCode') errorCode: string,
    @Args('errorMessage') errorMessage: string,
  ): Promise<Payment> {
    this.logger.debug(
      `标记支付为失败: 支付=${paymentId}, 交易=${transactionId}, 错误=${errorCode}`,
    );

    return this.paymentService.markPaymentAsFailed(
      paymentId,
      transactionId,
      errorCode,
      errorMessage,
    );
  }

  /**
   * 取消支付
   *
   * @param user 当前用户
   * @param paymentId 支付ID
   * @returns 更新后的支付
   */
  @Mutation(() => Payment)
  @UseGuards(GqlAuthGuard)
  async cancelPayment(
    @CurrentUser() user: User,
    @Args('paymentId') paymentId: string,
  ): Promise<Payment> {
    this.logger.debug(`取消支付: 用户=${user.id}, 支付=${paymentId}`);

    // 验证权限
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment || payment.userId !== user.id) {
      throw new BadRequestException('无权操作该支付记录');
    }

    return this.paymentService.cancelPayment(paymentId, '用户取消');
  }

  /**
   * 初始化退款
   *
   * @param user 当前用户
   * @param input 退款请求输入
   * @returns 退款结果
   */
  @Mutation(() => RefundResultOutput)
  @UseGuards(GqlAuthGuard)
  async initiateRefund(
    @CurrentUser() user: User,
    @Args('input') input: RefundRequestInput,
  ): Promise<RefundResultOutput> {
    this.logger.debug(
      `初始化退款: 用户=${user.id}, 支付=${input.paymentId}, 金额=${input.amount || '全额'}`,
    );

    // 验证权限
    const payment = await this.paymentRepository.findById(input.paymentId);
    if (!payment || payment.userId !== user.id) {
      throw new BadRequestException('无权操作该支付记录');
    }

    const result = await this.paymentService.initiateRefund({
      paymentId: input.paymentId,
      amount: input.amount,
      reason: input.reason,
    });

    return {
      success: result.success,
      refundAmount: result.refundAmount,
      refundTransactionId: result.refundTransactionId,
      message: result.message,
    };
  }

  /**
   * 完成退款
   *
   * @param paymentId 支付ID
   * @param refundTransactionId 退款交易ID
   * @param refundAmount 退款金额
   * @param gatewayRefundId 网关退款ID
   * @returns 退款结果
   */
  @Mutation(() => RefundResultOutput)
  async completeRefund(
    @Args('paymentId') paymentId: string,
    @Args('refundTransactionId') refundTransactionId: string,
    @Args('refundAmount', { type: () => Float }) refundAmount: number,
    @Args('gatewayRefundId') gatewayRefundId: string,
  ): Promise<RefundResultOutput> {
    this.logger.debug(
      `完成退款: 支付=${paymentId}, 交易=${refundTransactionId}, 金额=${refundAmount}`,
    );

    const result = await this.paymentService.completeRefund(
      paymentId,
      refundTransactionId,
      refundAmount,
      gatewayRefundId,
    );

    return {
      success: result.success,
      refundAmount: result.refundAmount,
      refundTransactionId: result.refundTransactionId,
      message: result.message,
    };
  }
}
